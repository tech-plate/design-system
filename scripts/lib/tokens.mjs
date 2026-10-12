/**
 * tokens/tokens.json の読み込みと走査（build-tokens.mjs / check-contrast.mjs で共有）。
 *
 * 色トークンを CSS 変数名でフラットに並べる規則はここにだけ持つ。
 * 新しい色のセクションを足すときは COLOR_SECTIONS を直す。
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "tokens", "tokens.json");

/**
 * 色のセクション（この順に CSS 変数を並べる）。
 * semantic はグループ→トーンの 2 階層、それ以外（neutral / external）は名前→定義がフラットに並ぶ。
 */
const COLOR_SECTIONS = ["neutral", "semantic", "external"];

/** オブジェクトのエントリから $ で始まるキー（$usage / $default などのメタ情報）を除いたもの */
export function ownEntries(obj) {
  return Object.entries(obj).filter(([key]) => !key.startsWith("$"));
}

/**
 * tokens.json を読み、色トークンを CSS 変数名の一覧にする。
 * semantic はトーンが DEFAULT ならグループ名、それ以外は `${group}-${tone}` を名前にする。
 * フラットなセクションのトークンは group がセクション名で、tone を持たない。
 *
 * @returns {{json: any, entries: {name: string, group: string, tone?: string, light: string, dark: string|null, usage?: string}[]}}
 */
export function loadTokens() {
  const json = JSON.parse(readFileSync(SOURCE, "utf8"));
  const entries = [];
  for (const section of COLOR_SECTIONS) {
    if (section !== "semantic") {
      for (const [name, def] of ownEntries(json[section])) entries.push({ name, group: section, ...def });
      continue;
    }
    for (const [group, tones] of Object.entries(json.semantic)) {
      for (const [tone, def] of ownEntries(tones)) {
        entries.push({ name: tone === "DEFAULT" ? group : `${group}-${tone}`, group, tone, ...def });
      }
    }
  }
  return { json, entries };
}
