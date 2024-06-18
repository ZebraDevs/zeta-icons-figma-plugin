// This plugin will open a tab that indicates that it will monitor the current
// selection on the page. It cannot change the document itself.

import {
  ErrorSeverity,
  ZetaIconError,
  checkIconName,
} from "zeta-icon-name-checker";

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
  themeColors: true,
  height: 800,
  width: 350,
});

// Ensures that the plugin only runs on the valid files and on the valid pages
const validFileNames = ["Icon Library", "🦓 ZDS - Assets"];
const validPageNames = ["🦓 Icons", "Icons"];

// Posts the error of the selected icons to the UI
figma.on("selectionchange", () => {
  figma.ui.postMessage("clear");

  const icons = figma.currentPage.selection.filter(
    (node) => node.type == "COMPONENT_SET"
  ) as ComponentSetNode[];

  if (icons.length > 0) {
    const errors: ZetaIconError[] = [];

    for (const icon of icons) {
      const iconError = iconErrors.get(icon.id);

      if (iconError != undefined) {
        errors.push(iconError);
      }
    }

    figma.ui.postMessage(errors);
  } else {
    figma.ui.postMessage(Array.from(iconErrors.values()));
  }
});

// Stores a map of icon ids to the relevant errors
const iconErrors: Map<string, ZetaIconError> = new Map();

figma.on("run", () => {
  // Stops the plugin from running on other pages and other files
  if (
    !validFileNames.includes(figma.root.name) ||
    !validPageNames.includes(figma.currentPage.name)
  ) {
    figma.showUI(
      "This plugin should only be run within the ZDS - Assets file on the Icons page"
    );
    return;
  }

  // Clear the UI and icon errors
  iconErrors.clear();
  figma.ui.postMessage("clear");

  // Finds all the icons
  const icons = figma.currentPage.findAllWithCriteria({
    types: ["COMPONENT_SET"],
  });

  // The used icon names
  const usedIconNames: string[] = [];

  // Generate the icon errors
  for (const icon of icons) {
    let name = icon.name;
    let categoryName = icon.parent?.name;

    const error = checkIconName(name, categoryName, usedIconNames);
    if (error.severity != ErrorSeverity.none) {
      iconErrors.set(icon.id, error);
    }

    changeBorder(icon, error.severity);

    if (error.newName != undefined) {
      usedIconNames.push(error.newName);
    } else {
      usedIconNames.push(name);
    }
  }
  if (icons.length > 0) {
    figma.ui.postMessage(Array.from(iconErrors.values()));
  }
});

// Changes the border of a given icon based on the severity of its error
function changeBorder(element: ComponentSetNode, severity: ErrorSeverity) {
  let color;
  let strokeWeight = 1;

  switch (severity) {
    case ErrorSeverity.none:
      color = defaultBorderColor;
      break;
    case ErrorSeverity.medium:
      color = warningBorderColor;
      break;
    case ErrorSeverity.high:
      color = errorBorderColor;
      strokeWeight = 3;
      break;
  }

  let newStroke: SolidPaint = {
    color: color,
    type: "SOLID",
  };

  if ((element.strokes[0] as SolidPaint | undefined)?.color != color) {
    element.strokeWeight = strokeWeight;
    element.strokes = [newStroke];
  }
}

const defaultBorderColor = {
  r: 0.48235294222831726,
  g: 0.3803921639919281,
  b: 1,
};
const errorBorderColor = {
  r: 1,
  g: 0,
  b: 0,
};

const warningBorderColor = {
  r: 1,
  g: 0.5,
  b: 0,
};
