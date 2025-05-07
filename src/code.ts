import { ErrorSeverity, validateIcon, ZetaIconError, ZetaIconNameError } from "@zebra-fed/zeta-icon-validator";
import { IconErrors } from "./types";

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
  themeColors: true,
  height: 800,
  width: 350,
});

// Ensures that the plugin only runs on the valid files and on the valid pages
const validFileNames = ["Icon Library", "🦓 ZDS - Assets"];
const validPageNames = ["🦓 Icons", "Icons", "🦓 Icons - Parent"];

// Posts the error of the selected icons to the UI
figma.on("selectionchange", () => {
  figma.ui.postMessage("clear");

  const icons = figma.currentPage.selection.filter((node) => node.type == "COMPONENT_SET") as ComponentSetNode[];

  if (icons.length > 0) {
    const errors: IconErrors[] = [];

    for (const icon of icons) {
      if (iconErrors.get(icon.id) !== undefined) {
        errors.push(iconErrors.get(icon.id)!);
      }
    }

    figma.ui.postMessage(errors);
  } else {
    figma.ui.postMessage(Array.from(iconErrors.values()));
  }
});

// Stores a map of icon ids to the relevant errors
const iconErrors: Map<string, IconErrors> = new Map();

// Generate all icon errors when the plugin is ran
figma.on("run", () => {
  // Stops the plugin from running on other pages and other files
  if (!validPageNames.includes(figma.currentPage.name)) {
    //|| !validFileNames.includes(figma.root.name)) {
    figma.showUI(
      figma.currentPage.name + " " + "   This plugin should only be run within the ZDS - Assets file on the Icons page"
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

    const errors = validateIcon(icon, categoryName, usedIconNames);

    iconErrors.set(icon.id, {
      name: name,
      id: icon.id,
      errors: errors,
    });

    let highestSeverity = ErrorSeverity.none;

    for (const error of errors) {
      if (error.severity > highestSeverity) {
        highestSeverity = error.severity;
      }

      if (error instanceof ZetaIconNameError && error.newName != undefined) {
        usedIconNames.push(error.newName);
      } else {
        usedIconNames.push(name);
      }
    }
    changeBorder(icon, highestSeverity);
  }
  if (icons.length > 0) {
    figma.ui.postMessage(Array.from(iconErrors.values()));
  }
});

figma.ui.onmessage = async (message) => {
  if (message.type === "select-icon") {
    const nodeToSelect = await figma.getNodeByIdAsync(message.iconId);
    if (nodeToSelect) {
      figma.currentPage.selection = [nodeToSelect as SceneNode];
    }
  }
};

/**
 * Changes the border of a given icon based on the severity of its error
 * @param element
 * @param severity
 */
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
