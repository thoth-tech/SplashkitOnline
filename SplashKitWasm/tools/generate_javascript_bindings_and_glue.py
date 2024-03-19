'''This file contains the core binding generation main function'''

import json
import sys
import copy

from js_binding_gen.streaming_code_indenter import StreamingCodeIndenter
from js_binding_gen.type_environment import compute_type_memory_information
from js_binding_gen.marshalling_strategies import compute_marshalled_functions
from js_binding_gen.glue_generation import generate_cpp_glue, generate_js_glue, make_function_overloads_consistent
from json_api_reader import Type, Param, read_json_api, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp

def __main__():
    '''The main function, that loads the API, then generates and writes all the glue code'''

    enable_overloading = sys.argv[4]=="true"

    print(f"Reading from {sys.argv[1]}, writing to {sys.argv[2]} and {sys.argv[3]}")
    print(f"Enable Function Overloading: {enable_overloading}")

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
