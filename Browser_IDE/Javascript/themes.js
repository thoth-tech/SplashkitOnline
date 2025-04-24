//Applies a theme by overriding CSS variables using a JSON object
function applyTheme(theme) {
  //For each table index passed
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
    "primary"              : "#202020",
    "activeTabColour"      : "#268bd2"
  },
  dark: {
    "editorBackgroundColour": "#1e1e1e",
    "primary"              : "#dcdcdc",
    "activeTabColour"      : "#3af"
  },
  "professional-grey": {
    "editorBackgroundColour": "#2b2b2b",
    "primary"              : "#e0e0e0",
    "activeTabColour"      : "#6a9fb5"
  },
  space: {
    "editorBackgroundColour": "#0d1117",
    "primary"              : "#c9d1d9",
    "activeTabColour"      : "#8a63d2"
  }
};


// Build a simple <select id="themeSelection"> if it’s in the page
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("themeSelection");
  if (!sel) return;                            // ignore if you haven’t added the element yet
  Object.keys(themes).forEach(name => sel.add(new Option(name, name)));
  sel.onchange = () => applyTheme(themes[sel.value]);
});

