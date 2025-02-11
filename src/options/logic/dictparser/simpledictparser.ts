/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */

import type { DictEntry, DictParser } from "./dictparser";

export class SimpleDictParser implements DictParser {
  #delimiter: string;
  constructor(delimiter: string) {
    this.#delimiter = delimiter;
  }

  addLine(line: string): DictEntry | undefined {
    let hd: DictEntry | undefined;
    const didx = line.indexOf(this.#delimiter);
    if (didx >= 0) {
      const head = line.substring(0, didx);
      const desc = line.substring(didx + this.#delimiter.length);
      if (head && desc) {
        hd = { head, desc };
      }
    }
    return hd;
  }

  flush(): Record<string, string> | undefined {
    return undefined;
  }
}
