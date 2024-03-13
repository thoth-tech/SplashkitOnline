'''This file contains the core binding generation logic and main function'''

import json
import sys
import copy
import math
import re
from enum import Enum
from json_api_reader import Type, Param, read_json_api, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp
from javascript_bindings_preamble import CPPPreamble, JSPreamble

# ----------------------------------
# ---------- Structures -----------
# ----------------------------------

class StreamingCodeIndenter:
    '''Utility class to format the output code readably'''

    def __init__(self, indent_symbol="    "):
        self.indent_level = 0
        self.indent_symbol = indent_symbol

    def indent_next(self, code):
        '''parses the next few lines of code and returns an indented version'''

        lines = code.split("\n")
        for i, line in enumerate(lines):

            line = line.strip()
            # Indenting for the next line
            next_indent_level = (self.indent_level +
                                 line.count("{") +
                                 line.count("#if") -
                                 line.count("}") -
                                 line.count("#endif")
                                 )
            # Unindent current line if starts with:
            self.indent_level -= 1 if (line.startswith("#endif")
                                       or line.startswith("#else")
                                       or line.startswith("#endif")
                                       or line.startswith("}")
                                       ) else 0

            lines[i] = (self.indent_symbol * self.indent_level) + (line)

            if lines[i].strip() == "":
                lines[i] = ""

            self.indent_level = next_indent_level

        code = "\n".join(lines)

        return code



class MarshaledParam:
    '''Class that stores all the information needed to generate code to pass a
    parameter in/out from JS/C++'''

    def __init__(self, name, cpp_type, is_class_member=False, index=""):
        self.name = name
        self.is_class_member = is_class_member
        self.index = index

        # The final computed types
        self.cpp_type = copy.deepcopy(cpp_type)
        self.boundary = [copy.deepcopy(cpp_type)]
        self.js_type = copy.deepcopy(cpp_type)

        # Information about the parameter
        self.is_return = False
        self.return_output_via_return = False
        self.write_in = True
        self.write_out = True

        # The generated code used on the C++ side
        self.cpp_convert_in = ""
        self.cpp_out_params = []
        self.cpp_convert_out = ""
        self.cpp_return = ""

        # The generated code used on the JavaScript side
        self.js_alloc_sizes = []
        self.js_convert_in = ""
        self.js_write_ref = ""
        self.js_declare_ref = ""
        self.js_read_ref = ""
        self.js_out_params = []
        self.js_convert_out = ""
        self.js_dealloc = ""
        self.js_new = ""
        self.js_constructor = ""
        self.js_type_check = ""
        self.js_return = ""

    def qual_name(self):
        if self.is_class_member:
            return "this." + self.name + self.index

        return self.name

    def __str__(self):
        return (
            f'{"return " if self.is_return else ""}'
            f'{self.cpp_type.pretty_print()} -> '
            f'{"in" if self.write_in else ""}'
            f'{"out" if self.write_out else ""}'
            f'{"ret" if self.return_output_via_return else ""}'
            f'{", ".join([x.pretty_print() for x in self.boundary])} -> '
            f'{self.js_type.pretty_print()},{{\n'
            f'C++ Side\n'
            f'{self.cpp_convert_in}'
            f'Passes: {self.cpp_out_params}\n'
            f'{self.cpp_convert_out}'
            f'{self.cpp_return}'
            f'\n'
            f'JavaScript Side\n'
            f'{self.js_type_check}'
            f'{self.js_new}'
            f'StackAllocs: {self.js_alloc_sizes}\n'
            f'{self.js_convert_in}'
            f'{self.js_write_ref}'
            f'{self.js_declare_ref}'
            f'{self.js_read_ref}'
            f'Passes: {self.js_out_params}\n'
            f'{self.js_convert_out}'
            f'{self.js_dealloc}'
            f'{self.js_return}'
            f'}}\n)')

    def __repr__(self):
        return (f'{"return " if self.is_return else ""}'
            f'{self.cpp_type.pretty_print()}' )




class MarshaledFunction:
    ''' A class storing information about a function that contains
    all the information needed for the final code-gen'''

    def __init__(self, name, unique_name, inouts):
        self.name = name
        self.unique_name = unique_name
        self.inouts = inouts

    def get_param(self, index):
        i = 0
        for param in self.inouts:
            if param.is_return:
                continue
            if i == index:
                return param
            i += 1
        return None

    def __repr__(self):
        return f"({self.name},{self.unique_name},{[x.__repr__() for x in self.inouts].__repr__()})"


NumericalType = Enum('NumericalType', 'signed unsigned floating')

class TypeMemoryInfo:
    ''' A class that stores information about a type'''

    def __init__(self, size, heap, alignment=None, fields=None, numerical_type=None):
        self.size = size
        self.numerical_type = numerical_type
        self.heap = heap
        self.alignment = alignment if alignment is not None else size
        self.divisor = int(math.log2(self.alignment))
        self.fields = fields

    def is_integer(self):
        return (self.numerical_type == NumericalType.signed or
            self.numerical_type == NumericalType.unsigned)

    def is_float(self):
        return self.numerical_type == NumericalType.floating


class TypeEnvironment:
    '''A class that stores set of types and how they related'''

    def __init__(self, api):
        self.api = api
        self.type_memory_infos = {}

        self.add_numerical_type("int",              4, NumericalType.signed)
        self.add_numerical_type("unsigned int",     4, NumericalType.unsigned)
        self.add_numerical_type("unsigned short",   2, NumericalType.unsigned)
        self.add_numerical_type("float",            4, NumericalType.floating)
        self.add_numerical_type("double",           8, NumericalType.floating)
        self.add_numerical_type("char",             1, NumericalType.signed)
        self.add_numerical_type("uint8_t",          1, NumericalType.unsigned)
        self.add_numerical_type("int8_t",           1, NumericalType.signed)

        self.add_type("bool", TypeMemoryInfo(1, "U8"))
        self.add_type("string", TypeMemoryInfo(4, "U32"))
        self.add_type("*", TypeMemoryInfo(4, "U32"))
        self.add_type("<ENUM>", TypeMemoryInfo(1, "U8"))
        self.add_type("vector", TypeMemoryInfo(4*3, "U32"))

    def resolve_type(self, t):
        '''Follows typedefs recursively to resolve to the actual type'''

        if t.typename in self.api.typedefs:
            t = copy.deepcopy(t)
            original_typename = t.typename
            t.replace_typename(self.api.typedefs[t.typename])
            return self.resolve_type(
                t) if t.typename != original_typename else t
        return t

    def get_type_memory_info(self, _type):
        '''Returns informaton about how a type is stored in memory'''

        # First resolve the type
        _type = self.resolve_type(_type)

        # If it's a pointer, return the size of a pointer
        if _type.is_pointer():
            return self.type_memory_infos["*"]

        # If it's an enum, return the size of an enum
        for enum in self.api.enums:
            if _type.typename == enum[0]:
                return self.type_memory_infos["<ENUM>"]

        # Otherwise, if it's not a currently known type,
        # assume its a struct and calculate the size/offsets
        if _type.typename not in self.type_memory_infos:
            self.add_type(_type.typename, calculate_struct_size_and_offsets(
                self, self.api.structs[_type.typename]))

        # If it's a known type, then return the information
        if _type.typename in self.type_memory_infos:
            return self.type_memory_infos[_type.typename]

        # If we failed to get the type, print a warning and return None
        print(f"Failed to get memory info for type: {_type.typename}")
        return None

    def add_type(self, typename, info):
        '''Adds a type to the environment'''
        self.type_memory_infos[typename] = info

    def add_numerical_type(self, typename, size, numerical_type):
        '''Adds a numerical type to the environment, automatically setting the heap field'''
        heap_prefix = ""
        if numerical_type == NumericalType.signed:
            heap_prefix = ""
        elif numerical_type == NumericalType.unsigned:
            heap_prefix = "U"
        elif numerical_type == NumericalType.floating:
            heap_prefix = "F"

        heap = heap_prefix + str(size * 8)

        self.type_memory_infos[typename] = TypeMemoryInfo(size, heap, numerical_type=numerical_type)

    def is_primitive(self, typename):
        '''Returns if a type is a primitive or not.'''

        if typename in self.type_memory_infos and self.type_memory_infos[typename].numerical_type != None:
            return True
        if self.is_enum(typename):
            return True
        if typename == "bool":
            return True
        return False

    def is_enum(self, typename):
        for enum in self.api.enums:
            if typename == enum[0]:
                return True
        return False

# ----------------------------------------
# ---------- Data Marshalling -----------
# ----------------------------------------


def get_boundary_name(name, index):
    '''Returns a variable name to be used at the boundary'''
    assert index > 0  # 1 indexed
    if index == 1:
        return name
    return f"__bndr_{name}_{index}"


def get_conversion_name(name, index):
    '''Returns a variable name to be used when converting'''
    return f"__conv_{index}{name}"

def get_pointer_name(name, i=0):
    '''Returns a variable name to be used when creating a pointer'''
    return f"{name}_ptr{i}"


# ---------- Computing Struct/Type Information ----------
def calculate_struct_size_and_offsets(types_env, struct):
    '''Calculates the size of a struct and the offsets of its fields'''
    struct_offsets = {}

    current_offset = 0
    largest_field = 1

    # For every field in the struct:
    for field in struct.fields:
        # Get the memory information on the field
        mem_info = types_env.get_type_memory_info(
            types_env.resolve_type(field.type))

        # Update the 'largest_field'
        largest_field = max(largest_field, mem_info.size)

        # Round current_offset up to the nearest aligned address
        current_offset = math.ceil(current_offset / mem_info.alignment) * mem_info.alignment

        # The offset of the field is our current_offset; store this
        struct_offsets[field.name] = current_offset

        elem_count = 1

        # Calculate the number of elements
        for dim in field.type.array_dimension_sizes():
            elem_count *= dim

        # Increment the current offset by the overall size of the field
        current_offset += mem_info.size * elem_count

    return TypeMemoryInfo(current_offset, None, largest_field, struct_offsets)


def compute_type_memory_information(api):
    '''Creates a TypeEnvironment and fills it with SplashKit types'''
    types_env = TypeEnvironment(api)

    for struct in api.structs:
        types_env.add_type(
            struct, calculate_struct_size_and_offsets(types_env, api.structs[struct]))

    return types_env


# ---------- Type Specific Data Marshalling Methods ----------

def generate_js_type_check(check, error):
    '''Generates code to check if an incoming parameter matches the expected type'''

    return f"if({check})throw new SplashKitArgumentError({error});\n"

def make_js_type_check_pair(name, primitive_type=None, object_type=None):
    '''Generates code to check if an incoming parameter matches the expected type'''

    # If it's a primitive, check the type directly with 'typeof'
    if primitive_type is not None:
        return (
            f"typeof {name} !== '{primitive_type}'",
            f"typeof {name} === '{primitive_type}'",
            f"'Incorrect call to <FunctionName>: "
            f"{name} needs to be a {primitive_type}, not a '+typeof {name}")

    # If it's an object, check the constructor's name
    if object_type is not None:
        return (
            f"typeof {name} !== 'object' || {name}.constructor != {object_type}",
            f"typeof {name} === 'object' && {name}.constructor == {object_type}",
            f"'Incorrect call to <FunctionName>: "
            f"{name} needs to be a {object_type}, not a '+typeof {name}")

    return ("false","Failed to make error check!")


def heap_allocate_vector_to_array(types_env, _type, address_and_divisor):
    '''Marshals a JavaScript array by converting it to a C array and back'''

    # We cannot return via 'return', as we need to return two things:
    # - the data
    # - a length

    # While it was chosen to pass arrays as two parameters, another option
    # is to pass as a pointer to a structure (containing those two fields).
    # Perhaps this would make the code simpler, so for anyone doing any
    # refactoring here, feel free to try it out.

    _type.return_output_via_return = False

    # Get the template_type
    template_type = _type.boundary[0].template_type#types_env.resolve_type(copy.deepcopy(_type.boundary[0].template_type))

    # Generate the marshalling code for the template_type, store it as 'inner_type'
    inner_type = marshal_parameter(types_env, Param("x", template_type), True)

    inner_type.boundary[0].reference = False

    _type.js_type.typename = "array"
    _type.js_type.template_type = inner_type.js_type

    # Add another boundary parameter to pass the length
    _type.boundary.append(Type(
        "int",_type.boundary[0].const,
        copy.deepcopy(_type.boundary[0].storage),
        _type.boundary[0].reference)
    )

    inner_type_size = str(types_env.get_type_memory_info(inner_type.boundary[0]).size)

    # Make the current boundary parameter a pointer to the inner type
    # So `vector<int*>&` becomes `int**&`
    inner_type.boundary[0].storage.append(StorageModifier_Pointer)
    _type.boundary[0].replace_typename(inner_type.boundary[0])
    _type.boundary[0].template_type = None

    # Setup variable names for code generation
    param_var = _type.qual_name()
    conv_var = get_conversion_name(_type.name, 0)
    conv_var_index = get_conversion_name(_type.name, 1)
    length_boundary_var = get_boundary_name(_type.name, 2)
    ptr_var, pre_div = address_and_divisor
    length_ptr_var = get_pointer_name(_type.name, 1)
    elem_ptr_var = get_pointer_name('x', 0)

    # Gemerate the type declaration for the original vector
    type_decl = generate_cpp_decl(_type.cpp_type.asValue(), conv_var)

    # Convert in/out by calling heapAllocatedArrayToVector/heapAllocateVectorToArray
    # Also pass a lambda into the funcion that handles conversion of the inner type
    _type.cpp_convert_in = (
        f"{type_decl} = heapAllocatedArrayToVector({param_var}, {length_boundary_var}, "
        f"[](auto x){{\n{inner_type.cpp_convert_in} return {inner_type.cpp_out_params[0]};\n}});\n")
    _type.cpp_out_params = [conv_var]
    _type.cpp_convert_out = (
        f"heapAllocateVectorToArray({conv_var}, {param_var}, {length_boundary_var}, "
        f"[](auto x){{\n{inner_type.cpp_return}}});\n")

    _type.cpp_return = "ERROR: Array cannot be returned as a single value (ignore if debug)"


    # Similar to the C++ side
    _type.js_convert_in = (
        f"let {conv_var} = JSArrayToHeapArray({param_var}, "
        f"function(x, {elem_ptr_var}){{\n{inner_type.js_convert_in}{inner_type.js_write_ref}}}, "
        f"{inner_type_size});\n")
    _type.js_convert_in += f"let {conv_var_index} = {param_var}.length;\n"

    _type.js_out_params = [conv_var, conv_var_index]

    if _type.boundary[0].is_reference():
        # If we the array can be modified, we need to allocate space on the stack
        # to store the data pointer and length, so they can be modified
        _type.js_alloc_sizes = [
            types_env.get_type_memory_info(Type('void', True, [StorageModifier_Pointer])).size,
            types_env.get_type_memory_info(Type('int', None, [], True)).alignment]
        ptr_addr = generate_js_bitshift(ptr_var, 2 - pre_div)

        # We also need to write/read to/from the space we allocated on the stack
        _type.js_write_ref = f"Module.HEAPU32[{ptr_addr}] = {conv_var};\n"
        _type.js_write_ref += f"Module.HEAPU32[{length_ptr_var}>>2] = {conv_var_index};\n"

        _type.js_declare_ref = f"let {conv_var};\n"
        _type.js_declare_ref += f"let {conv_var_index};\n"

        _type.js_read_ref = f"{conv_var} = Module.HEAPU32[{ptr_addr}];\n"
        _type.js_read_ref += f"{conv_var_index} = Module.HEAPU32[{length_ptr_var}>>2];\n"
        _type.js_out_params = [ptr_var, length_ptr_var]

    # Similar to the C++ side
    _type.js_convert_out = (
        f"UpdateJSArrayFromHeapArray({param_var}, {conv_var}, {conv_var_index}, "
        f"function({elem_ptr_var}){{\n{inner_type.js_new}{inner_type.js_declare_ref}"
        f"{inner_type.js_read_ref}{inner_type.js_return}}}, "
        f"{inner_type_size});\n")

    _type.js_return = "ERROR: Array cannot be returned as a single value"


    # Make sure we dealloc the data, and also dealloc the inner type too
    if inner_type.js_dealloc != "":
        _type.js_dealloc = (
            f"DeallocHeapArray({conv_var}, {conv_var_index}, "
            f"function({elem_ptr_var}){{\n{inner_type.js_declare_ref}"
            f"{inner_type.js_read_ref}{inner_type.js_dealloc}}}, {inner_type_size});\n")
    else:
        _type.js_dealloc = (
            f"DeallocHeapArray({conv_var}, {conv_var_index}, "
            f"function({elem_ptr_var}){{}}, {inner_type_size});\n")

    _type.js_new = f"let {param_var} = [];\n"
    _type.js_constructor = f"[]"
    _type.js_type_check = make_js_type_check_pair(
        param_var, object_type="Array")


def heap_allocate_string(types_env, _type, address_and_divisor):
    '''Marshalls a JavaScript string by converting it to a C string and back'''

    _type.js_type.typename = "string"

    # Replace our typename (string) with char*
    _type.boundary[0].replace_typename(Type("char", True, [StorageModifier_Pointer]))

    # Setup variable names for code generation
    param_var = _type.qual_name()
    conv_var = get_conversion_name(_type.name, 0)
    ptr_var, pre_div = address_and_divisor

    # Convert in/out by calling heapAllocatedStringToCPPString/heapAllocateString
    _type.cpp_convert_in = f"string {conv_var} = heapAllocatedStringToCPPString({param_var});\n"
    _type.cpp_out_params = [conv_var]
    _type.cpp_convert_out = f"heapAllocateString({param_var}, {conv_var});\n"
    _type.cpp_return = (
        f"char* temp = nullptr;\n"
        f"heapAllocateString(temp, {param_var});\n"
        f"return temp;\n")

    # Similar to the C++ side
    _type.js_convert_in = f"let {conv_var} = JSStringToHeapString({param_var});\n"

    _type.js_out_params = [conv_var]

    # If we are a reference, stack allocate memory for a pointer to the string,
    # and pass that into the function instead
    if _type.boundary[0].is_reference():
        _type.js_alloc_sizes = [
            types_env.get_type_memory_info(Type('void', True, [StorageModifier_Pointer])).size]

        ptr_addr = generate_js_bitshift(ptr_var, 2 - pre_div)

        _type.js_write_ref = f"Module.HEAPU32[{ptr_addr}] = {conv_var};\n"
        _type.js_declare_ref = f"let {conv_var};\n"
        _type.js_read_ref = f"{conv_var} = Module.HEAPU32[{ptr_addr}];\n"
        _type.js_out_params = [ptr_var]

    # Similar to the C++ side
    _type.js_convert_out = f"{param_var} = HeapStringToJSString({conv_var});\n"
    _type.js_return = f"return HeapStringToJSString(Module.HEAPU32[{ptr_var}>>2]);\n"

    # Make sure we dealloc the string
    _type.js_dealloc = f"DeallocHeapString({conv_var});\n"
    _type.js_new = f"let {param_var};\n"
    _type.js_constructor = f"\"\""
    _type.js_type_check = make_js_type_check_pair(param_var, primitive_type="string")


def pass_value_struct_as_pointer(types_env, _type, address_and_divisor):
    '''Marshalls a SplashKit object by reading/writing it to the stack'''

    # It's impossible to pass as struct on its own,
    # so make raw structs a const reference instead
    # if they are passed as a value type
    if _type.boundary[0].is_value():
        _type.boundary[0].const = True
        _type.boundary[0].reference = True

    assert _type.boundary[0].is_reference(), \
        "Passing struct as something other than a reference not supported"

    _type.return_output_via_return = False

    _type.js_type.typename = sanitize_js_struct_name(_type.cpp_type.typename)

    # Setup variable names for code generation
    param_var = _type.qual_name()
    ptr_var, pre_div = address_and_divisor
    assert pre_div == 0

    # We can just pass the structure around by name in C++
    _type.cpp_out_params = [param_var]
    _type.cpp_return = f"return {param_var};\n"

    _type.js_out_params = [ptr_var]

    # Note: It _is_ a reference - this is just to match the style of the other functions
    if _type.boundary[0].is_reference():
        # Allocate memory to store the entire structure on the stack
        _type.js_alloc_sizes = [
            types_env.get_type_memory_info(_type.boundary[0].asValue()).size]
        # Read/write the contents of the JavaScript object to that memory
        _type.js_read_ref = f"{param_var}.read({ptr_var});\n"
        _type.js_write_ref = f"{param_var}.write({ptr_var});\n"

        _type.js_out_params = [ptr_var]

    _type.js_new = f"let {param_var} = new {_type.js_type.typename}();\n"
    _type.js_constructor = f"new {_type.js_type.typename}()"
    _type.js_return = f"return {param_var};\n"
    _type.js_type_check = make_js_type_check_pair(param_var, object_type=_type.js_type.typename)


def pass_typedefed_pointer(types_env, _type, address_and_divisor):
    '''Marshalls a pointer to a SplashKit object while wrapping it'''

    _type.js_type.typename = sanitize_js_struct_name(_type.cpp_type.typename)

    # Setup variable names for code generation
    param_var = _type.qual_name()
    conv_var = get_conversion_name(_type.name, 0)
    struct_name = _type.js_type.typename

    # Pass it 90% the same as a primitive (it is a pointer after all)
    pass_primitive(types_env, _type, address_and_divisor, final_name=conv_var, typedef=struct_name)

    # Just wrap/unwrwap it as it comes in and out, so we don't just give
    # the user a number.
    _type.js_convert_in = f"let {conv_var} = {param_var}.ptr;\n"
    _type.js_declare_ref = f"let {conv_var};\n"
    _type.js_convert_out = f"{param_var} = new {struct_name}({conv_var});\n"
    _type.js_type_check = make_js_type_check_pair(param_var, object_type=struct_name)
    _type.js_constructor = f"new {struct_name}()"


def pass_primitive(types_env, _type, address_and_divisor, final_name=None, typedef=None):
    '''Marshalls a primitive type by sending it directly, or stack allocating if a reference'''

    mem_info = types_env.get_type_memory_info(_type.boundary[0].asValue())

    if typedef == None:
        if _type.cpp_type.is_pointer():
            _type.js_type.typename = "number"
            _type.js_constructor = f"0"
        elif mem_info.numerical_type != None:
            _type.js_type.typename = "number"
            _type.js_constructor = f"0"
        elif types_env.is_enum(_type.cpp_type.typename):
            _type.js_type.typename = "number"
            _type.js_constructor = \
                list([x for x in types_env.api.enums if x[0] == _type.cpp_type.typename][0][1])[0]
        elif _type.cpp_type.typename == "bool":
            _type.js_type.typename = "boolean"
            _type.js_constructor = f"false"
        else:
            assert False, "Failed to pass primitive\n" + str(_type)
    else:
        _type.js_type.typename = typedef


    # Setup variable names for code generation
    param_var = _type.qual_name()
    ptr_var, pre_div = address_and_divisor

    # Just pass it straight in/out by default
    _type.cpp_out_params = [param_var]
    _type.cpp_return = f"return {param_var};\n"

    final_name = param_var if final_name is None else final_name

    _type.js_out_params = [final_name]

    # If it's passed in by reference, allocate space for the type,
    # write it in, and pass a pointer. Then read that back out afterwards.
    if _type.boundary[0].is_reference():
        _value_type = copy.deepcopy(_type.boundary[0])
        _value_type.reference = False

        heap, divisor, size = mem_info.heap, mem_info.divisor, mem_info.size
        _type.js_alloc_sizes = [size]
        ptr_addr = generate_js_bitshift(ptr_var, divisor - pre_div)

        _type.js_write_ref = f"Module.HEAP{heap}[{ptr_addr}] = {final_name};\n"
        _type.js_read_ref = f"{final_name} = Module.HEAP{heap}[{ptr_addr}];\n"

        _type.js_out_params = [ptr_var]

    _type.js_return = f"return {final_name};\n"
    _type.js_type_check = make_js_type_check_pair(param_var, primitive_type=_type.js_type.typename)


def pass_c_array(types_env, _type, address_and_divisor):
    '''Marshals a JavaScript array by converting it to a C array and back'''

    assert _type.is_return == False, "Cannot return C array"

    # Get the type of a single element
    element_type = _type.cpp_type.as_element()
    # We can make a small optimization if the elements are primitives
    element_info = types_env.get_type_memory_info(element_type)
    is_primitive = types_env.is_primitive(element_type.typename)

    # Get information about how the field is stored in memory
    mem_info = types_env.get_type_memory_info(_type.cpp_type)


    # Setup variable names for code generation
    param_var = _type.qual_name()
    ptr_var, pre_div = address_and_divisor
    divisor = mem_info.divisor - pre_div
    temp_ptr = f"{_type.name}_ptr"

    array_dims = _type.cpp_type.array_dimension_sizes()
    total_elems = 1
    for dim in array_dims:
        total_elems *= dim

    _type.js_alloc_sizes = [total_elems * element_info.size]
    _type.js_out_params = [ptr_var]

    # Setup a pointer variable used when iterating over the multiple dimensions
    # Initialize it to the initial pointer - pre-bit shift it if the elements are primitives:
    # This avoids bit shifting it every time
    if is_primitive:
        ptr_code = f"let {temp_ptr} = {generate_js_bitshift(ptr_var, divisor)};\n"
    else:
        divisor = 0
        ptr_code = f"let {temp_ptr} = {ptr_var};\n"

    # Note: Here we generate a string that will lookup the element's
    # position in the array (example: [i0][i1]). This is then passed into
    # marshal_parameter
    index = "".join(f"[i{i}]" for i, size in enumerate(array_dims))
    # Generate the marshalling code for the element_type, store it as 'inner_type'
    inner_type = marshal_parameter(types_env, Param(_type.name, element_type, is_class_member=True), True, (temp_ptr, divisor), index)
    inner_type.boundary[0].reference = False

    _type.js_constructor = "function(){\n"
    _type.js_write_ref = ptr_code
    _type.js_read_ref  = ptr_code

    # Create a loop for each dimension to the array
    # Inside each loop, create a new Array
    for i, size in enumerate(array_dims):
        lastiter = f"i{i - 1}"
        iter = f"i{i}"
        lastarray = f"a{i - 1}"
        array = f"a{i}"
        if i == 0:
            _type.js_constructor += f"let {array} = new Array({size});\n"
        else:
            _type.js_constructor += f"let {array} = {lastarray}[{lastiter}] = new Array({size});\n"

        loop_code = f"for (let {iter} = 0; {iter} < {size}; {iter}++){{\n"
        _type.js_constructor += loop_code
        _type.js_write_ref += loop_code
        _type.js_read_ref  += loop_code

    # In the innermost loop, we assign the individual values.
    _type.js_constructor += f"{array}[{iter}] = {inner_type.js_constructor};\n"
    _type.js_write_ref += inner_type.js_write_ref
    _type.js_read_ref += inner_type.js_read_ref

    # Increment the current address
    if is_primitive:
        increment_ptr_code = f"{_type.name}_ptr += 1;\n"
    else:
        increment_ptr_code = f"{_type.name}_ptr += {element_info.size};\n"
    _type.js_write_ref += increment_ptr_code
    _type.js_read_ref  += increment_ptr_code

    # Balance the brackets
    end_brackets = "}\n" * len(array_dims)
    _type.js_constructor += end_brackets
    _type.js_write_ref += end_brackets
    _type.js_read_ref  += end_brackets

    # Return the outermost array
    _type.js_constructor += "return a0;\n}()"


def pass_js_function(types_env, _type, address_and_divisor):
    '''Passes a JavaScript function; makes a pointer that can be called from C and passes it'''
    #assert not _type.write_out, "Cannot return a function pointer"
    _type.write_out = False
    _type.js_type.typename = "function"

    # Setup variable names for code generation
    param_var = _type.qual_name()
    conv_var = get_conversion_name(_type.name, 0)
    typedef = _type.js_type.typename

    # Pass it 90% the same as a primitive (it is a pointer after all)
    pass_primitive(types_env, _type, address_and_divisor, final_name=conv_var, typedef=typedef)

    wasm_sig = ""
    def type_to_sig_char(_type):
        if _type.is_pointer():
            return "i"
        if _type.typename == "int":
            return "i"
        if _type.typename == "float":
            return "f"
        if _type.typename == "double":
            return "d"
        if _type.typename == "void":
            return "v"
        assert False, "Could not convert type to wasm signature char:\n" + str(_type)

    wasm_sig += type_to_sig_char(_type.boundary[0].function_type.return_type)
    for param in _type.boundary[0].function_type.parameters:
        wasm_sig += type_to_sig_char(param.type)
    # Just add the JavaScript function it as it comes in
    # Emscripten will handle not adding it multiple times on its own
    _type.js_convert_in = f"let {conv_var} = Module.addFunction({param_var}, '{wasm_sig}');\n"
    _type.js_type_check = make_js_type_check_pair(param_var, primitive_type="function")
    _type.js_constructor = f"new Function('')"


def value_like(_type):
    '''Returns if a type behaves syntactically like a value type'''
    return _type.is_value() or (
        _type.is_reference() and not _type.is_pointer() and not _type.is_array())


# ---------- The Main Marshalling Functions ----------
def marshal_parameter(types_env, param, return_value=False, address_and_divisor = None, index=""):
    '''Works out how to marshal a parameter, and returns a filled MarshaledParam'''
    marshaled_param = MarshaledParam(param.name, param.type, param.is_class_member, index)

    if hasattr(param, 'original_name'):
        marshaled_param.original_name = param.original_name

    # Handle if the parameter was the 'return' of a function
    marshaled_param.return_output_via_return = return_value
    marshaled_param.is_return = return_value

    # Don't write in if it's a return value
    marshaled_param.write_in = not return_value

    # If it's the function's return, treat it like a non-const reference parameter
    if return_value:
        marshaled_param.boundary[0].reference = True
        marshaled_param.boundary[0].const = False

    # If the param was passed in by value, it would have made a copy
    # Therefore we mark the incoming parameter as not writing out, as it won't
    # be changed
    if marshaled_param.boundary[0].is_value():
        marshaled_param.write_out = False

    # We also don't write out if its const
    if marshaled_param.boundary[0].const:
        marshaled_param.write_out = False

    # Now resolve the type so future checks are done on the underlying type
    marshaled_param.boundary[0] = types_env.resolve_type(
        marshaled_param.boundary[0])

    boundary_type = marshaled_param.boundary[0]

    #if not types_env.is_primitive(boundary_type.typename) and boundary_type.is_value():
    #    marshaled_param.boundary[0].const = True
    #    marshaled_param.boundary[0].reference = True

    if address_and_divisor == None:
        address_and_divisor = (get_pointer_name(marshaled_param.name, 0), 0)

    array_dims = marshaled_param.cpp_type.array_dimension_sizes()

    # Arrays require special handling
    if len(array_dims) > 0:
        pass_c_array(types_env, marshaled_param, address_and_divisor)
    # Handle passing JS functions (for callbacks and such)
    elif boundary_type.function_type != None:
        pass_js_function(types_env, marshaled_param, address_and_divisor)
    # If the type is a vector, then we need to pass it in via a heap allocation
    elif boundary_type.typename == "vector" and value_like(boundary_type):
        heap_allocate_vector_to_array(types_env, marshaled_param, address_and_divisor)
    # If it's a string, similarly we pass it in by heap allocating it and passing the pointer
    elif boundary_type.typename == "string" and value_like(boundary_type):
        heap_allocate_string(types_env, marshaled_param, address_and_divisor)
    # If type is a non primitive type, then ensure it is a passed by pointer at least
    elif not types_env.is_primitive(boundary_type.typename) and value_like(boundary_type):
        pass_value_struct_as_pointer(types_env, marshaled_param, address_and_divisor)
    # If type is just a typedef for a pointer, wrap it as it comes in/out
    elif marshaled_param.cpp_type.typename in types_env.api.typedefs:
        pass_typedefed_pointer(types_env, marshaled_param, address_and_divisor)
    # If type is a primitive type, pass it as it is
    elif types_env.is_primitive(boundary_type.typename) or boundary_type.is_pointer():
        pass_primitive(types_env, marshaled_param, address_and_divisor)
    else:
        assert False, "Couldn't marshal type!\n"+str(param)

    return marshaled_param


def calculate_marshalled_function(types_env, function_signature):
    '''Works out how to marshal a function, and returns a filled MarshaledFunction'''

    # The name of the 'return parameter'
    return_name = "_out"

    # If it's void, there's no return parameter
    if function_signature.return_type.typename == "void":
        return_param = []
    else:
        # Otherwise marshal the return
        return_param = [marshal_parameter(
            types_env, Param(return_name, function_signature.return_type), True)]

    # Marshal the function's parameters
    params = [marshal_parameter(types_env, x) for x in function_signature.parameters]

    return MarshaledFunction(
        function_signature.name,
        function_signature.unique_name,
        return_param + params
    )


def compute_marshalled_functions(types_env, functions):
    '''Marshalls all SplashKit functions and returns a list of them'''
    return [calculate_marshalled_function(types_env, func) for func in functions]


# ------------------------------------
# ---------- C++ Code Gen -----------
# ------------------------------------


def generate_cpp_decl(_type, name):
    '''Generates a C++ style declaration for a type'''
    if _type.function_type != None:
        return generate_cpp_decl(
            _type.function_type.return_type,
            "(*" + name + ")("+generate_cpp_parameter_list(_type.function_type.parameters)+")"
        )

    return (
        ("const " if _type.const else "")
        + _type.typename
        + (
            "" if _type.template_type is None else (
                f"<{generate_cpp_decl( _type.template_type, '')}>")
        )
        + "".join([storage_modifier_cpp(x) for x in _type.storage])
        + ("&" if _type.reference else "")
        + (" " if name!="" else "") + name
    )


def generate_cpp_enum(enum):
    '''Generates a C++ function to return the value of an enum'''
    elist = ""
    for const in enum[1]:
        elist += f"int ENUM_{const}(){{return {const};}}\n"
    return elist


def generate_cpp_parameter_list(arglist):
    '''Generates C++ code to pass a list of parameters'''
    return ", ".join([generate_cpp_decl(arg.type, arg.name) for arg in arglist])


def get_boundary_parameters(func):
    '''Gets a list of boundary parameters passed to the function'''
    params = []
    for parameter in func.inouts:
        for i, b in enumerate(parameter.boundary):
            if parameter.return_output_via_return:
                continue
            params.append(Param(get_boundary_name(parameter.name, i + 1), b))
    return params


def get_boundary_return(func):
    '''Gets the 'return' parameter of the boundary function'''
    return_param = None
    for parameter in func.inouts:
        if parameter.is_return:
            # There can only be one
            assert return_param is None, (return_param, parameter)
            return_param = parameter

    if return_param is None:
        return None

    if return_param.return_output_via_return:
        return_param.boundary[0].reference = False
    return return_param


def generate_boundary_sig(func):
    '''Generates the function signature of the boundary function'''
    ret = get_boundary_return(func)

    params = generate_cpp_parameter_list(get_boundary_parameters(func))

    sig_part = f"EMSCRIPTEN_KEEPALIVE CPP_{func.unique_name}({params})"

    if (ret is None or not ret.return_output_via_return):
        sig_part = f"void {sig_part}"
    else:
        sig_part = generate_cpp_decl(ret.boundary[0], sig_part)

    return f"{sig_part}"


def generate_cpp_call(func):
    '''Generates all the code needed to call the C++ SplashKit function'''
    ret = get_boundary_return(func)

    convert_in = ""
    convert_out = ""
    args = []

    # Loop over the in/outs (params and return), combining the code
    for parameter in func.inouts:

        if parameter.write_in:
            convert_in += parameter.cpp_convert_in

        if parameter.write_out:
            convert_out += parameter.cpp_convert_out

        if not parameter.is_return:
            args += parameter.cpp_out_params

    args = ", ".join(args)

    call = f'{func.name}({args})'
    returner = ""

    # If the function returns something
    if ret is not None:
        cpp_decl_name = generate_cpp_decl(ret.cpp_type, ret.name)
        conv_var = get_conversion_name(ret.name, 0)
        cpp_decl_conv = generate_cpp_decl(ret.cpp_type, conv_var)

        # If the function returns out the usual return
        if ret.return_output_via_return:
            # If we don't have to do any convertions on return,
            # just return it directly
            if convert_out == "":
                returner = f"return {call};\n"
                call = ""
            # Otherwise...
            else:
                # If it itself doesn't need to be converted,
                # assign the result straight to the return's name
                if ret.cpp_convert_out == "":
                    call = f"{cpp_decl_name} = {call};\n"
                else:
                    # Otherwise assign it to the temp conversion name
                    call = f"{cpp_decl_conv} = {call};\n"

                    # And also declare a variable to store the converted result in
                    boundary_decl_name = generate_cpp_decl(ret.boundary[0], ret.name)
                    boundary_decl = generate_cpp_decl(ret.boundary[0], "")
                    call += f"{boundary_decl_name} = ({boundary_decl})0;\n"
                # Finally, return the 'return'
                returner = f"return {ret.name};\n"
        # If it returns by writing to the stack
        else:
            # If it itself doesn't need to be converted,
            # assign the result straight to the return's name
            if convert_out == "":
                call = f"{ret.name} = {call};\n"
            else:
                # Otherwise assign it to the temp conversion name
                call = f"{cpp_decl_conv} = {call};\n"

                # We don't need to declare a variable for the final return (like above),
                # because the output location already exists as a parameter to the function
                # itself (as a non-const reference or pointer type)
    else:
        # If it has no return, just call the function
        call = f"{call};\n"

    return convert_in + call + convert_out + returner


# -------------------------------------------
# ---------- Javascript Code Gen -----------
# -------------------------------------------

def sanitize_js_struct_name(name):
    '''Returns a safe name for a JavaScript struct'''
    if name == "window":
        return "_window"
    return name


def generate_js_getter(name, function):
    '''Generates a JavaScript property for each of SplashKit's enums within an enum set'''

    return (
        f"Object.defineProperty( window, \"{name}\", {{\n"
        f"get: function(){{ return {function}}}\n"
        f"}});\n")


def generate_js_parameter_list(arglist):
    '''Generates JavaScript code to pass a list of parameters'''
    return ", ".join([arg.name for arg in arglist])


def get_js_parameters(func, use_original_names = False):
    '''Gets a list of parameters passed to the JavaScript function'''
    params = []
    for parameter in func.inouts:
        if parameter.is_return:
            continue
        params.append(Param(parameter.original_name if use_original_names else parameter.name, parameter.js_type))
    return params


def generate_js_sig(func):
    '''Generates the function signature of the JavaScript function'''

    return f'function {func.unique_name}({generate_js_parameter_list(get_js_parameters(func))})'


def generate_js_call(func, skip_checks = False, force_return = False):
    '''Generates all the code needed to call the Boundary SplashKit function in JavaScript'''
    arg_count_check = ""
    type_checks = ""
    convert_in = ""
    write_ref = ""
    read_ref = ""
    convert_out = ""
    dealloc = ""
    uses_stack = False
    returner = ""
    args = []
    stack_allocs_list = []

    ret = get_boundary_return(func)

    arg_count = len(get_js_parameters(func))
    if not skip_checks:
        arg_count_check += (
            f"if(arguments.length != {arg_count})"
            f"throw new SplashKitArgumentError('Incorrect call to <FunctionName>: "
            f"expects {arg_count} parameters, not ' + String(arguments.length));\n")

    # Loop through the function's inouts (params and return), and merge the code pieces
    for parameter in func.inouts:
        if not parameter.is_return and not skip_checks:
            type_checks += generate_js_type_check(parameter.js_type_check[0], parameter.js_type_check[2])

        if parameter.write_in:
            convert_in += parameter.js_convert_in
            write_ref += parameter.js_write_ref

        if parameter.write_out:
            # Don't read as a reference if we're outputting via the normal return.
            # 'Return's will have write_in switched off, so no need to do that
            # for the write_ref
            if not parameter.return_output_via_return:
                read_ref += parameter.js_read_ref
            convert_out += parameter.js_convert_out

        dealloc += parameter.js_dealloc

        if not parameter.return_output_via_return:
            args += parameter.js_out_params

        for i, stack_alloc in enumerate(parameter.js_alloc_sizes):
            stack_allocs_list.append((get_pointer_name(parameter.name, i), stack_alloc))
            uses_stack = True

    args = ", ".join(args)

    # Generate the call to the boundary function
    call = f'wasmExports.CPP_{func.unique_name}({args})'

    returner = ""

    # If the function uses the stack, perform the allocations and update convert_in and dealloc
    if uses_stack:
        stack_allocs = ""
        for stack_alloc in stack_allocs_list:
            stack_allocs += f"let {stack_alloc[0]} = wasmExports.stackAlloc({stack_alloc[1]});\n"
        convert_in = f"let st = wasmExports.stackSave();\n{stack_allocs}{convert_in}"
        dealloc += "wasmExports.stackRestore(st);\n"

    # If the function returns something
    if ret is not None:
        conv_var = get_conversion_name(ret.name, 0)

        # If the function returns out the usual return
        if ret.return_output_via_return:
            # If we don't have to do any convertions on return,
            # just return it directly
            if convert_out == "":
                returner = f"return {call};\n"
                call = ""
            # Otherwise...
            else:
                # If it itself doesn't need to be converted,
                # assign the result straight to the return's name
                if ret.js_convert_out == "":
                    call = f"let {ret.name} = {call};\n"
                    assert dealloc == ""
                else:
                    # Otherwise assign it to the temp conversion name
                    # If we don't need to dealloc, we don't need access to the
                    # 'conversion' variable in the 'finally' scope.
                    # So just declare it here.
                    if dealloc == "":
                        call = f"let {conv_var} = {call};\n"
                    # Otherwise, declare it outside where the 'try' block happens,
                    # so we can access it in the 'finally' scope too.
                    else:
                        convert_in += f"let {conv_var};\n"
                        call = f"{conv_var} = {call};\n"

                    read_ref = ret.js_new + read_ref

                # Finally, return the 'return'
                returner = f"return {ret.name};\n"
        # If it returns by writing to the stack
        else:
            # Make the call on its own
            call = f"{call};\n"
            # Make sure to declare the output variable and initialize it
            read_ref = ret.js_new + read_ref
            # And finally return it as usual
            returner = f"return {ret.name};\n"
    else:
        # If it has no return, just call the function
        call = f"{call};\n"
        if force_return:
            returner = "return;\n"

    # Assemble final code
    return (
        (arg_count_check + type_checks).replace("<FunctionName>", func.unique_name)
        + convert_in
        + write_ref
        + "try{\n"
            + call
            + read_ref
            + convert_out
            + returner
        + "} finally {\n"
            + dealloc
        + "}\n")

def generate_js_bitshift(var, amount):
    if amount == 0:
        return var
    if not re.match(r'\A[\w-]+\Z', var):
        var = f"({var})"
    return f"{var}>>{amount}"

def generate_js_struct_read_write(types_env, offsets, fields):
    '''Generates the JavaScript code that read/writes a struct to a given memory location'''

    write = ""
    read = ""

    # For every field in the structure
    for field in fields:
        field_offset = offsets[field.name]
        read_write = marshal_parameter(types_env, Param(field.name, field.type.asReference(), is_class_member=True), False, (f"ptr + {field_offset}", 0))

        read += read_write.js_declare_ref + read_write.js_read_ref + read_write.js_convert_out
        write += read_write.js_convert_in + read_write.js_write_ref

    return read, write

def generate_js_struct(types_env, struct):
    '''Generates the JavaScript code that mirrors a C++ struct'''

    code = ""

    # Get information about how thw struct is stored in memory
    mem_info = types_env.get_type_memory_info(Type(struct.name))
    size, offsets = mem_info.size, mem_info.fields

    # Declare the class, and start the class body
    code += f"class {sanitize_js_struct_name(struct.name)} {{\n"

    # Generate the constructor
    code += f"constructor({generate_js_parameter_list(struct.fields)}) {{\n"
    # For each field, initialize the field with the constructor
    for field in struct.fields:
        cons = marshal_parameter(types_env, Param(field.name, field.type, is_class_member=True), False)
        code += f"this.{field.name} = {field.name} ?? {cons.js_constructor};\n"
    code += "}\n\n"

    # Generate code to check that the mapping between the JavaScript code
    # and the C++ is matching properly, and that all sizes/offsets are correct.
    code += "static checkCPPMapping() {\n"
    for field in struct.fields:
        code += (
            f"assert({offsets[field.name]} == wasmExports.{struct.name}_{field.name}_offset(), "
            f"\"Wrong offset! {struct.name}.{field.name}| {offsets[field.name]} != \"+"
            f"String(wasmExports.{struct.name}_{field.name}_offset()));\n")
    code += (
        f"assert({size} == wasmExports.{struct.name}_size(), "
        f"\"Wrong class size! {struct.name}| {size} != \" + "
        f"String(wasmExports.{struct.name}_size()));\n")
    code += "}\n\n"

    # Generate code that reads/writes the structure to memory
    read_code, write_code = generate_js_struct_read_write(types_env, offsets, struct.fields)

    # Generate the write function
    code += "write(ptr) {\n"
    code += write_code
    code += "}\n"

    # Generate the read function
    code += "read(ptr) {\n"
    code += read_code
    code += "}\n"

    # End the class body
    code += "}\n"

    return code

# --------------------------------------
# ---------- Glue Gen Funcs -----------
# --------------------------------------

# Generate the C++ Wrapper Class


def generate_cpp_glue(api, marshalled_functions, output_cpp):
    '''Generates all the C++ glue code'''

    # Output the preamble, which includes all of SplashKit
    # and defines various functions for converting types
    output_cpp(CPPPreamble)

    # For each struct, generate a function that returns the struct's size,
    # For each parameter in the struct, generate a function that returns
    # that paramater's offset in memory from the start of the struct.
    # This is used to confirm the JavaScript and C++ have matching memory layouts.
    for struct in api.structs:
        output_cpp(f"int EMSCRIPTEN_KEEPALIVE {struct}_size(){{return (int)sizeof(struct {struct});}}\n")
        for field in api.structs[struct].fields:
            output_cpp(
                f"int EMSCRIPTEN_KEEPALIVE {struct}_{field.name}_offset(){{"
                f"return (int)offsetof(struct {struct}, {field.name});"
                f"}}\n")

    # Generate functions to return the value of each enum
    for enum in api.enums:
        output_cpp(generate_cpp_enum(enum))

    # Generate wrapper functions for each SplashKit function
    for marshaled_function in marshalled_functions:
        output_cpp(generate_boundary_sig(marshaled_function) + "{\n")
        output_cpp(generate_cpp_call(marshaled_function))
        output_cpp("}\n")

    output_cpp("\n};\n")

def generate_function_sets(marshalled_functions):
    function_sets = {}
    for marshaled_function in marshalled_functions:
        if marshaled_function.name not in function_sets:
            function_sets[marshaled_function.name] = []
        function_sets[marshaled_function.name].append(marshaled_function)

    return function_sets

def group_list(_list, group_by):
    grouped = {}

    for x in _list:
        key = group_by(x)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(x)

    return grouped

def ungroup_grouped_list(grouped):
    _list = []

    for x in grouped.keys():
        _list += grouped[x]

    return _list


def generate_javascript_type(_type):
    if _type.typename == "array":
        return generate_javascript_type(_type.template_type)+"[]"
    return _type.typename

def generate_js_typed_sig(func, use_overload_name = False, use_original_names = False):
    params = ", ".join([f"{generate_javascript_type(x.type)} {x.name}" for x in get_js_parameters(func, use_original_names)])
    ret = get_boundary_return(func)
    ret = "" if ret is None else generate_javascript_type(ret.js_type)
    return f"{ret} {func.name if use_overload_name else func.unique_name}({params})"


def generate_js_overloaded_function(types_env, function_set):
    longest_func = function_set[0]
    for function in function_set:
        if len(function.inouts) >= len(longest_func.inouts):
            longest_func = function


    # Identify functions with clashing signatures,
    # that contain types that can't be differentiated reliably
    # in JavaScript. For instance int vs float (both are 'number',
    # or vector<int> and vector<string> (both are just 'object')

    def get_sig(func):
        return tuple([x.type.typename for x in get_js_parameters(func)])


    grouped_by_signature = group_list(function_set, get_sig)


    # There may be multiple overloads for different numerical types
    # that represent the same 'thing'. Find the 'best' one and
    # remove the others - these will just simply not be accessible.
    for group in grouped_by_signature.keys():
        can_be_pruned = True
        # For each parameter in the group
        for i in range(len(group)):
            # For each function in the group
            param_changes_type = False
            param_changes_name = False
            a_param = grouped_by_signature[group][0].get_param(i)
            for func in grouped_by_signature[group]:
                param = func.get_param(i)
                if param.original_name != a_param.original_name:
                    param_changes_name = True
                if param.cpp_type != a_param.cpp_type:
                    param_changes_type = True

            if not param_changes_type:
                continue

            # If the parameter changes name, it probably represents different
            # things in each overload. We cannot safetly prune the overloads,
            # so stop here.
            if param_changes_name:
                can_be_pruned = False
                break
            # Also don't prune if the type that changes isn't numeric
            if a_param.js_type.typename != "number":
                can_be_pruned = False
                break

            # If we get here, we can prune the overloads. Let's
            # find the best type for this parameter, and remove
            # all overloads that don't use this type.
            best_type = grouped_by_signature[group][0].get_param(i).cpp_type
            for func in grouped_by_signature[group]:
                param = func.get_param(i)
                _type = param.cpp_type

                best_typeinfo = types_env.get_type_memory_info(best_type)
                _typeinfo = types_env.get_type_memory_info(_type)

                if best_typeinfo.is_integer() and _typeinfo.is_float():
                    best_type = _type
                elif best_typeinfo.is_integer() and _typeinfo.is_integer() and _typeinfo.size > best_typeinfo.size:
                    best_type = _type
                elif best_typeinfo.is_float() and _typeinfo.is_float() and _typeinfo.size > best_typeinfo.size:
                    best_type = _type

            for x in grouped_by_signature[group]:
                if x.get_param(i).cpp_type != best_type:
                    print("Can prune: " + str(x))
            grouped_by_signature[group] = [x for x in grouped_by_signature[group] if x.get_param(i).cpp_type == best_type]
    # For the other ambiguous functions, throw a warning and
    # make them available via explicit overload names

    function_set = ungroup_grouped_list(grouped_by_signature)


    longest_func = copy.deepcopy(longest_func)
    longest_func.unique_name = longest_func.name
    code = generate_js_sig(longest_func) + "{\n"

    def take_step(functions, param_index):
        code = ""

        # Group functions by inouts[param_index] (or by no type)


        def get_type(func):
            key = func.get_param(param_index)
            key = None if key == None else key.js_type.typename
            return key

        grouped = group_list(functions, get_type)

        started_if = False

        # If there's one that ends, add arguments.length if
        if None in grouped:
            if len(grouped.keys()) != 1:
                code += f"if (arguments.length == {param_index}){{\n"
            else:
                code += (
                    f"if(arguments.length != {param_index})"
                    f"throw new SplashKitArgumentError('Incorrect call to <FunctionName>: "
                    f"expects {param_index} parameters, not ' + String(arguments.length));\n\n")

            if len(grouped[None]) > 1:
                assert (grouped[None]) == (grouped_by_signature[get_sig(grouped[None][0])])
                # There are multiple functions matching this signature -
                # let's list the names of the explicit overloads for the user:
                potential_sigs = []
                for func in grouped[None]:
                    potential_sigs.append(f"'    {generate_js_typed_sig(func, use_original_names=True)}'")
                message = "'The function being called here is ambiguous! Please use one of the following explicit overloads:'\n + "
                code += generate_js_type_check("true", message+"\n + ".join(potential_sigs))
            else:
                code += generate_js_call(grouped[None][0], skip_checks=True, force_return=True)
            if len(grouped.keys()) != 1:
                code += "}\n"
            started_if = True
        # If all the same, add an assert
        if (len(grouped.keys()) == 1 and None not in grouped) or (len(grouped.keys()) == 2 and None in grouped):
            key = [x for x in grouped.keys() if x != None][0]
            parameter = grouped[key][0].get_param(param_index)
            if started_if:
                code += " else {\n"
            code += generate_js_type_check(parameter.js_type_check[0], parameter.js_type_check[2])
            code += take_step(grouped[key], param_index + 1)
            if started_if:
                code += "}\n"
        # If different, add if for each type
        else:
            for key in grouped.keys():
                if key == None:
                    continue
                if started_if:
                    code += " else "
                started_if = True
                parameter = grouped[key][0].get_param(param_index)
                code += f"if ({parameter.js_type_check[1]}){{\n"
                code += take_step(grouped[key], param_index + 1)
                code += "}\n"

        return code

    code += take_step(function_set, 0)


    message = ("'The parameters passed to this function don\\'t match any of its overloads.\\n'+\n"
    +"'You called " + function_set[0].name + "(' + user_params_to_string(arguments) + ')\\n'+\n"
    +"'Please use one of the following overloads:\\n'\n + ")


    potential_sigs = []
    for group in grouped_by_signature.keys():
        for marshaled_function in grouped_by_signature[group]:
            potential_sigs.append(f"'    {generate_js_typed_sig(marshaled_function, len(grouped_by_signature[group]) == 1, use_original_names=True)}\\n'")

    code += "\n" + generate_js_type_check("true", message+"\n + ".join(potential_sigs))

    code += "}\n"

    # Output the functions we couldn't include in the main overloaded one
    # These will be ones where there are multiple ones with conflicting signatures
    for group in grouped_by_signature.keys():
        if len(grouped_by_signature[group]) <= 1:
            continue
        for marshaled_function in grouped_by_signature[group]:
            code += generate_js_sig(marshaled_function) + "{\n"
            code += generate_js_call(marshaled_function)
            code += "}\n"
    return code

def generate_js_glue(types_env, api, marshalled_functions, output_js, enable_overloading):
    '''Generates all the JavaScript glue code'''

    # Output the preamble, which defines various functions for converting types
    output_js(JSPreamble)

    # Create simple wrapper classes for each of SplashKit's typedeffed structures
    for typedef in api.typedefs:
        if api.typedefs[typedef].function_type != None:
            continue

        code = f"class {sanitize_js_struct_name(typedef)} {{\n"
        code += "constructor(ptr = 0) {\n"
        code += "this.ptr = ptr;\n"
        code += "}\n"
        code += "}\n"

        output_js(code)

    # Generate more complex classes for each of SplashKit's user facing structs
    for struct in api.structs:
        code = generate_js_struct(types_env, api.structs[struct])
        output_js(code)


    # Generate code that creates a get-only property for each enum,
    # that calls a C++ function that returns the value of the enum.
    # Would prefer to make it a variable (and only call the C++ function once),
    # but this way it behaves as if const
    for enum in api.enums:
        for name in enum[1]:
            output_js(generate_js_getter(name, f"wasmExports.ENUM_{name}()"))

    # Generate the 'hash defines'. These are ported to JavaScript
    # by creating getters for each hash define, that then call and
    # return the associated define.
    for definition in api.defines:
        output_js(generate_js_getter(definition[0], definition[1]))

    # Generate wrapper functions for each SplashKit function, that
    # call the C++ wrapper functions and handling passing data back and forth.
    if enable_overloading:
        function_sets = generate_function_sets(marshalled_functions)

        for function_set in function_sets:
            output_js(generate_js_overloaded_function(types_env, function_sets[function_set]))
    else:
        for marshaled_function in marshalled_functions:
            output_js(generate_js_sig(marshaled_function) + "{\n")
            output_js(generate_js_call(marshaled_function))
            output_js("}\n")

    # Checking structures relies on the SplashKit Wasm library having loaded.
    # So put that code inside an event listener, and wait for the library to load.
    output_js(
        "moduleEvents.addEventListener(\"onRuntimeInitialized\", function() {\n")

    # Check the mapping for each structure, ensuring it matches the C++ side
    for struct in api.structs:
        code = f"{sanitize_js_struct_name(struct)}.checkCPPMapping();\n"

        output_js(code)

    # Close the callback to the event listener.
    output_js("});\n")

# ----------------------------
# ---------- Main -----------
# ----------------------------
def make_function_overloads_consistent(functions):
    function_sets = generate_function_sets(functions)
    for function_set in function_sets:
        param_names = []
        for function in function_sets[function_set]:
            for i,param in enumerate(function.parameters):
                if len(param_names)==i:
                    param_names.append(set())
                param_names[i].add(param.name)
        param_names = ["__".join(sorted(list(names))) for names in param_names]

        for function in function_sets[function_set]:
            for i, param in enumerate(function.parameters):
                function.parameters[i].original_name = function.parameters[i].name
                function.parameters[i].name = param_names[i]

def __main__():
    '''The main function, that loads the API, then generates and writes all the glue code'''

    enable_overloading = sys.argv[4]=="true"

    print(f"Reading from {sys.argv[1]}, writing to {sys.argv[2]} and {sys.argv[3]}\nEnable Function Overloading: {enable_overloading}")

    # Open the output files (C++, and JavaScript), passed in as program arguments
    with open(sys.argv[2], "w", encoding='utf-8') as out_cpp, \
            open(sys.argv[3], "w", encoding='utf-8') as out_js:

        # Create the indenters for C++ and JavaScript
        # These will handle formatting the generated code nicely
        indenter_c = StreamingCodeIndenter()
        indenter_js = StreamingCodeIndenter()

        # Define the output functions, that write to the files
        # after parsing the code through their respective indenter.
        def output_cpp(string):
            out_cpp.write(indenter_c.indent_next(string))

        def output_js(string):
            out_js.write(indenter_js.indent_next(string))

        # Load the SplashKit api json file
        with open(sys.argv[1], "r", encoding='utf-8') as in_json:
            api = json.load(in_json)

        # Read the api
        api = read_json_api(api)

        # Compute memory information about all the types
        types_env = compute_type_memory_information(api)

        functions = api.functions

        # If overloading is enabled, make all overloads
        # share the same parameter names.
        # JavaScript doesn't _actually_ support overloading,
        # so we end up with a single function that handles all overloads.
        # Making the parameter names consistent makes everything easier
        # downstream.
        if enable_overloading:
            functions = copy.deepcopy(functions)
            make_function_overloads_consistent(functions)

        # Generate all the code needed to marshal the data needed for each function
        marshalled_functions = compute_marshalled_functions(types_env, functions)

        # Generate all the final glue code
        generate_cpp_glue(api, marshalled_functions, output_cpp)
        generate_js_glue(types_env, api, marshalled_functions, output_js, enable_overloading)

# Call main, which will generate the glue code and write it the files
# specified as program arguments
__main__()
