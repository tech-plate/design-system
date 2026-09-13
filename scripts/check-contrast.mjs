#!/usr/bin/env node
/**
 * デザイントークンが WCAG 2.1 AA のコントラスト比要件を満たすか検証する。
 *
 * 色を追加・変更したら必ず実行すること。値は tokens/tokens.json を読んで計算するので、
 * この検証表に色をハードコードしない（値の二重管理を避けるため）。
 *
 *   node scripts/check-contrast.mjs            # 全ペア検証（AA 未達があれば exit 1）
 *   node scripts/check-contrast.mjs <fg> <bg>  # 任意2色の比を表示（#hex または "H S% L%"）
 *
 * AA = 通常テキスト 4.5:1 / 大文字(>=18.66px または 14px bold) 3:1。
 * 検証するペア:
 *   - 各 *-text          vs background
 *   - 各 *-surface-foreground vs 対応する *-surface
 *   - foreground / muted-foreground vs background
 *   - muted-foreground vs muted
 *   - primary-foreground vs primary、destructive-foreground vs destructive
 * light / dark の両テーマを検証し、dark 値が null のトークンはスキップする。
 *
 * 上記に加えて、各 *-surface vs background を INFO 行として表示する（PASS/FAIL の
 * 対象外・集計に含めない）。surface は非テキスト（面）で 4.5:1 の対象ではないため、
 * 白との色差が目視で区別できる程度かを追うための参考値。
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AA_NORMAL = 4.5;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = JSON.parse(readFileSync(join(ROOT, "tokens", "tokens.json"), "utf8"));

/** "H S% L%" → {r,g,b} (0-255) */
function hslToRgb(components) {
  const [hRaw, sRaw, lRaw] = components.trim().split(/\s+/);
  const h = Number.parseFloat(hRaw);
  const s = Number.parseFloat(sRaw) / 100;
  const l = Number.parseFloat(lRaw) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];
  return [r1, g1, b1].map((v) => Math.round((v + m) * 255));
}

function hexToRgb(hex) {
  const m = hex.replace("#", "").trim();
  const full = m.length === 3 ? m.split("").map((x) => x + x).join("") : m;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
}

function toRgb(value) {
  return value.trim().startsWith("#") ? hexToRgb(value) : hslToRgb(value);
}

function toHex(rgb) {
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const l1 = relativeLuminance(toRgb(a));
  const l2 = relativeLuminance(toRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** CSS 変数名 → トークン定義 */
function flatten() {
  const map = new Map();
  for (const [name, def] of Object.entries(json.neutral)) map.set(name, def);
  for (const [group, tones] of Object.entries(json.semantic)) {
    for (const [tone, def] of Object.entries(tones)) {
      if (tone.startsWith("$")) continue;
      map.set(tone === "DEFAULT" ? group : `${group}-${tone}`, def);
    }
  }
  return map;
}

const TOKENS = flatten();

/** 検証ペアを tokens.json から組み立てる */
function buildPairs() {
  const pairs = [];
  const add = (fg, bg) => pairs.push({ fg, bg });

  for (const name of TOKENS.keys()) {
    if (name.endsWith("-text")) add(name, "background");
    if (name.endsWith("-surface-foreground")) {
      add(name, name.replace(/-foreground$/, ""));
    }
  }
  add("foreground", "background");
  add("muted-foreground", "background");
  add("muted-foreground", "muted");
  add("primary-foreground", "primary");
  add("destructive-foreground", "destructive");
  return pairs;
}

/**
 * 情報表示専用（FAIL にしない）: 各 *-surface が background と区別できる程度の
 * 色差を持っているかを目視で追うための行。surface は非テキスト（面）なので
 * 4.5:1 の AA 対象外。閾値も設けず、比の推移を確認する用途に限る。
 */
function buildSurfaceInfoPairs() {
  const pairs = [];
  for (const name of TOKENS.keys()) {
    if (name.endsWith("-surface")) pairs.push({ fg: name, bg: "background" });
  }
  return pairs;
}

function run() {
  const rows = [];
  let failed = 0;
  let skipped = 0;

  for (const theme of ["light", "dark"]) {
    for (const { fg, bg } of buildPairs()) {
      const fgValue = TOKENS.get(fg)?.[theme];
      const bgValue = TOKENS.get(bg)?.[theme];
      if (!fgValue || !bgValue) {
        skipped++;
        continue;
      }
      const ratio = contrastRatio(fgValue, bgValue);
      const ok = ratio >= AA_NORMAL;
      if (!ok) failed++;
      rows.push({
        theme,
        pair: `${fg} on ${bg}`,
        colors: `${toHex(toRgb(fgValue))} / ${toHex(toRgb(bgValue))}`,
        ratio: ratio.toFixed(2),
        result: ok ? "PASS" : "FAIL",
      });
    }
  }

  // INFO 行: *-surface vs background。非テキストなので PASS/FAIL の対象外・集計にも含めない。
  for (const theme of ["light", "dark"]) {
    for (const { fg, bg } of buildSurfaceInfoPairs()) {
      const fgValue = TOKENS.get(fg)?.[theme];
      const bgValue = TOKENS.get(bg)?.[theme];
      if (!fgValue || !bgValue) continue;
      const ratio = contrastRatio(fgValue, bgValue);
      rows.push({
        theme,
        pair: `${fg} on ${bg}`,
        colors: `${toHex(toRgb(fgValue))} / ${toHex(toRgb(bgValue))}`,
        ratio: ratio.toFixed(2),
        result: "INFO",
      });
    }
  }

  const width = (key, head) =>
    Math.max(head.length, ...rows.map((r) => String(r[key]).length));
  const cols = [
    ["result", "RESULT"],
    ["theme", "THEME"],
    ["pair", "PAIR"],
    ["colors", "COLORS"],
    ["ratio", "RATIO"],
  ];
  const line = (cells) =>
    cells.map((cell, i) => String(cell).padEnd(width(cols[i][0], cols[i][1]))).join("  ");

  console.log(line(cols.map(([, head]) => head)));
  console.log(cols.map(([key, head]) => "-".repeat(width(key, head))).join("  "));
  for (const r of rows) console.log(line(cols.map(([key]) => r[key])));

  const graded = rows.filter((r) => r.result !== "INFO").length;
  console.log(
    `\n${graded - failed}/${graded} passed (AA >= ${AA_NORMAL}), ${skipped} skipped (dark 値が未定義), ${rows.length - graded} INFO (非テキストの surface、AA 対象外)`
  );

  if (failed > 0) {
    console.error(`\n${failed} pair(s) below WCAG AA. tokens/tokens.json の値を見直すこと。`);
    process.exit(1);
  }
}

const [, , a, b] = process.argv;
if (a && b) {
  const ratio = contrastRatio(a, b);
  console.log(`${a} / ${b} = ${ratio.toFixed(2)} (AA normal ${ratio >= AA_NORMAL ? "PASS" : "FAIL"})`);
} else {
  run();
}
