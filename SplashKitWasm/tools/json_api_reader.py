'''
A module that exposes a function to load information about SplashKit's API
from its JSON output, and some utility types that hold this information
'''
from enum import Enum
from copy import deepcopy

# ---------- Structures -----------
StorageModifier = Enum('StorageModifier', 'pointer array')

def storage_modifier_cpp(sm):
    '''Returns a storage modifier as it would be written in C++'''
    assert(sm[0] == StorageModifier.pointer or sm[0] == StorageModifier.array)

    if sm[0] == StorageModifier.pointer:
        return "*"
    if sm[0] == StorageModifier.array:
        return "".join("["+("" if x is None else x)+"]" for x in sm[1])

    return ""
StorageModifier_Pointer = (StorageModifier.pointer, )

class Param:
    '''A representation of a name/type pair - a parameter'''
    def __init__(self, name, _type, is_class_member=False):
        self.name = name
        self.type = _type
        self.is_class_member = is_class_member
    def __repr__(self):
        return str((self.name, self.type))

class Type:
    '''A representation of a C++ type'''
    def __init__(self, typename, const=False, storage=None, reference=False, template_type=None, function_type=None):
        self.typename = typename
        self.template_type = template_type
        self.storage = [] if storage is None else storage
        self.const = const
        self.reference = reference
        self.function_type = function_type

    def array_dimension_sizes(self):
        '''Returns the sizes of each dimension, or [] if not an array'''
        if len(self.storage) > 0 and self.storage[-1][0] == StorageModifier.array:
            return self.storage[-1][1]
        return []

    def is_pointer(self):
        '''Returns whether the base type is a pointer'''
        return len(self.storage) > 0 and self.storage[-1][0] == StorageModifier.pointer

    def is_array(self):
        '''Returns whether the base type is an array'''
        return len(self.storage) > 0 and self.storage[-1][0] == StorageModifier.array

    def is_reference(self):
        '''Returns whether the type is a reference to the base type'''
        return self.reference

    def asValue(self):
        '''Returns a copy of the type, making it not a reference (if it was)'''
        _type = deepcopy(self)
        _type.reference = False
        return _type

    def asReference(self):
        '''Returns a copy of the type, making it a reference (if it wasn't)'''
        _type = deepcopy(self)
        _type.reference = True
        return _type

    def as_element(self):
        '''Returns a copy of the type for a single element (no difference if not array)'''
        _type = deepcopy(self)
        if len(_type.storage) > 0 and _type.storage[-1][0] == StorageModifier.array:
            _type.storage = _type.storage[0:-1]
        _type.reference = False
        return _type

    def is_value(self):
        '''Returns whether the type is a value type (or copies on assignment)'''
        return not self.is_pointer() and not self.is_reference() and not self.is_array()

    def replace_typename(self, newt):
        '''Replaces the innermost type name with another type'''
        self.typename = newt.typename
        self.function_type = newt.function_type
        self.storage = newt.storage + self.storage

    def pretty_print(self):
        '''Prints the type'''
        return (
            ("const " if self.const else "var ")
            + (self.function_type.__repr__() if self.function_type != None else self.typename)
            + ("" if self.template_type is None else ("<"+self.template_type.pretty_print()+">"))
            + "".join([storage_modifier_cpp(x) for x in self.storage])
            + ("&" if self.reference else ""))

    def __repr__(self):
        return (
            "("+self.typename.__repr__()+","+self.template_type.__repr__()
            +self.function_type.__repr__()
            +","+[x.__repr__() for x in self.storage].__repr__()+","
            +("const" if self.const else "non-const")+","
            +("&" if self.reference else "")+")")

    def to_tuple(self):
        return (
            self.typename,
            self.function_type,
            self.template_type,
            tuple(self.storage),
            self.const,
            self.reference
        )

    def __hash__(self):
        return hash(self.to_tuple())

    def __eq__(self, other):
        return other !=None and self.to_tuple() == other.to_tuple()

    def __ne__(self, other):
        # Not strictly necessary, but to avoid having both x==y and x!=y
        # True at the same time
        return not(self == other)


class FunctionSignature:
    '''A representation of a C++ signature'''
    def __init__(self, name, unique_name, return_type, parameters):
        self.name = name
        self.unique_name = unique_name
        self.return_type = return_type
        self.parameters = parameters

    def __repr__(self):
        return (
            "("+self.name+","+self.unique_name+","
            +self.return_type.__repr__()+","
            +[x.__repr__() for x in self.parameters].__repr__()+")")


class Struct:
    '''A representation of a C++ struct'''
    def __init__(self, name, fields):
        self.name = name
        self.fields = fields

    def __repr__(self):
        return "("+self.name+","+[x.__repr__() for x in self.fields].__repr__()+")"


class CPPApi:
    '''A set of typedefs, structures, functions, enums, and hash defines that a
    C++ library may expose as its API'''
    def __init__(self, typedefs, typenames, structs, functions, enums, defines):
        self.typedefs = typedefs
        self.typenames = typenames
        self.structs = structs
        self.functions = functions
        self.enums = enums
        self.defines = defines


def read_json_api(api):
    '''Reads from the SplashKit JSON documentation from an open file and
    returns a 'CPPApi' object with the information'''
    typedefs = {}
    typenames = set()
    structs = {}
    functions = []
    enums = []
    defines = []

    def function_unique_name(func):
        if "unique_global_name" not in func:
            return func["name"]

        if func["unique_global_name"] != "center_point":
            return func["unique_global_name"]
        else:
            for k in func["parameters"]:
                if k=="c":
                    return "center_point_circle"
                if k=="s":
                    return "center_point_sprite"
        return "ERROR"

    def pull_apart_typedef(sig):
        if sig.startswith("typedef void ("):
            return "void*"

        if sig.startswith("typedef struct "):
            sig = sig[15:]
            typename = sig[:sig.find(" ")]
            if sig[len(typename)+1]!="*":
                return ""

            return typename

        return ""

    def make_type(t):

        storage = []
        if "is_array" in t and t["is_array"]:
            storage.append((StorageModifier.array, t["array_dimension_sizes"]))
        if t["is_pointer"]:
            storage.append(StorageModifier_Pointer)
        if "is_array" in t and t["is_array"] and (t["is_pointer"] or t["is_reference"]):
            print("Error - cannot handle something that is both a pointer/reference and an array")
        if t["is_pointer"] and t["is_reference"]:
            print("Error - cannot handle something that is both a pointer and reference")

        return Type(t["type"],
            "is_const" in t and t["is_const"],
            storage,
            t["is_reference"],
            None if t["type_parameter"] is None else Type(t["type_parameter"]))

    def make_function(function):
        assert "suffix_name" not in function or function["suffix_name"] is None

        parameters = []
        for parameter_name in function["parameters"]:
            parameter = function["parameters"][parameter_name]
            parameters.append(Param(parameter_name, make_type(parameter)))

        return FunctionSignature(function["name"], function_unique_name(function),
                         make_type(function["return"]), parameters)

    for category_name in api:
        category = api[category_name]
        for struct in category["structs"]:
            typenames.add(struct["name"])
            fields = []
            for field_name in struct["fields"]:
                field = struct["fields"][field_name]
                fields.append(Param(field_name, make_type(field), is_class_member=True))
            structs[struct["name"]] = Struct(struct["name"], fields)

    for category_name in api:
        category = api[category_name]
        for typedef in category["typedefs"]:
            if typedef["is_function_pointer"]:
                typedefs[typedef["name"]] = Type(None, function_type=make_function(typedef))
            else:
                typename = pull_apart_typedef(typedef["signature"])
                assert typename != ""
                typedefs[typedef["name"]] = Type(typename, None, [StorageModifier_Pointer], False)
                typenames.add(typename)

            typenames.add(typedef["name"])

    for category_name in api:
        category = api[category_name]
        for function in category["functions"]:
            functions.append(make_function(function))

    for category_name in api:
        category = api[category_name]
        for enum in category["enums"]:
            enums.append((enum["name"], enum["constants"]))
    for category_name in api:
        category = api[category_name]
        for definition in category["defines"]:
            define = (definition["name"], definition["definition"])
            if define not in defines:
                defines.append(define)

    # There are a few functions not exposed in api.json,
    # so we expose them here
    # This is not a comprehensive list

    functions.append(FunctionSignature("free_all_resource_bundles",
        "free_all_resource_bundles", Type("void"), [])
    )
    functions.append(FunctionSignature("free_all_sprite_packs",
        "free_all_sprite_packs", Type("void"), [])
    )

    return CPPApi(
        typedefs,
        typenames,
        structs ,
        functions,
        enums,
        defines,
    )
