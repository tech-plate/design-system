#!/usr/bin/env node
/**
 * デザイントークンが WCAG 2.2 AA のコントラスト比要件を満たすか検証する。
 *
 * 色を追加・変更したら必ず実行すること。値は tokens/tokens.json を読んで計算するので、
 * この検証表に色をハードコードしない（値の二重管理を避けるため）。
 *
 *   node scripts/check-contrast.mjs            # 全ペア検証（AA 未達があれば exit 1）
 *   node scripts/check-contrast.mjs <fg> <bg>  # 任意2色の比を表示（#hex または "H S% L%"）
 *
 * AA = 通常テキスト 4.5:1 / 大文字(>=18.66px または 14px bold) 3:1 / 非テキスト(1.4.11) 3:1。
 * 検証するペア（4.5:1）:
 *   - 各 *-text / *-visited vs background
 *   - 各 X-foreground vs X（X が存在するもの。*-surface-foreground vs *-surface を含む）、
 *     X-hover が存在すれば X-foreground vs X-hover も（line-foreground は exempt により除外。下記）
 *   - 各 *-solid vs 白グリフ（primary-foreground の light 値 98%。light のみ）
 *   - foreground / muted-foreground vs background
 * 検証するペア（非テキスト 3:1）:
 *   - nonText: true のトークン vs background（アイコン・入力欄の枠）
 * light / dark の両テーマを検証し、dark 値が null のトークンはスキップする。
 *
 * 除外（EXEMPT 行。PASS/FAIL の集計に含めない）は黙ってスキップせず、理由を出力する:
 *   - decorative: true のトークン（装飾専用。非テキスト 3:1 の対象外）
 *   - exempt に理由を持つ前景トークン（外部サービスのブランド規定による色など）
 * border は区切り線（装飾）なので 3:1 の対象に入れない。
 *
 * 上記に加えて、各 *-surface vs background を INFO 行として表示する（PASS/FAIL の
 * 対象外・集計に含めない）。surface は非テキスト（面）で 4.5:1 の対象ではないため、
 * 白との色差が目視で区別できる程度かを追うための参考値。
 */

import { loadTokens } from "./lib/tokens.mjs";

const AA_NORMAL = 4.5;
const NON_TEXT = 3;

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
const TOKENS = new Map(loadTokens().entries.map((t) => [t.name, t]));

/** 検証ペアを tokens.json から組み立てる */
function buildPairs() {
  const pairs = [];
  const add = (fg, bg, opts = {}) => pairs.push({ fg, bg, min: AA_NORMAL, ...opts });

  for (const [name, def] of TOKENS) {
    if (name.endsWith("-text") || name.endsWith("-visited")) add(name, "background");
    // X-foreground は X（と X-hover）に載せる文字色。名前を直書きせず、対応する面があれば必ず検証する
    // （外部ブランド色を足したときの書き忘れで黙って漏れないようにする）
    if (name.endsWith("-foreground")) {
      const base = name.slice(0, -"-foreground".length);
      for (const bg of [base, `${base}-hover`]) if (TOKENS.has(bg)) add(name, bg);
    }
    // solid は白グリフを載せる前提。core の白グリフ（primary-foreground の light 値 98%）で測る。
    // dark の primary-foreground は暗色なので light のみ
    if (name.endsWith("-solid")) add("primary-foreground", name, { themes: ["light"] });
    if (def.nonText) add(name, "background", { min: NON_TEXT });
  }
  add("foreground", "background");
  add("muted-foreground", "background");
  return pairs;
}

/** 除外理由（null なら検証対象）。decorative / exempt はどちらも前景トークンにだけ書く */
function exemptReason(fg) {
  const fgDef = TOKENS.get(fg);
  if (fgDef?.decorative) return `装飾専用（${fg} は decorative。非テキスト 3:1 の対象外）`;
  return fgDef?.exempt ?? null;
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
  let skipped = 0;

  for (const theme of ["light", "dark"]) {
    for (const { fg, bg, min, themes } of buildPairs()) {
      if (themes && !themes.includes(theme)) continue;
      const fgValue = TOKENS.get(fg)?.[theme];
      const bgValue = TOKENS.get(bg)?.[theme];
      if (!fgValue || !bgValue) {
        skipped++;
        continue;
      }
      const ratio = contrastRatio(fgValue, bgValue);
      const reason = exemptReason(fg);
      rows.push({
        theme,
        pair: `${fg} on ${bg}`,
        colors: `${toHex(toRgb(fgValue))} / ${toHex(toRgb(bgValue))}`,
        ratio: ratio.toFixed(2),
        result: reason ? "EXEMPT" : ratio >= min ? "PASS" : "FAIL",
        note: reason ? `除外: ${reason}` : min === NON_TEXT ? `非テキスト ${NON_TEXT}:1` : "",
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
        note: "",
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
    ["note", "NOTE"],
  ];
  const line = (cells) =>
    cells.map((cell, i) => String(cell).padEnd(width(cols[i][0], cols[i][1]))).join("  ").trimEnd();

  console.log(line(cols.map(([, head]) => head)));
  console.log(cols.map(([key, head]) => "-".repeat(width(key, head))).join("  "));
  for (const r of rows) console.log(line(cols.map(([key]) => r[key])));

  const count = (result) => rows.filter((r) => r.result === result).length;
  const failed = count("FAIL");
  const graded = count("PASS") + failed;
  console.log(
    `\n${count("PASS")}/${graded} passed (テキスト AA >= ${AA_NORMAL} / 非テキスト >= ${NON_TEXT}), ${skipped} skipped (dark 値が未定義), ${count("EXEMPT")} EXEMPT (除外。理由は NOTE), ${count("INFO")} INFO (非テキストの surface、AA 対象外)`
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
