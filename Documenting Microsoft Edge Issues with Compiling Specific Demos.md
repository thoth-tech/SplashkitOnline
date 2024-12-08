- ### **Spike Outcomes**

  ==================

  **Spike:** SKO_01

  **Title:** Documenting Microsoft Edge Issues with Compiling Specific Demos

  **Author:** Jiayi Zhang, jiayiteko@163.com

  ------

  ### **Goals / Deliverables**

  Summarise from the spike plan goal* Besides this report, what else was created ie UML, code, reports*

  -  Investigate and document the issue preventing the demo from compiling in Microsoft Edge, with the error message `Failed to compile due to internal error! RangeError: Maximum call stack size exceededR`.

  - A summary of the issue in this report.

  ------

  ### **Technologies, Tools, and Resources Used**

  List of information needed by someone trying to reproduce this work\

  - **Browsers:** Microsoft Edge , Google Chrome, Mozilla Firefox
  - **Programming Language:** JavaScript
  - **Development Environment:** SplashKit Online

  ------

  ### **Tasks Undertaken**

  List key tasks likely to help another developer

  - **Reproducing the Issue:**

    - Run the specified demo(Under the Surface) in Microsoft Edge within SplashKit Online.
    - The demo fails to compile and automatically shows the error:

    ```
    Failed to compile due to internal error!
    RangeError: Maximum call stack size exceeded
    ```

  - **Cross-browser Testing:**
    - Run the same demo in Google Chrome and Mozilla Firefox, which did not show this issue.
    - Confirmed that the problem is specific to Microsoft Edge.

  ------

  ### **What We Found Out**

  Describe (sentences), + graphs/screenshots/outcomes as needed

  - **Root Cause:**

    - Running the demo in Microsoft Edge causes the `RangeError: Maximum call stack size exceeded`, which suggests there might be an unhandled recursive call causing the stack overflow.

    - Other browsers (Chrome and Firefox) did not show this issue, indicating a compatibility problem or stack size limitation in Edge.

  - **Cross-browser Differences:**

    - Google Chrome and Firefox handle stack overflow errors more leniently, while Edge seems to have stricter limits on the call stack, revealing the issue more readily.

    -  Microsoft Edge

      ![image-20241208183830945](C:\Users\jiayi\AppData\Roaming\Typora\typora-user-images\image-20241208183830945.png)

    - Google Chrome

      ![image-20241208184007680](C:\Users\jiayi\AppData\Roaming\Typora\typora-user-images\image-20241208184007680.png)

    - Firefox

      ![image-20241208184116771](C:\Users\jiayi\AppData\Roaming\Typora\typora-user-images\image-20241208184116771.png)

  - **Recommended Solution:**
    - Add proper termination conditions to recursive functions in the JavaScript code to avoid infinite recursion.

  ------

  ### **Open Issues/Risks**

  List out the issues and risks that you have been unable to resolve at the end of the spike. You may have uncovered a whole range of new risks as well. Make notes to help the team manage and respond.*

  - **Risk:** If there are similar recursion issues elsewhere in the codebase, they may surface in other modules.

  ------

  ### **Recommendations**

  Often based on any open issues/risks Identified. You may state that another spike is required for the team to resolve new issues identified (or) indicate that this spike has increased the teams confidence in XYZ and should move on.*

  - It is recommended that the development team conducts a thorough code review, especially focusing on the implementation of recursive functions, ensuring each has a clear termination condition.
  - Improve compatibility with Microsoft Edge by regularly testing the project in multiple browsers to avoid compatibility issues.

  