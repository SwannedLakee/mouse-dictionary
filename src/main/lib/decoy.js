/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */

import dom from "./dom";

const create = (tag) => {
  return new Decoy(tag);
};

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION"]);

const DEFAULT_STYLES = {
  position: "absolute",
  zIndex: 2147483647,
  opacity: 0,
};

const INPUT_STYLES = {
  INPUT: { overflow: "hidden", whiteSpace: "nowrap" },
  TEXTAREA: { overflow: "hidden" },
  SELECT: { overflow: "hidden", whiteSpace: "nowrap" },
  OPTION: { overflow: "hidden", whiteSpace: "nowrap" },
};

const COPY_STYLE_PROPERTIES = [
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

class Decoy {
  constructor(tag) {
    this.elementCache = createElement(tag);
    this.decoy = null;
  }

  activate(underlay) {
    if (!this.elementCache) {
      return;
    }
    if (!INPUT_TAGS.has(underlay.tagName)) {
      return;
    }
    const decoy = prepare(dom.clone(underlay, this.elementCache), underlay);

    document.body.appendChild(decoy);
    this.decoy = decoy;

    // These values are required to be set after appendChild.
    decoy.scrollTop = underlay.scrollTop;
    decoy.scrollLeft = underlay.scrollLeft;
    const correctionWidth = underlay.clientWidth - decoy.clientWidth;
    const correctionHeight = underlay.clientHeight - decoy.clientHeight;

    const computedStyle = getComputedStyle(underlay);
    const decoyAdditionStyles = {};
    for (const prop of COPY_STYLE_PROPERTIES) {
      decoyAdditionStyles[prop] = computedStyle[prop];
    }
    decoyAdditionStyles.width = `${underlay.clientWidth + correctionWidth}px`;
    decoyAdditionStyles.height = `${underlay.clientHeight + correctionHeight}px`;

    dom.applyStyles(decoy, decoyAdditionStyles);
  }

  deactivate() {
    if (!this.elementCache) {
      return;
    }
    const decoy = this.decoy;
    this.decoy = null;
    if (decoy) {
      document.body.removeChild(decoy);
    }
  }
}

const createElement = (tag) => {
  if (!tag) {
    return null;
  }
  return document.createElement(tag);
};

const prepare = (decoy, underlay) => {
  decoy.innerText = getElementText(underlay);

  const style = createDecoyStyle(decoy, underlay);

  // Specify only absolute size
  style.width = `${underlay.clientWidth}px`;
  style.height = `${underlay.clientHeight}px`;
  dom.applyStyles(decoy, style);
  for (const p of ["min-width", "min-height", "max-width", "max-height"]) {
    decoy.style.removeProperty(p);
  }
  return decoy;
};

const getElementText = (element) => {
  if (element.tagName === "SELECT") {
    return getSelectText(element);
  }
  return element.text ?? element.value;
};

function getSelectText(element) {
  const index = element.selectedIndex;
  return element.options[index]?.text;
}

const createDecoyStyle = (decoy, underlay) => {
  const offset = getOffset(underlay);
  const top = offset.top - dom.pxToFloat(decoy.style.marginTop);
  const left = offset.left - dom.pxToFloat(decoy.style.marginLeft);

  const dynamicStyles = {
    top: `${top}px`,
    left: `${left}px`,
  };

  return {
    ...dynamicStyles,
    ...DEFAULT_STYLES,
    ...INPUT_STYLES[underlay.tagName],
  };
};

const getOffset = (element) => {
  const rect = element.getBoundingClientRect();
  const doc = document.documentElement;

  return {
    top: rect.top + window.scrollY - doc.clientTop,
    left: rect.left + window.scrollX - doc.clientLeft,
  };
};

export default { create };
