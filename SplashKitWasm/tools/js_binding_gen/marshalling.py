'''This file contains classes used to hold marshalling information'''

from enum import Enum
import copy
import re
from json_api_reader import Type, Param, \
    StorageModifier, StorageModifier_Pointer, storage_modifier_cpp

# ----------------------------------
# ---------- Structures -----------
# ----------------------------------

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

def sanitize_js_struct_name(name):
    '''Returns a safe name for a JavaScript struct'''
    if name == "window":
        return "_window"
    return name

def generate_js_bitshift(var, amount):
    if amount == 0:
        return var
    if not re.match(r'\A[\w-]+\Z', var):
        var = f"({var})"
    return f"{var}>>{amount}"

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