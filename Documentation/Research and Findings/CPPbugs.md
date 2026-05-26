# C++ Bugs in SplashKit Online

This document records issues found while testing C++ in SplashKit Online.

## Test Format

For each issue:
- Feature tested
- Sample code, files or function used
- Expected result
- Actual result
- Errors or compiler output
- Notes

---

## Bug 1: splashkit.h fails when included directly and indirectly

**Feature tested:**
Multi-file C++ project with a user-defined header file

**Files used:**
`main.cpp`, `game.h`, `game.cpp`

**Sample code:**

`main.cpp`
```cpp
#include "splashkit.h"
#include "game.h"

int main()
{
    open_window("Header Test", 800, 600);

    while (!quit_requested())
    {
        process_events();
        clear_screen(COLOR_WHITE);

        draw_scene();

        refresh_screen(60);
    }

    return 0;
}
```

`game.h`
```cpp
#ifndef GAME_H
#define GAME_H

#include "splashkit.h"

void draw_scene();

#endif
```

`game.cpp`
```cpp
#include "game.h"

void draw_scene()
{
    fill_circle(COLOR_RED, 400, 300, 50);
}
```

**Expected result:**
The program should compile and run, displaying a red circle in the window.

**Actual result:**
Compilation fails when `splashkit.h` is included in game.h and also included in `main.cpp`

**Compiler output:**
```text
In file included from /code/main.cpp:2:
In file included from /code/game.h:4:
In file included from /include/splashkit.h:16:
/include/splashkit/bundles.h:139:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /code/game.h:4:
In file included from /include/splashkit.h:17:
/include/splashkit/interface.h:810:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /code/game.h:4:
In file included from /include/splashkit.h:25:
/include/splashkit/camera.h:335:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /code/game.h:4:
In file included from /include/splashkit.h:26:
/include/splashkit/random.h:47:1: error: extraneous closing brace ('}')
}
^
4 errors generated.
```

**Notes:**

A basic single file C++ program including `splashkit.h` directly in `main.cpp` compiled and ran successfully.

The error only appeared after introducing the separate header file `game.h` that also includes `splashkit.h`.

I tested the same multi file program removing `splashkit.h` from either the separate header file `game.h` or `main.cpp` and it compiled and ran successfully.

This suggests an issue with header handling, include order, or malformed C++ headers in SplashKit Online.

## Bug 2: splashkit.h fails on duplicate inclusion

**Feature tested:**
Repeated header file inclusion

**Files used:**
`main.cpp`, `game.h`, `game.cpp`

**Sample code:**

`main.cpp`
```cpp
#include "splashkit.h"
#include "splashkit.h"
#include "game.h"

int main()
{
    open_window("Header Test", 800, 600);

    while (!quit_requested())
    {
        process_events();
        clear_screen(COLOR_WHITE);

        draw_scene();

        refresh_screen(60);
    }

    return 0;
}
```

`game.h`
```cpp
#ifndef GAME_H
#define GAME_H

void draw_scene();

#endif
```

`game.cpp`
```cpp
#include "splashkit.h"
#include "game.h"

void draw_scene()
{
    fill_circle(COLOR_RED, 400, 300, 50);
}
```

**Expected result:**
The program should compile and run, displaying a red circle in the window.

**Actual result:**
Compilation fails when #include `splashkit.h` is duplicated.

**Compiler output:**
```text
In file included from /code/main.cpp:2:
In file included from /include/splashkit.h:16:
/include/splashkit/bundles.h:139:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /include/splashkit.h:17:
/include/splashkit/interface.h:810:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /include/splashkit.h:25:
/include/splashkit/camera.h:335:1: error: extraneous closing brace ('}')
}
^
In file included from /code/main.cpp:2:
In file included from /include/splashkit.h:26:
/include/splashkit/random.h:47:1: error: extraneous closing brace ('}')
}
^
4 errors generated.
```

**Notes:**

A basic single file C++ program where `splashkit.h` is included once compiles and runs successfully.

The error only appeared after introducing a duplicate `splashkit.h` inclusion.

I also tested duplicate inclusion of the user-defined header file `game.h` and this compiled and ran successfuly because the file has proper header guards.

The issue with duplicate `splashkit.h` inclusion suggests this file itself lacks proper header guards.

## Summary of findings

The issue appears to be specific to `splashkit.h` and/or its nested headers.

Observed behaviour:
- Including `game.h` multiple times works correctly when standard header guards are used.
- Including `splashkit.h` multiple times causes compilation failure.
- Including `splashkit.h` inside the user-defined header game.h whilst also including it in main.cpp causes compilation failure.
- Including `splashkit.h` once in either main.cpp or the user-defined header file game.h works.

This suggests that `splashkit.h` or one of the nested SplashKit headers is not safely handling repeated or indirect inclusion.

## Additional observation

The demo C++ program available shows a workaround for compilation errors that come from multiple `splashkit.h` inclusions by using a manual include guard.

**It is as follows:**

Create a user-defined header file.

`splashkit_wrap.h`
```cpp
#ifndef SPLASHKIT_DONE
// splashkit.h not safe to include multiple times (to fix)
#define SPLASHKIT_DONE
#include "splashkit.h"
#endif
```

Use this else where in the project instead of `splashkit.h` directly.

`program.cpp`
```cpp
#include "splashkit_wrap.h"
//rest of code
```

## What to do next?

- Identify which nested Splashkit header(s) are responsible for the repeated/direct and indirect inclusions failure.
- Compare behaviour between `splashkit.h` and the workaround header `splashkit_wrap.h` to understand whether the wrapper is avoiding or masking the same issue.

**Possible workaround improvements:**
- Include user available documentation on the current workaround.
- Editor UI warning or note that some multi-file header inclusion patterns may currently fail white C++ remains experimental and direct them to above documentation.