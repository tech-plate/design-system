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
 *   - tailwind/preset.js  Tailwind v3 preset（CSS 変数を参照するだけの薄いアダプタ + typography）
 *   - tailwind/v4.css     Tailwind v4 @theme inline（同上）+ typography 用の @theme + cursor の @layer base
 *
 * 生成物はリポジトリにコミットし、npm パッケージにもそのまま同梱する
 * （インストール時にビルドが走らなくても動くようにする。prepare / prepublish に依存しない）。
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadTokens, ownEntries, ROOT } from "./lib/tokens.mjs";

const GENERATED_NOTE = [
  "このファイルは tokens/tokens.json から自動生成されています。",
  "手で編集しないこと。値を変えるときは tokens/tokens.json を編集して",
  "`pnpm build`（node scripts/build-tokens.mjs）を実行し、`pnpm check` を通すこと。",
];

/** typography の値を CSS の値文字列にする（font-sans は配列をカンマ区切りに） */
function typographyValue(def) {
  return Array.isArray(def.value) ? def.value.join(", ") : def.value;
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
 * JS の実体（ESM）。消費側でのトランスパイルを前提にしない。
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

/** 文字まわりの既定（Tailwind の font-sans / leading-* を上書きする値）。キーは CSS 変数名 */
export const typography = {
${ownEntries(json.typography)
  .map(([name, def]) => `  ${JSON.stringify(name)}: ${JSON.stringify(typographyValue(def))},`)
  .join("\n")}
};

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

/** 文字まわりの既定（Tailwind の font-sans / leading-* を上書きする値）。キーは CSS 変数名 */
export declare const typography: {
${ownEntries(json.typography)
  .map(([name, def]) => `  readonly ${JSON.stringify(name)}: ${JSON.stringify(typographyValue(def))};`)
  .join("\n")}
};

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
function buildTailwindColors(entries, json) {
  const colors = {};
  const ref = (name) => `hsl(var(--${name}) / <alpha-value>)`;

  // グループの出現順（lib/tokens.mjs の COLOR_SECTIONS 順）を保って束ねる
  const groups = new Map();
  for (const t of entries) groups.set(t.group, [...(groups.get(t.group) ?? []), t]);
  for (const [group, members] of groups) {
    if (members[0].tone === undefined) {
      // neutral / external: 名前がフラットに並ぶ。X と X-foreground があれば 1 つにまとめる
      const names = members.map((t) => t.name);
      for (const name of names) {
        if (name.endsWith("-foreground")) {
          const base = name.slice(0, -"-foreground".length);
          if (names.includes(base)) continue; // base 側でまとめて出力する
        }
        if (names.includes(`${name}-foreground`)) {
          colors[name] = { DEFAULT: ref(name), foreground: ref(`${name}-foreground`) };
        } else {
          colors[name] = ref(name);
        }
      }
      continue;
    }
    const obj = {};
    const fallbackTone = json.semantic[group].$default;
    for (const { name, tone } of members) {
      // $default で指定したトーンは DEFAULT に畳む（例: text-success = --success-text）
      obj[tone === fallbackTone ? "DEFAULT" : tone] = ref(name);
    }
    colors[group] = obj;
  }
  return colors;
}

function serialize(value, indent) {
  const pad = "  ".repeat(indent);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
  const body = Object.entries(value)
    .map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${serialize(v, indent + 1)},`)
    .join("\n");
  return `{\n${body}\n${pad}}`;
}

/** v3 preset 用: typography を theme.extend.fontFamily / lineHeight に振り分ける */
function buildTailwindTypography(json) {
  const fontFamily = {};
  const lineHeight = {};
  for (const [name, def] of ownEntries(json.typography)) {
    if (name.startsWith("font-")) fontFamily[name.slice("font-".length)] = def.value;
    else if (name.startsWith("leading-")) lineHeight[name.slice("leading-".length)] = def.value;
    else throw new Error(`typography.${name}: font-* / leading-* 以外は未対応`);
  }
  return { fontFamily, lineHeight };
}

function buildPreset(entries, json) {
  const colors = buildTailwindColors(entries, json);
  const { fontFamily, lineHeight } = buildTailwindTypography(json);
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
      fontFamily: ${serialize(fontFamily, 3)},
      lineHeight: ${serialize(lineHeight, 3)},
    },
  },
};
`;
}

function buildV4Css(entries, json) {
  const colors = buildTailwindColors(entries, json);
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

/*
 * 文字まわりの既定。値そのものを持つので inline ではない通常の @theme にする。
 * 消費側が後から書いた @theme { --font-sans: …; } が後勝ちで上書きできる。
 * フォントファイルの配信は各プロダクトの責務（core は名前だけ指定する）。
 */
@theme {
${ownEntries(json.typography)
  .map(([name, def]) => `  --${name}: ${typographyValue(def)};`)
  .join("\n")}
}

/*
 * 押せるものは pointer。v4 の preflight はボタンを cursor: default にするため、
 * Tailwind 公式の v3→v4 移行ガイドどおり戻す（v3 の preflight は元から pointer なので preset には不要）。
 * 無効なもの（disabled / aria-disabled="true"）は除き、部品側で cursor-not-allowed を付ける（docs/components.md §1-7）。
 */
@layer base {
  button:not(:disabled):not([aria-disabled="true"]),
  [role="button"]:not(:disabled):not([aria-disabled="true"]) {
    cursor: pointer;
  }
}
`;
}

/** グループの DEFAULT がどの CSS 変数を指すか */
function defaultVarName(json, group) {
  const tones = json.semantic[group];
  if (!tones) return group; // neutral / external（背景/前景ペア）は変数名＝グループ名
  const fallback = tones.$default;
  return !fallback || fallback === "DEFAULT" ? group : `${group}-${fallback}`;
}

function main() {
  const { json, entries } = loadTokens();
  const outputs = [
    [join(ROOT, "tokens", "tokens.css"), buildCss(entries, json)],
    [join(ROOT, "tokens", "index.mjs"), buildIndexMjs(entries, json)],
    [join(ROOT, "tokens", "index.d.ts"), buildIndexDts(entries, json)],
    [join(ROOT, "tailwind", "preset.js"), buildPreset(entries, json)],
    [join(ROOT, "tailwind", "v4.css"), buildV4Css(entries, json)],
  ];
  for (const [path, content] of outputs) {
    writeFileSync(path, content, "utf8");
    console.log(`generated ${path.replace(`${ROOT}/`, "")}`);
  }
  console.log(`\n${entries.length} tokens (${entries.filter((t) => t.dark === null).length} without dark value)`);
}

main();
