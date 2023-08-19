# Splashkit Online Research Document

## Building A Web Code Editor


### Introduction
Whether you're creating a small script, experimenting with new ideas, or tackling complex projects, a code editor becomes your trusted companion when coding.

This is an interesting project to work on because having the knowledge of how to build a code editor will give you ideas on how to approach other projects that require you to integrate a code editor to show some functionality.

>The target of our project would be to build the code editor using typescript and add the 'splashkit' library to it.

TypeScript is a strong, open-source programming language developed by Microsoft. It is built on top of JavaScript, offering additional features and static typing.

Adding custom libraries to your own code editor is typically not specific to TypeScript but rather involves configuring your editor to recognize and provide code assistance for those libraries while you write code.

We will divide our project into three phases:
- Plan
- Design
- Launch

<br>

![Agile]("/../Agile%20Lifecycle.png)


### Plan
To create a web application that has a code editor we'll look at some examples:

- [Code mirror](https://codemirror.net/) is an open-source code editor library and a good choice as it has open-source support and reputable support community.

### Design
While you can customize your website to fit your unique needs or suit your style, there are specific actions that anyone who wants to design a website must take.

#### Define the Site’s Purpose

To design a website that yields expected results, you’ll need to define what you want from it. Consider why you’re designing the website—who your audience is, and what you’re targeting.

You’ll need to use the drag-and-drop interface to design each website page yourself. So, choose one that suits the purpose of your site.


It’s crucial you know crystal-clear the purpose of the intended website. Knowing it will help you adopt the right content strategy and guide you through choosing the right platform, theme and page architecture.

#### Work Flow

- A user lands on the web application and can select their preferred programming languages.
  
- Once the user is done writing their code, they can compile their code and see the output / results in the output window.
They'll either see success or failure for their code snippets. Everything is visible in the code output window.

- The user can add custom inputs to their code snippets, and the judge (our online compiler) will take into account the custom input which the user supplies.
  
- The user can see relevant details of the code that was executed.

When it comes to backend development, JavaScript is one of the most preferred technologies. Scripting can be performed both client-side and server-side using libraries and frameworks. Code can be scripted using this language and operated from anywhere. Moreover, Node.js allows two-way communication between clients and servers. Using Node.js, you can handle multiple requests from clients and reuse codes from various libraries. 

### Testing

#### Security Measures
In order to ensure the security of the user data, the code, and the platform itself, it is imperative to take stringent security measures. Authentication and authorization mechanisms must be implemented first to prevent unauthorized access. Encrypt your data transmission using HTTPS to prevent data manipulation.

To address known vulnerabilities, keep the editor's software and dependencies up-to-date and patched on a regular basis. Ensure your software is secure by following secure coding practices to avoid common vulnerabilities such as SQL injections, buffer overflows, and insecure deserializations.

Last but not least, ensure data integrity and availability by having a robust backup and recovery plan. It will be possible to identify and address potential vulnerabilities proactively by conducting security assessments, penetration tests, and continuous monitoring.

Developing an effective testing strategy for an online code editor ensures its effectiveness, performance, and security. In order to guarantee a high-quality user experience, the testing plan must encompass various phases and scenarios.

- Unit Testing: Ensure that individual code components such, as syntax highlighting and autocompletion are functioning properly.

- Integration Testing: Test the integration of different modules and features to ensure seamless operation.

- Functional Testing: Ensure that the critical functions, such as editing and saving of code, are performing as expected across browsers and operating systems.

- Performance Testing: Testing the responsiveness of the editor and loading times under various user loads to ensure smooth operation.

- Compatibility Testing: Ensure consistency across multiple operating systems and browsers (Chrome, Edge, Safari).

- User Experience Testing: See how easy it is to use, what responsiveness is like, and what intuitive workflows are possible.

- Version Control Testing: Test version control, rollback, and merge functionality.

- Accessibility Testing: Carry out accessibility testing to ensure people with disabilities can use the editor.

- API Testing: Inspect third-party integrations such as version control systems and libraries.

- Scalability Testing: Determine if the editor will be able to handle growing numbers of users and projects.

Finally, we can deploy our code editor either on a web server or in the cloud to make it readily accessible to users.