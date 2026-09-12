#!/usr/bin/env node
/**
 * tokens/tokens.json から配布物を生成する。
 *
 *   node scripts/build-tokens.mjs
 *
 * 生成物（いずれも手編集禁止・コミット対象）:
 *   - tokens/tokens.css   :root(light) / .dark(dark) の CSS 変数
 *   - tokens/index.mjs    JS から値を参照するための実体（ESM）
 *   - tokens/index.d.ts   その型定義
 *   - tailwind/preset.js  Tailwind v3 preset（CSS 変数を参照するだけの薄いアダプタ）
 *   - tailwind/v4.css     Tailwind v4 @theme inline（同上）
 *
 * git dependency で直接インストールされる前提のため、生成物はリポジトリにコミットする
 * （インストール時にビルドが走らなくても動くようにする）。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "tokens", "tokens.json");

const GENERATED_NOTE = [
  "このファイルは tokens/tokens.json から自動生成されています。",
  "手で編集しないこと。値を変えるときは tokens/tokens.json を編集して",
  "`pnpm build`（node scripts/build-tokens.mjs）を実行し、`pnpm check` を通すこと。",
];

/** @returns {{json: any, entries: {name: string, light: string, dark: string|null, usage?: string}[]}} */
function load() {
  const json = JSON.parse(readFileSync(SOURCE, "utf8"));
  const entries = [];

  for (const [name, def] of Object.entries(json.neutral)) {
    entries.push({ name, group: "neutral", ...def });
  }
  for (const [group, tones] of Object.entries(json.semantic)) {
    for (const [tone, def] of Object.entries(tones)) {
      if (tone.startsWith("$")) continue;
      entries.push({
        name: tone === "DEFAULT" ? group : `${group}-${tone}`,
        group,
        tone,
        ...def,
      });
    }
  }
  return { json, entries };
}

function banner(commentOpen, commentClose) {
  const body = GENERATED_NOTE.map((line) => ` * ${line}`).join("\n");
  return `${commentOpen}\n${body}\n${commentClose}\n`;
}

function buildCss(entries, json) {
  const light = entries.map((t) => `  --${t.name}: ${t.light};`);
  light.push(`  --radius: ${json.radius.value};`);

  const dark = entries.filter((t) => t.dark !== null).map((t) => `  --${t.name}: ${t.dark};`);

  const missing = entries.filter((t) => t.dark === null).map((t) => t.name);

  return [
    banner("/**", " */"),
    ":root {",
    light.join("\n"),
    "}",
    "",
    "/**",
    " * ダークモード: `.dark` クラスを祖先に付けることで切り替える。",
    " * 下記のトークンは light のみ定義（ダーク値が未策定）。ダーク画面では使わないか、",
    " * プロダクト側で `.dark` に上書きを定義すること:",
    ...missing.map((name) => ` *   --${name}`),
    " */",
    ".dark {",
    dark.join("\n"),
    "}",
    "",
  ].join("\n");
}

/**
 * JS の実体（ESM）。git dependency で配布するため、消費側でのトランスパイルを前提にできない。
 * TypeScript のまま配ると Next.js が node_modules を変換しないので落ちる。値は .mjs、型は .d.ts に分ける。
 */
function buildIndexMjs(entries, json) {
  const lines = entries.map((t) => {
    const dark = t.dark === null ? "null" : JSON.stringify(t.dark);
    const usage = t.usage ? ` /* ${t.usage.replace(/\*\//g, "")} */` : "";
    return `  ${JSON.stringify(t.name)}: { light: ${JSON.stringify(t.light)}, dark: ${dark} },${usage}`;
  });

  return `${banner("/**", " */")}
export const tokens = {
${lines.join("\n")}
};

/** 角丸の基準値 */
export const radius = ${JSON.stringify(json.radius.value)};

/** ダーク値が未定義のトークン一覧 */
export const darkUnsupported = ${JSON.stringify(
    entries.filter((t) => t.dark === null).map((t) => t.name),
    null,
    2
  )};

/** \`var(--background)\` のような CSS 変数参照を返す */
export function cssVar(name) {
  return \`var(--\${name})\`;
}

/**
 * \`hsl(var(--background))\` を返す。インライン style や Tailwind の任意値ではなく、
 * canvas 描画・グラフライブラリ等クラスが使えない箇所でのみ使うこと。
 */
export function hsl(name, alpha) {
  return alpha === undefined ? \`hsl(var(--\${name}))\` : \`hsl(var(--\${name}) / \${alpha})\`;
}
`;
}

/** 型定義。値は index.mjs 側にあるので、ここは宣言のみ。 */
function buildIndexDts(entries, json) {
  const lines = entries.map((t) => {
    const dark = t.dark === null ? "null" : JSON.stringify(t.dark);
    const usage = t.usage ? ` /* ${t.usage.replace(/\*\//g, "")} */` : "";
    return `  readonly ${JSON.stringify(t.name)}: { readonly light: ${JSON.stringify(t.light)}; readonly dark: ${dark} };${usage}`;
  });

  return `${banner("/**", " */")}
/** HSL の成分文字列（例 "0 0% 100%"）。CSS では hsl() で包んで使う。 */
export type HslComponents = string;

export interface TokenValue {
  /** ライトテーマの値 */
  readonly light: HslComponents;
  /** ダークテーマの値。null はダーク未対応（プロダクト側で定義する） */
  readonly dark: HslComponents | null;
}

export declare const tokens: {
${lines.join("\n")}
};

/** CSS 変数名（先頭の -- を除いたもの）。例: "background" / "success-text" */
export type TokenName = keyof typeof tokens;

/** 角丸の基準値 */
export declare const radius: ${JSON.stringify(json.radius.value)};

/** ダーク値が未定義のトークン一覧 */
export declare const darkUnsupported: readonly TokenName[];

/** \`var(--background)\` のような CSS 変数参照を返す */
export declare function cssVar(name: TokenName): string;

/**
 * \`hsl(var(--background))\` を返す。インライン style や Tailwind の任意値ではなく、
 * canvas 描画・グラフライブラリ等クラスが使えない箇所でのみ使うこと。
 */
export declare function hsl(name: TokenName, alpha?: number): string;
`;
}

/** Tailwind の colors オブジェクト（v3 preset 用）を組み立てる */
function buildTailwindColors(json) {
  const colors = {};
  const ref = (name) => `hsl(var(--${name}) / <alpha-value>)`;

  const neutralNames = Object.keys(json.neutral);
  for (const name of neutralNames) {
    if (name.endsWith("-foreground")) {
      const base = name.slice(0, -"-foreground".length);
      if (neutralNames.includes(base)) continue; // base 側でまとめて出力する
    }
    if (neutralNames.includes(`${name}-foreground`)) {
      colors[name] = { DEFAULT: ref(name), foreground: ref(`${name}-foreground`) };
    } else {
      colors[name] = ref(name);
    }
  }

  for (const [group, tones] of Object.entries(json.semantic)) {
    const obj = {};
    const fallbackTone = tones.$default;
    for (const tone of Object.keys(tones)) {
      if (tone.startsWith("$")) continue;
      const varName = tone === "DEFAULT" ? group : `${group}-${tone}`;
      // $default で指定したトーンは DEFAULT に畳む（例: text-success = --success-text）
      obj[tone === fallbackTone ? "DEFAULT" : tone] = ref(varName);
    }
    colors[group] = obj;
  }
  return colors;
}

function serialize(value, indent) {
  const pad = "  ".repeat(indent);
  if (typeof value === "string") return JSON.stringify(value);
  const body = Object.entries(value)
    .map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${serialize(v, indent + 1)},`)
    .join("\n");
  return `{\n${body}\n${pad}}`;
}

function buildPreset(json) {
  const colors = buildTailwindColors(json);
  return `${banner("/**", " */")}
/**
 * Tailwind CSS v3 用 preset。
 * 色の実体は tokens/tokens.css の CSS 変数なので、このファイルは参照するだけの薄いアダプタ。
 * 消費側の tailwind.config.{js,ts} で presets に追加し、content は各プロジェクトで指定すること。
 *
 *   presets: [require("@tech-plate/design-system/preset")]
 */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: ${serialize(colors, 3)},
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
`;
}

function buildV4Css(json) {
  const colors = buildTailwindColors(json);
  const lines = [];
  for (const [name, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      lines.push(`  --color-${name}: hsl(var(--${name}));`);
      continue;
    }
    for (const [tone, _v] of Object.entries(value)) {
      const varName =
        tone === "DEFAULT"
          ? defaultVarName(json, name)
          : name in json.semantic
            ? `${name}-${tone}`
            : `${name}-${tone}`;
      lines.push(`  --color-${tone === "DEFAULT" ? name : `${name}-${tone}`}: hsl(var(--${varName}));`);
    }
  }

  return `${banner("/**", " */")}
/**
 * Tailwind CSS v4 用。消費側の CSS で以下のように読み込む（tokens.css の import はこの中で完結する）:
 *
 *   @import "tailwindcss";
 *   @import "@tech-plate/design-system/tailwind-v4.css";
 */
@import "../tokens/tokens.css";

/* tokens.css は .dark クラスで切り替える方式のため、v4 の dark: バリアントもクラス基準にする */
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
${lines.join("\n")}
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
`;
}

/** グループの DEFAULT がどの CSS 変数を指すか */
function defaultVarName(json, group) {
  const tones = json.semantic[group];
  if (!tones) return group; // neutral（背景/前景ペア）は変数名＝グループ名
  const fallback = tones.$default;
  return !fallback || fallback === "DEFAULT" ? group : `${group}-${fallback}`;
}

function main() {
  const { json, entries } = load();
  const outputs = [
    [join(ROOT, "tokens", "tokens.css"), buildCss(entries, json)],
    [join(ROOT, "tokens", "index.mjs"), buildIndexMjs(entries, json)],
    [join(ROOT, "tokens", "index.d.ts"), buildIndexDts(entries, json)],
    [join(ROOT, "tailwind", "preset.js"), buildPreset(json)],
    [join(ROOT, "tailwind", "v4.css"), buildV4Css(json)],
  ];
  for (const [path, content] of outputs) {
    writeFileSync(path, content, "utf8");
    console.log(`generated ${path.replace(`${ROOT}/`, "")}`);
  }
  console.log(`\n${entries.length} tokens (${entries.filter((t) => t.dark === null).length} without dark value)`);
}

main();
