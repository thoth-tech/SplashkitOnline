'''This script uses SplashKit's JSON API output to create a thinned down
json file used when performing auto-complete in the IDE'''
import sys
import json
import json_api_reader

enable_overloading = sys.argv[3]=="true"
print(enable_overloading)
with open(sys.argv[1], "r", encoding='utf-8') as inJSON:
    api_json = json.load(inJSON)

api = json_api_reader.read_json_api(api_json)

# Check if we are generating for JavaScript or C++
is_c = sys.argv[4] == "c++"

functions = []
keywords = []

def js_print_type(_type):
    '''Returns a representation of a type that's more relevant to JavaScript'''

    ret = _type.typename
    if is_c:
        return ret
    if _type.typename == "int":
        ret = "number"
    elif _type.typename == "unsigned int":
        ret = "number" 
    elif _type.typename == "double":
        ret = "number"
    elif _type.typename == "float":
        ret = "number"
    elif _type.typename == "bool":
        ret = "boolean"
    elif _type.typename == "string":
        ret = "string"
    elif _type.typename == "void":
        ret = ""
    elif _type.typename == "vector":
        ret = "array of " + js_print_type(_type.template_type)+"s"

    return ret

# Some functions have duplicate signatures when overloading is enabled
# (for instance if they can take different types of numbers)
# These will always be set to use the largest float type possible
# when generating the wrappers, and so here we can just remove
# any duplicates we find.
already_process_functions = set()

for func in api.functions:
    info = {
        "name":func.name if enable_overloading else func.unique_name,
        "return":js_print_type(func.return_type),
        "params":[js_print_type(param.type)+" "+param.name for param in func.parameters]
    }
    # Just convert the dictionary into a string to perform the test
    if str(info) not in already_process_functions:
        already_process_functions.add(str(info))
        functions.append(info)
    else:
        print("Skipped duplicate function signature: " + str(info))

for enum in api.enums:
    for e in enum[1]:
        keywords.append(e)

for definition in api.defines:
    keywords.append(definition[0])

for typename in api.typenames:
    keywords.append(typename)

with open(sys.argv[2], "w", encoding='utf-8') as output:
    json.dump({"functions":functions, "keywords":keywords}, output)
