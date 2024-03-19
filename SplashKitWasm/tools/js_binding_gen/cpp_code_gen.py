'''This file contains C++ code generation routines'''

from json_api_reader import Type, Param, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp

from js_binding_gen.marshalling import get_conversion_name, get_boundary_name, get_boundary_return
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