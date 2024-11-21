/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */
/* istanbul ignore file */

import settings from "../../main/settings";
import type { MouseDictionarySettings } from "../types";

const defaultSettingsJson = JSON.stringify(settings);

export const get = (): MouseDictionarySettings => {
  return JSON.parse(defaultSettingsJson) as MouseDictionarySettings;
};
