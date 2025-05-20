'''This file contains classes that store type information, and functions to populate them from the SplashKit API'''

from enum import Enum
import math
import copy

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