import { ErrorSeverity, validateIcon, ZetaIconError, ZetaIconNameError } from "@zebra-fed/zeta-icon-validator";
import { IconErrors } from "./types";

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
  themeColors: true,
  height: 800,
  width: 350,
});

const colorsToConvert = {
  black: ["#1D1E23"],
  white: ["#D9D9D9"],
};

// Ensures that the plugin only runs on the valid files and on the valid pages
const validFileNames = ["Icon Library", "🦓 ZDS - Assets", "IconsTestPage"];
const validPageNames = ["🦓 Icons", "Icons", "🦓 Icons (MASTER)", "🦓 Icons - Parent", "test"];

// Posts the error of the selected icons to the UI
figma.on("selectionchange", () => {
  console.log("Selection changed");
  figma.ui.postMessage("clear");

  const icons = figma.currentPage.selection.filter((node) => node.type == "COMPONENT_SET") as ComponentSetNode[];

  if (icons.length > 0) {
    const errors: IconErrors[] = [];

    for (const icon of icons) {
      if (iconErrors.get(icon.id) !== undefined) {
        errors.push(iconErrors.get(icon.id)!);
      }
    }

    figma.ui.postMessage({ iconErrors: errors });
  } else {
    figma.ui.postMessage({ iconErrors: Array.from(iconErrors.values()) });
  }
});

// Stores a map of icon ids to the relevant errors
const iconErrors: Map<string, IconErrors> = new Map();
const layerErrors: string[] = [];

// Generate all icon errors when the plugin is ran
figma.on("run", () => {
  // Stops the plugin from running on other pages and other files
  if (!validFileNames.includes(figma.root.name) || !validPageNames.includes(figma.currentPage.name)) {
    figma.showUI("This plugin should only be run within the ZDS - Assets file on the Icons page");

    return;
  }
  validateIcons();
});

const validateIcons = () => {
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

    let errors = validateIcon(icon, categoryName, usedIconNames);

    iconErrors.set(icon.id, {
      name: name,
      id: icon.id,
      errors: errors,
    });

    errors
      .filter((error) => error.errorType == "ColorError")
      .forEach((error) => {
        if (
          Object.values(colorsToConvert)
            .flat()
            .some((color) => error.message.includes(color))
        ) {
          changeColor(icon);
          const errorsToRemoveFromList = errors.filter(
            (error) =>
              error.errorType == "ColorError" &&
              Object.values(colorsToConvert)
                .flat()
                .some((color) => error.message.includes(color))
          );
          errorsToRemoveFromList.forEach((error) => {
            errors.splice(errors.indexOf(error), 1);
          });
          return;
        }
      });

    for (const error of errors) {
      if (error instanceof ZetaIconNameError && error.newName != undefined) {
        usedIconNames.push(error.newName);
      } else {
        usedIconNames.push(name);
      }
      if (error.errorType == "LayerError") {
        layerErrors.push(icon.id);
      }

      if (
        error.errorType == "BoundingBoxError" &&
        errors.filter((error) => error.errorType == "IconPartsError").length === 0
      ) {
        icon.resize(112, 72);
        errors.splice(errors.indexOf(error), 1);
      }
    }

    if (errors.length !== 0) {
      changeBorder(
        icon,
        errors.reduce((prev, current) => (prev.severity > current.severity ? prev : current)).severity
      );
    } else {
      changeBorder(icon, ErrorSeverity.none);
    }

    if (icon?.parent?.name === "DNA") {
      console.log("Icon is in DNA, and so errors are ignored.");
      errors = [];
      iconErrors.set(icon.id, {} as IconErrors);
    }
  }
  if (icons.length > 0) {
    figma.ui.postMessage({ iconErrors: Array.from(iconErrors.values()), icons: icons, layerErrors: layerErrors });
  }
};

figma.ui.onmessage = async (message) => {
  if (message.type === "fix-layer-issues") {
    fixLayerIssues(message.layerErrors);
  } else if (message.type === "reload") {
    validateIcons();
  } else if (message.type === "select-icon") {
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

/**
 * Iterates through layers and changes the color of any fills based on [colorsToConvert]
 * @param node: The node to change the color of
 */
const changeColor = (node: any) => {
  const fills = (node as any).fills;
  const children = (node as any).children;
  if (fills) {
    for (let fill of fills) {
      if (
        fill.color &&
        !(
          (fill.color.r === 1 && fill.color.g === 1 && fill.color.b === 1) ||
          (fill.color.r === 0 && fill.color.g === 0 && fill.color.b === 0)
        )
      ) {
        const r = Math.round(fill.color.r * 255);
        const g = Math.round(fill.color.g * 255);
        const b = Math.round(fill.color.b * 255);

        const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        if (hexColor === "#1D1E23") {
          (node as any).fills = [
            {
              blendMode: "NORMAL",
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              type: "SOLID",
              visible: true,
            },
          ];
        } else if (hexColor === "#FFFFFF" || hexColor === "#D9D9D9") {
          (node as any).fills = [
            {
              blendMode: "NORMAL",
              color: { r: 1, g: 1, b: 1 },
              opacity: 1,
              type: "SOLID",
              visible: true,
            },
          ];
        }
      }
    }
  }
  try {
    if (Array.isArray(children) && children.length > 0) {
      for (const child of children) {
        changeColor(child);
      }
    }
  } catch (e) {
    console.log(e);
  }
};

const fixLayerIssues = (layerErrors: string[]) => {
  const icons2 = figma.currentPage.findAllWithCriteria({
    types: ["COMPONENT_SET"],
  });

  layerErrors.forEach((key) => {
    const icon = icons2.find((icon) => icon.id === key);
    if (icon && icon.children && icon.children.length == 2) {
      (icon.children as ComponentSetNode[]).forEach((child: ComponentSetNode) => {
        if (child.children.length > 1) {
          figma.flatten(child.children).name = "Icon";
        } else {
          child.children[0].name = "Icon";
        }
      });
    }
    // validateIcons();
  });
};
