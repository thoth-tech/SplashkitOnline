//Applies a theme by overriding CSS variables using a JSON object
function applyTheme(theme) {
  //Helper function used to apply theme to specific document because of:
  //Main parent document
  //Iframe execution environment for the runtime/terminal
  const applyThemeToDocument = (doc) => {
    //Reset if empty, null or undefined
    if (!theme) {
      doc.documentElement.removeAttribute("style");
      return;
    }

    //For each entry (element) inside of each theme category that is applied
    for (const key in theme) {
      doc.documentElement.style.setProperty(`--${key}`, theme[key]);
    }
  };

  //Apply the theme to the main website/editor UI
  applyThemeToDocument(document);

  //Execution environment runs inside an iframe which has its own separate document
  //The theme must also be applied there for the terminal to update correctly
  const iframe = document.getElementById("iframetest");

  //Only apply the theme if the iframe exists and has loaded
  if (iframe && iframe.contentDocument) {
    applyThemeToDocument(iframe.contentDocument);
  }
}

//Run it in console dynamically after hosted
window.applyTheme = applyTheme;

//Reapplies the last selected theme from localStorage
function applySavedTheme() {
  const savedTheme = localStorage.getItem("skoTheme");

  if (savedTheme && themes[savedTheme]) {
    applyTheme(themes[savedTheme]);
  }
}

//Expose helper so other files can reapply the theme after iframe/language reloads
window.applySavedTheme = applySavedTheme;

//Available themes that can be applied
const themes = {
  light: {
    "editorBackgroundColour": "#ffffff",
    "gutterColour": "#f3f6fb",
    "shadowColour": "#d8dee9",
    "editorKeyword": "#2f81f7",
    "editorComment": "#6a737d",
    "editorLineNumber": "#7a8699",
    "editorGutterBackground": "#eef3fb",
    "editorString": "#22863a",
    "editorFunctionsAndObject": "#d63384",
    "editorProperty": "#005cc5",
    "editorNumber": "#b36b00",
    "editorMeta": "#24292e",
    "editorVariable2": "#24292e",
    "editorType": "#0b7285",
    "editorSelected": "rgba(0, 95, 184, 0.16)",
    "primary": "#1f2328",
    "language": "#005cc5",
    "tagBackground": "#e8f1fb",
    "fileColour": "#2f81f7",
    "iconHover": "#003f8f",
    "terminalBackground": "#f6f8fa",
    "loadingBackground": "#d8dee9",
    "languageSelectBackground": "#f3f6fb",
    "nodeHover": "#e8f1fb",
    "demoTitleBackground": "#e8f1fb",
    "demoThumbnailBackground": "rgba(0, 95, 184, 0.08)",
    "errorLineBackground": "#ffe5e8",
    "errorColour": "#d08770"
  },
  dark: {
    "editorBackgroundColour": "#1f1b18",
    "gutterColour": "#191512",
    "shadowColour": "#191512",
    "editorKeyword": "#e06c75",
    "editorComment": "#6f665e",
    "editorLineNumber": "#6c6258",
    "editorGutterBackground": "#2a241f",
    "editorString": "#cf8c6c",
    "editorFunctionsAndObject": "#f2e5d7",
    "editorProperty": "#c7925b",
    "editorNumber": "#e5c07b",
    "editorMeta": "#f2d9b6",
    "editorVariable2": "#ffe66d",
    "editorType": "#c8a15a",
    "editorSelected": "rgba(229, 168, 75, 0.18)",
    "primary": "#f2e5d7",
    "language": "#d9a066",
    "tagBackground": "#322b25",
    "fileColour": "#c8a15a",
    "iconHover": "#e5a84b",
    "terminalBackground": "#181411",
    "loadingBackground": "#3b322c",
    "languageSelectBackground": "#2a241f",
    "nodeHover": "#332c26",
    "demoTitleBackground": "#2a241f",
    "demoThumbnailBackground": "rgba(0,0,0,0.28)",
    "errorLineBackground": "#4b2c2c",
    "errorColour": "#d08770"
  },
  "professional-grey": {
    "editorBackgroundColour": "#2b2f36",
    "gutterColour": "#24282f",
    "shadowColour": "#24282f",
    "editorKeyword": "#7aa2f7",
    "editorComment": "#7d8590",
    "editorLineNumber": "#6b7280",
    "editorGutterBackground": "#31363f",
    "editorString": "#8fbf8f",
    "editorFunctionsAndObject": "#88c0d0",
    "editorProperty": "#b4befe",
    "editorNumber": "#7fd9b3",
    "editorMeta": "#d8dee9",
    "editorVariable2": "#e5e9f0",
    "editorType": "#81a1c1",
    "editorSelected": "rgba(136, 192, 208, 0.16)",
    "primary": "#eceff4",
    "language": "#88c0d0",
    "tagBackground": "#3b4252",
    "fileColour": "#8fa7bf",
    "iconHover": "#a7bfd9",
    "terminalBackground": "#22272e",
    "loadingBackground": "#434c5e",
    "languageSelectBackground": "#31363f",
    "nodeHover": "#3a404c",
    "demoTitleBackground": "#2f3540",
    "demoThumbnailBackground": "rgba(0,0,0,0.22)",
    "errorLineBackground": "#5a4540",
    "errorColour": "#d08770"
  },
  space: {
    "editorBackgroundColour": "#161320",
    "gutterColour": "#120f1a",
    "shadowColour": "#120f1a",
    "editorKeyword": "#8ab4ff",
    "editorComment": "#6b6780",
    "editorLineNumber": "#7a7496",
    "editorGutterBackground": "#211c33",
    "editorString": "#ffb3e6",
    "editorFunctionsAndObject": "#7ee7ff",
    "editorProperty": "#caa6ff",
    "editorNumber": "#ffd580",
    "editorMeta": "#f5eaff",
    "editorVariable2": "#ffffff",
    "editorType": "#b388ff",
    "editorSelected": "rgba(138, 180, 255, 0.18)",
    "primary": "#f5f0ff",
    "language": "#7ee7ff",
    "tagBackground": "#2a2340",
    "fileColour": "#b388ff",
    "iconHover": "#7ee7ff",
    "terminalBackground": "#100d18",
    "loadingBackground": "#7ee7ff",
    "languageSelectBackground": "#211c33",
    "nodeHover": "#2b2442",
    "demoTitleBackground": "#211c33",
    "demoThumbnailBackground": "rgba(120, 90, 255, 0.14)",
    "errorLineBackground": "#4a2d4d",
    "errorColour": "#ff7eb6"
  }
};


//Build a simple <select id="themeSelection">
//Wait until the page content has loaded
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("themeSelection");
  //Stop if the <select> isn’t there
  if (!sel) return;
  sel.add(new Option("default / none", ""));   //Blank value = go back to default  
  //Add every theme as an option
  Object.keys(themes).forEach(name => sel.add(new Option(name, name))); //Visible text, value
  //Change the theme when the user picks something
  //sel.onchange = () => applyTheme(themes[sel.value]);


  //When user picks a new theme
  sel.onchange = () => {
    const selected = sel.value;
    if (!selected) {
      applyTheme(null); // reset
      localStorage.removeItem("skoTheme");
    } else {
      applyTheme(themes[selected]);
      localStorage.setItem("skoTheme", selected);
    }
  };

  //Reapply saved theme when the page reloads
  const savedTheme = localStorage.getItem("skoTheme");

  if (savedTheme && themes[savedTheme]) {
    sel.value = savedTheme;
    applyTheme(themes[savedTheme]);
  }

});

