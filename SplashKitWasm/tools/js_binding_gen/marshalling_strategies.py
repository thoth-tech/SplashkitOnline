'''This file contains functions that figure out the marshalling strategies, with minimal code generation'''

from js_binding_gen.marshalling import *
from js_binding_gen.cpp_code_gen import generate_cpp_decl, generate_cpp_enum

# ---------- Type Specific Data Marshalling Methods ----------

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