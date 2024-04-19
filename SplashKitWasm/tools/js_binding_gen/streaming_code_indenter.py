'''This file contains the StreamingCodeIndenter, a class that handles indenting code as it is written out'''

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
