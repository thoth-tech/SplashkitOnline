//Applies a theme by overriding CSS variables using a JSON object
function applyTheme(theme) {
  //For each table index passed
    for (const key in theme) {
      //Apply each color variable to the root of the document
      document.documentElement.style.setProperty(`--${key}`, theme[key]);
    }
}
  
//example
//const darkTheme = {
    //'background-color': '#1e1e1e',
    //'text-color': '#ffffff',
    //'primary-color': '#3498db'
//};
  
//Call the the function with the example
//applyTheme(darkTheme);
  

//Run it in console dynamically after hosted
//window.applyTheme = applyTheme;
