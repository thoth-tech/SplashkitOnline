//Applies a theme by overriding CSS variables using a JSON object
function applyTheme(theme) {
  if (!theme) {                           // empty/null/undefined ⇒ reset
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
    "editorBackgroundColour": "#fdfdfd",
    "editorKeyword": "#28282B",
    "editorComment": "#00A36C",
    "editorLineNumber": "#353935",
    "primary"              : "#202020",
    "activeTabColour"      : "#268bd2"
    //More can be added from the colours.css file
  },
  dark: {
    "editorBackgroundColour": "#1e1e1e",
    "editorKeyword": "#FAF9F6",
    "editorComment": "#228B22",
    "editorLineNumber": "#FFFFF0",
    "primary"              : "#dcdcdc",
    "activeTabColour"      : "#3af"
  },
  "professional-grey": {
    "editorBackgroundColour": "#2b2b2b",
    "editorKeyword": "#FAF9F6",
    "editorComment": "#5F8575",
    "editorLineNumber": "#FFFFFF",
    "primary"              : "#e0e0e0",
    "activeTabColour"      : "#6a9fb5"
  },
  space: {
    "editorBackgroundColour": "#0d1117",
    "primary"              : "#c9d1d9",
    "editorKeyword": "#A7C7E7",
    "editorComment": "#191970",
    "editorLineNumber": "#191970",
    "activeTabColour"      : "#8a63d2"
  }
};


//Build a simple <select id="themeSelection">
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("themeSelection");
  if (!sel) return;
  sel.add(new Option("default / none", ""));   //empty value triggers reset        
  Object.keys(themes).forEach(name => sel.add(new Option(name, name)));
  sel.onchange = () => applyTheme(themes[sel.value]);
});

