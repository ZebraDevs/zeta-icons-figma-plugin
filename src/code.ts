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
figma.showUI(__html__, { themeColors: true });

// This monitors the selection changes and posts the selection to the UI
figma.on("selectionchange", () => {
  figma.ui.postMessage(figma.currentPage.selection);
});

figma.on("run", () => {
  const icons = figma.currentPage.findAllWithCriteria({
    types: ["COMPONENT_SET"],
  });

  const errors: ZetaIconError[] = [];
  const usedIconNames: string[] = [];

  for (const icon of icons) {
    let name = icon.name;
    let categoryName = icon.parent?.name;
    console.log(name);

    const error = checkIconName(name, categoryName, usedIconNames);
    if (error.severity != ErrorSeverity.none) {
      errors.push(error);
    }

    if (error.newName != undefined) {
      usedIconNames.push(error.newName);
    } else {
      usedIconNames.push(name);
    }
  }

  figma.ui.postMessage(errors);
});
