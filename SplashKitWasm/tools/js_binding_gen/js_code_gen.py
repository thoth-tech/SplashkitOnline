'''This file contains JavaScript code generation routines'''

import re

from json_api_reader import Type, Param, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp
from js_binding_gen.marshalling import generate_js_bitshift, sanitize_js_struct_name, get_boundary_return, get_pointer_name, get_conversion_name
from js_binding_gen.marshalling_strategies import marshal_parameter

# -------------------------------------------
# ---------- Javascript Code Gen -----------
# -------------------------------------------

def generate_js_type_check(check, error):
    '''Generates code to check if an incoming parameter matches the expected type'''

    return f"if({check})throw new SplashKitArgumentError({error});\n"


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