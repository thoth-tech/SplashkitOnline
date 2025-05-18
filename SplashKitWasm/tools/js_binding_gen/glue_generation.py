'''This file contains the overall binding generation'''

import sys
import copy

from json_api_reader import Type, Param, read_json_api, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp

from js_binding_gen.javascript_bindings_preamble import CPPPreamble, JSPreamble
from js_binding_gen.marshalling import get_boundary_return
from js_binding_gen.js_code_gen import sanitize_js_struct_name, \
    generate_js_struct, generate_js_getter, get_js_parameters, \
    generate_js_sig, generate_js_call, generate_js_type_check

from js_binding_gen.cpp_code_gen import generate_cpp_enum, generate_boundary_sig, generate_cpp_call

# --------------------------------------
# ---------- Glue Gen Funcs -----------
# --------------------------------------

# Generate the C++ Wrapper Class


def generate_cpp_glue(api, marshalled_functions, output_cpp):
    '''Generates all the C++ glue code'''

    # Header guard
    output_cpp("#pragma once\n")

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
    '''Generates code for a JavaScript function that emulates having overloads'''

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

    code = code.replace("<FunctionName>", longest_func.name)

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
