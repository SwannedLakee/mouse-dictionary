/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */

import entry from "./entry";
import Generator from "./generator";
import dom from "../lib/dom";
import storage from "../lib/storage";
import ShortCache from "../lib/shortcache";
import utils from "../lib/utils";

const TEXT_LENGTH_LIMIT = 128;

export default class Lookuper {
  constructor(settings, doUpdateContent) {
    this.lookupWithCapitalized = settings.lookupWithCapitalized;
    this.doUpdateContent = doUpdateContent;

    this.lastText = null;
    this.aimed = false;
    this.suspended = false;
    this.halfLocked = false;
    this.textLengthLimit = TEXT_LENGTH_LIMIT;

    // Compile templates, regular expressions so that it works fast
    this.generator = new Generator(settings);
    const cacheSize = process.env.NODE_ENV === "production" ? 100 : 0;
    this.shortCache = new ShortCache(cacheSize);

    this.reListForRefs = [/<→(.+?)>/g, /<→(.+?)$>/g];
  }

  canUpdate() {
    if (this.suspended) {
      return false;
    }
    if (this.halfLocked && this.aimed) {
      return false;
    }
    if (!this.halfLocked && utils.getSelection()) {
      return false;
    }
    return true;
  }

  async lookup(text) {
    if (!this.canUpdate()) {
      return;
    }
    await this.update(text, false, true, 0);
  }

  async aimedLookup(text) {
    if (!text) {
      this.aimed = false;
      return;
    }
    this.aimed = true;
    await this.update(text, true, false, 1);
  }

  async update(text, includeOriginalText, enableShortWord, threshold) {
    if (!text) {
      return;
    }
    const textToLookup = text.substring(0, this.textLengthLimit);
    if (!textToLookup) {
      return;
    }
    if (!includeOriginalText) {
      if (this.lastText === textToLookup) {
        return;
      }
      const cacheData = this.shortCache.get(textToLookup);
      if (cacheData) {
        this.doUpdateContent(cacheData.dom, cacheData.hitCount);
        this.lastText = textToLookup;
        return;
      }
    }
    console.time("lookup");
    await this.run(textToLookup, includeOriginalText, enableShortWord, threshold);
    console.timeEnd("lookup");
  }

  async run(textToLookup, includeOrgText, enableShortWord, threshold) {
    const { entries, lang } = entry.build(textToLookup, this.lookupWithCapitalized, includeOrgText);
    const { heads, descriptions } = await fetchDescriptions(entries, this.reListForRefs);

    const { html, hitCount } = this.generator.generate(heads, descriptions, enableShortWord && lang === "en");
    const newDom = dom.create(html);

    if (hitCount < threshold) {
      return;
    }
    this.doUpdateContent(newDom, hitCount);

    this.shortCache.put(textToLookup, { dom: newDom, hitCount });
    this.lastText = textToLookup;

    console.info(`${entries.join(",")}`);
    console.info(`${entries.length}`);
  }
}

const fetchDescriptions = async (entries, reListForRefs) => {
  const baseDescriptions = await storage.local.get(entries);
  const baseHeads = entries.filter(e => baseDescriptions[e]);

  console.time("lookup2");
  const refHeads = pickOutRefs(baseDescriptions, reListForRefs);
  const refDescriptions = {};
  if (refHeads.length >= 1) {
    const r = await storage.local.get(refHeads);
    Object.assign(refDescriptions, r);
  }
  console.timeEnd("lookup2");
  const heads = [...baseHeads, ...refHeads];
  const descriptions = { ...baseDescriptions, ...refDescriptions };
  return { heads, descriptions };
};

const pickOutRefs = (descriptions, reListForRefs) => {
  const resultSet = new Set();
  const existingKeys = new Set(Object.keys(descriptions));
  const descList = Object.values(descriptions);

  for (let i = 0; i < descList.length; i++) {
    const desc = descList[i];
    const refList = capture(desc, reListForRefs);

    for (let i = 0; i < refList.length; i++) {
      const ref = refList[i];
      if (existingKeys.has(ref)) {
        continue;
      }
      resultSet.add(ref);
    }
  }
  return Array.from(resultSet);
};

const capture = (str, reList) => {
  const capturedStrings = [];
  for (let i = 0; i < reList.length; i++) {
    const re = reList[i];
    const matches = str.matchAll(re);
    for (const m of matches) {
      capturedStrings.push(m[1]);
    }
  }
  return capturedStrings;
};
