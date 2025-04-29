//Applies a theme by overriding CSS variables using a JSON object
function applyTheme(theme) {
  if (!theme) {                           //empty/null/undefined = reset
    document.documentElement.removeAttribute("style");
    return;
  }
  //For each entry (element) inside of each theme category that is applied
  for (const key in theme) {
    //Apply each color variable to the root of the document
    document.documentElement.style.setProperty(`--${key}`, theme[key]);
  }
}

//Run it in console dynamically after hosted
window.applyTheme = applyTheme;

//Avaliable themes that can be applied
const themes = {
  light: {
    "editorBackgroundColour": "#8d8d8d",
    //"gutterColour": "#8d8d8d",
    "shadowColour": "#8d8d8d",
    "editorKeyword": "#28282B",
    "editorComment": "#00A36C",
    "editorLineNumber": "#353935",
    "editorGutterBackground": "#202020",
    "editorString": "#1f1f1f"
    //More can be added from the colours.css file
  },
  dark: {
    "editorBackgroundColour": "#1e1e1e",
    //"gutterColour": "#1e1e1e",
    "shadowColour": "#1e1e1e",
    "editorKeyword": "#FAF9F6",
    "editorComment": "#228B22",
    "editorLineNumber": "#FFFFF0",
    "editorGutterBackground": "#dcdcdc",
    "editorString": "#fdfdfd"
  },
  "professional-grey": {
    "editorBackgroundColour": "#2b2b2b",
    //"gutterColour": "#2b2b2b",
    "shadowColour": "#2b2b2b",
    "editorKeyword": "#FAF9F6",
    "editorComment": "#5F8575",
    "editorLineNumber": "#FFFFFF",
    "editorGutterBackground": "#e0e0e0"
  },
  space: {
    "editorBackgroundColour": "#0d1117",
    //"gutterColour": "#0d1117",
    "shadowColour": "#0d1117",
    "editorKeyword": "#A7C7E7",
    "editorComment": "#191970",
    "editorLineNumber": "#191970",
    "editorGutterBackground": "#c9d1d9"
  }
};


//Build a simple <select id="themeSelection">
//Wait until the page Content has been loaded
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("themeSelection");
  //Stop if the <select> isn’t there
  if (!sel) return;
  sel.add(new Option("default / none", ""));   //Blank value = go back to default  
  //Add every theme as an option
  Object.keys(themes).forEach(name => sel.add(new Option(name, name))); /Visible text, value
  //Change the theme when the user picks something
  sel.onchange = () => applyTheme(themes[sel.value]);
});

