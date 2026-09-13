/**
 * このファイルは tokens/tokens.json から自動生成されています。
 * 手で編集しないこと。値を変えるときは tokens/tokens.json を編集して
 * `pnpm build`（node scripts/build-tokens.mjs）を実行し、`pnpm check` を通すこと。
 */

export const tokens = {
  "background": { light: "0 0% 100%", dark: "0 0% 3.9%" }, /* ページの地色 */
  "foreground": { light: "0 0% 3.9%", dark: "0 0% 98%" }, /* 既定の本文文字色 */
  "card": { light: "0 0% 100%", dark: "0 0% 3.9%" }, /* カード・パネルの面 */
  "card-foreground": { light: "0 0% 3.9%", dark: "0 0% 98%" }, /* カード面の文字色 */
  "popover": { light: "0 0% 100%", dark: "0 0% 3.9%" }, /* ポップオーバー・ドロップダウンの面 */
  "popover-foreground": { light: "0 0% 3.9%", dark: "0 0% 98%" }, /* ポップオーバー面の文字色 */
  "primary": { light: "0 0% 9%", dark: "0 0% 98%" }, /* 主要アクション（既定のボタン塗り）。neutral であり『青＝主要』ではない */
  "primary-foreground": { light: "0 0% 98%", dark: "0 0% 9%" }, /* primary 面の上の文字色 */
  "secondary": { light: "0 0% 96.1%", dark: "0 0% 14.9%" }, /* 副次アクションの面 */
  "secondary-foreground": { light: "0 0% 9%", dark: "0 0% 98%" }, /* secondary 面の上の文字色 */
  "muted": { light: "0 0% 96.1%", dark: "0 0% 14.9%" }, /* 薄い面（ゼブラ行・非強調ブロック） */
  "muted-foreground": { light: "0 0% 43%", dark: "0 0% 63.9%" }, /* 補助テキスト・ラベル・プレースホルダ */
  "accent": { light: "0 0% 96.1%", dark: "0 0% 14.9%" }, /* ホバー面・選択中項目の背景 */
  "accent-foreground": { light: "0 0% 9%", dark: "0 0% 98%" }, /* accent 面の上の文字色 */
  "border": { light: "0 0% 89.8%", dark: "0 0% 14.9%" }, /* 境界線・区切り線 */
  "input": { light: "0 0% 89.8%", dark: "0 0% 14.9%" }, /* フォーム入力の枠線 */
  "ring": { light: "0 0% 3.9%", dark: "0 0% 83.1%" }, /* フォーカスリング */
  "interactive-text": { light: "224 76.3% 48%", dark: null }, /* background に載せる前景色（リンク文字） */
  "interactive-surface": { light: "214 94.6% 92.7%", dark: null }, /* 薄い面。必ず surface-foreground とセットで使う */
  "interactive-surface-foreground": { light: "226 70.7% 40.2%", dark: null }, /* interactive-surface の上に載せる前景色 */
  "interactive-solid": { light: "221 83.2% 53.3%", dark: null }, /* アイコン塗り・ドット等の小面積オブジェクト（白グリフを載せる前提） */
  "success-text": { light: "142 71.8% 29.2%", dark: null }, /* background に載せる前景色 */
  "success-surface": { light: "141 84.5% 92.5%", dark: null }, /* 薄い面。必ず surface-foreground とセットで使う */
  "success-surface-foreground": { light: "143 64.2% 24.1%", dark: null }, /* success-surface の上に載せる前景色 */
  "success-solid": { light: "142 71.8% 29.2%", dark: null }, /* アイコン塗り・ドット等（白グリフを載せるため -700 相当まで暗くしてある） */
  "warning-text": { light: "26 90.5% 37.1%", dark: null }, /* background に載せる前景色 */
  "warning-surface": { light: "48 96.5% 88.8%", dark: null }, /* 薄い面。必ず surface-foreground とセットで使う */
  "warning-surface-foreground": { light: "23 82.5% 31.4%", dark: null }, /* warning-surface の上に載せる前景色 */
  "warning-solid": { light: "26 90.5% 37.1%", dark: null }, /* アイコン塗り・ドット等（白グリフを載せる前提） */
  "info-text": { light: "194 69.6% 27.1%", dark: null }, /* background に載せる前景色 */
  "info-surface": { light: "185 95.9% 90.4%", dark: null }, /* 薄い面。必ず surface-foreground とセットで使う */
  "info-surface-foreground": { light: "196 63.6% 20.4%", dark: null }, /* info-surface の上に載せる前景色 */
  "info-solid": { light: "194 69.6% 27.1%", dark: null }, /* アイコン塗り・ドット等の小面積オブジェクト（白グリフを載せる前提） */
  "inactive-surface": { light: "220 13% 91%", dark: "215 27.9% 16.9%" }, /* 無効行・無効バッジの面 */
  "inactive-surface-foreground": { light: "215 13.8% 34.1%", dark: "217.9 10.6% 64.9%" }, /* inactive-surface の上に載せる前景色 */
  "destructive": { light: "0 72.2% 50.6%", dark: "0 62.8% 30.6%" }, /* 破壊的アクションのベタ塗り面。destructive-foreground を載せて AA 4.63（純白なら 4.83）。旧値 0 84.2% 60.2% は 3.76 で AA 未達のため不採用 */
  "destructive-foreground": { light: "0 0% 98%", dark: "0 0% 98%" }, /* destructive 面の上の文字色 */
  "destructive-text": { light: "0 73.7% 41.8%", dark: null }, /* background に載せるエラー文言の前景色 */
  "destructive-surface": { light: "0 93.3% 94.1%", dark: null }, /* 薄い面。必ず surface-foreground とセットで使う */
  "destructive-surface-foreground": { light: "0 70% 35.3%", dark: null }, /* destructive-surface の上に載せる前景色 */
};

/** 角丸の基準値 */
export const radius = "0.5rem";

/** ダーク値が未定義のトークン一覧 */
export const darkUnsupported = [
  "interactive-text",
  "interactive-surface",
  "interactive-surface-foreground",
  "interactive-solid",
  "success-text",
  "success-surface",
  "success-surface-foreground",
  "success-solid",
  "warning-text",
  "warning-surface",
  "warning-surface-foreground",
  "warning-solid",
  "info-text",
  "info-surface",
  "info-surface-foreground",
  "info-solid",
  "destructive-text",
  "destructive-surface",
  "destructive-surface-foreground"
];

/** `var(--background)` のような CSS 変数参照を返す */
export function cssVar(name) {
  return `var(--${name})`;
}

/**
 * `hsl(var(--background))` を返す。インライン style や Tailwind の任意値ではなく、
 * canvas 描画・グラフライブラリ等クラスが使えない箇所でのみ使うこと。
 */
export function hsl(name, alpha) {
  return alpha === undefined ? `hsl(var(--${name}))` : `hsl(var(--${name}) / ${alpha})`;
}
