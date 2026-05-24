# Adding a Custom Theme to SplashKit Online

The guide provides instructions for adding new themes to the SplashKit Online editor through theme.js and colors.css modifications and user interface updates for theme selection functionality.

## Files Involved
- `javascript/UI/themes.js`
- `css/colours.css`
- `index.html`

## Add Theme Colours to *theme.js*

Add your preferred color values to the themes object in javascript/UI/themes.js. 

```js
"myCustomTheme": {
  "editorBackgroundColour": "#2e3440",
  "editorKeyword": "#81a1c1",
  "editorComment": "#616e88",
  "editorLineNumber": "#d8dee9",
  "editorGutterBackground": "#3b4252",
  "editorString": "#a3be8c"
}
```


## Theme Selector in *index.html* is updated 

Make sure that this is updated, as this is resposible for enabling users to select the theme. 

```html
<li style="margin-left:1rem">
<div>Theme:&nbsp;</div>
<select id="themeSelection"></select>
</li>
```

## CSS Variables in *colours.css*

The Themes system enables runtime modification of CSS variables through its functionality. The available variables exist within the css/colours.css file which you can access for viewing.

```css
/* Code editor colours */
--editorKeyword
--editorComment
--editorGutterBackground
--editorLineNumber
--editorFunctionsAndObject
--editorProperty
--editorNumber
--editorSelected
--editorString
--editorMeta
--editorVariable2
--editorType
--editorBackgroundColour

/* UI colours */
--gutterColour
--disabled
--errorColour
--warning
--activeTabColour
--nodeConflict
--languageSelectBackground
--errorLineBackground
--transientColour

/* Gutter colours */
--shadowColour
--nodeHover
--fileColour
--iconHover

/* Terminal colours */
--terminalBackground

/* Text */
--primary

/* Demo colours */
--language
--tagBackground
--demoTitleBackground
--demoThumbnailBackground

/* Loading bar */
--loadingBackground

/* Fonts */
--font
--editorFont
```

