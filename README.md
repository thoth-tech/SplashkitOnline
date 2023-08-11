# SplashkitOnline

---
title: 'Requirements for building Splashkit Online'
author: 'Anshuman Bishnoi'
date: '2023-08-08'
output: html_document
---
Test to see if I can create a PR
## Requirements for building Splashkit Online (Web code editor)

### **1. Frontend technologies**

<div align ='justify'>
As we know, frontend of any website is everything we see and with which we can interact. For creating the frontend, we use combination of HTML, CSS and JavaScript. HTML is used for basic structure of the page, CSS helps in visual editing of the website, however, JavaScript is implemented for making the website interactive.

* **HTML :** It is basically a computer language which is designed to create websites which can be explored by anybody using the internet. It is used in structuring a web document. It uses a series of short codes also known as tags, normalized into a text-file. The text is finally saved as an HTML file which can be observed through browser on the internet.

* **CSS :** It is a style sheet language. It is implemented for defining how HTML elements should be presented on a webpage in context to design, layout, and variations. It is used to interact with components of a webpage. It communicates with HTML through selectors. A declaration is what the properties and values which are employed by selector. Properties define colour, font size as well as margins.

* **JavaScript :** It is the scripting language. It can be used to provide technologies which enables front-end as well as back-end development. It allows the website to replying to user’s actions and refreshing themselves in a dynamic manner. JavaScript uses frameworks to arrange a website or web application. There are many frameworks available like Angular, React, Vue, Ember, Meteor etc, but Angular is one of the most efficient and powerful. It is open-source framework which can be used for developing a Single Page Application.

<br>

#### **Why Angular framework is better to use??**

1. A simplified MVC structure is used for web development which decreases the load time of the page. It is one of the primary reasons for choosing angular it ensures rapid development with the removal of unnecessary code.
2. Provides a better understanding of the application before execution. It basically eliminates the need for unnecessary code. Code can be easily simplified.
3. Moreover, TypeScript language is also known as a superscript for JavaScript and compilation of Angular framework with TypeScript is efficient.

* **Code Mirror:** It is a library in JavaScript which can be used for syntax highlighting, code autocompletion and adding other code editor features. It includes a rich programming interface which allow further extension.

### **2. User interface of the Editor**

In the design of the interface, we need to consider the functionality, convenient to use and aesthetics. Some components of the interface are as below:

- **Code editor area :** It is a large area which is used for writing and editing the code. It should have the functionality of syntax highlighting, line numbering etc for better understanding and readability.

- **Language selector :** For selecting the programming language in which we want to write the code, there should be dropdown or we can say a set of buttons. It will help the developer in providing syntax highlighting as well as auto-completion suggestions depending on the language.

- **File management :** This feature can be used to create, open, save and manage files. Moreover, a toolbar should be implemented which helps for common actions like saving, copy/cut/paste, search etc.

- **Settings :** It could be used for customizing editor preferences like font size, tab size or indentation related settings.

- **Error detection :** The editor should be able to figure out syntax errors, and display these to the user which can be accomplished by underlining errors or these can be shown on a separate panel.

### **3. Code execution**

After setting up the front-end setup, we also need to implement the back-end development by developing the server-side environment which enable the execution of user code safely. After clicking the “Execute” button, the front-end of the system sends the code to backend for execution. The code is then run inside the sandbox environment through appropriate language environment. The code from the front-end can be send to the backend using POST method of HTTP requests. The code is processed at the backend which is executed and sent back to front-end for displaying the output and any errors which may have been encountered.

<br>

**WebAssembly** is a technique which allows developers to run high-performance code which is written in languages like C++, C, Rust etc, directly on the web browser. It helps in handling complex operations and computations in an efficient manner. Using WebAssembly, different programming languages can be used for building the core functionality of web code editor.

### **4.Backend development**

For backend development, we need to start by setting up the server which is able to handle incoming requests from the front-end side. The technologies used for this are Node.js, Python using frameworks like Django or Flask, Ruby with Rails, etc. Moreover, we also need to develop user authentication.

#### **Using JavaScript for backend development.**

JavaScript is one of the most preferred technologies used for backend development. It is able to provide full stack technologies using libraries and frameworks for client-side as well as server-side scripting. This is the language which allows the developers to script the code and operating is anywhere. It is the language which can be included in different browsers and platforms without any modification of code. Moreover, it is easy to learn backend language due to easy and convenient syntax. Apart from it, this language can also be integrated with any language for building the backend. Moreover, Node.js and Express.js can also be utilized.

<br>
Node.js can be used to make two-way communication among clients and servers. With the help of Node.js, multiple requests from the clients can be handled and also codes from different libraries can be re-used. It is lightweight and fast-processing. Moreover, when using JavaScript at front-end and back-end, communication is made easy via REST API which is basically an architecture based on web standards and it uses HTTP protocols. It is a good practise to use NodeJS with Express to make an API responsive and efficient.

<br>

#### **Implementing WebSocket technology for providing communication between multiple clients**

This technology can be used to provide communication among multiple developers in the web application, i.e, changes made to the code in the application can be reflected to all the users in the network as WebSocket provides full-duplex communication. Once, the WebSocket connection is established, server and the clients are able to send as well as receive data and this kind of bidirectional communication enables the server to provide updates to all the clients in real-time.

### **5.Security Considerations**

There are some security vulnerabilities which could have harmful consequences and violating integrity for users. So, it is best to implement security practises, some of them are below:

* **Validating user input :** Using proper validating techniques to ensure if the data is handled securely before storing, processing as well as displaying.

* **XSS Prevention (Cross-Site Scripting):** We also need to implement measures for preventing XSS attacks like escaping content generated by user with the help of security policies.

* **Session management :** Implementing secure session management and ensuring user authentication and authorization.

* Implement HTTPS for encrypting data transmission between server and client.

### **6.Database Management**

In Relational databases, they are based on relational model and SQL (Structural Query Language) is used for storing and retrieving data. This type of databases is used for storing structured data. In our case, we can store information related to the developer and his code. MySQL is an open-source RDBMS which is commonly used in most web applications and data. It is also compatible with most of the OS which includes Linux, MacOS and Windows. MySQL is known for its performance, reliability and convenient usage.

We need to create a database for the code editor. Data entities in our project could be users, code files, etc. We should design the columns for storing necessary data. For instance, user table can have attributes like username, email etc.

In the backend code, via Node.js, we have to establish a connection to the MySQL database with help of appropriate MySQL client library.

We also need to ensure how we are storing the code files in the database if a user wants to save his code. One way could be storing the code content as text in the database.

### **7.Testing**

Before deploying the web editor for use, we should make sure that, we perform testing on it. We must focus on the unit tests for the functionality and check whether expected output is printed on the console depending on different languages. Also, we need to conduct functional testing to validate whether the user is able to save, delete or edit the code files. Moreover, we need to check that the user interface is compatible with the browsers, UI elements are properly aligned and displayed to the end user.

### **8.Deployment**

Lastly, we can deploy our code editor either on the web server or a cloud platform so that users can access it. CodeDeploy, Docker, Jenkins are various a deployment services which automates application deployments.

</div>
