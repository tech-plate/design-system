/**
 * このファイルは tokens/tokens.json から自動生成されています。
 * 手で編集しないこと。値を変えるときは tokens/tokens.json を編集して
 * `pnpm build`（node scripts/build-tokens.mjs）を実行し、`pnpm check` を通すこと。
 */

/** HSL の成分文字列（例 "0 0% 100%"）。CSS では hsl() で包んで使う。 */
export type HslComponents = string;

export interface TokenValue {
  /** ライトテーマの値 */
  readonly light: HslComponents;
  /** ダークテーマの値。null はダーク未対応（プロダクト側で定義する） */
  readonly dark: HslComponents | null;
}

export declare const tokens: {
  readonly "background": { readonly light: "0 0% 100%"; readonly dark: "0 0% 3.9%" }; /* ページの地色 */
  readonly "foreground": { readonly light: "0 0% 3.9%"; readonly dark: "0 0% 98%" }; /* 既定の本文文字色 */
  readonly "card": { readonly light: "0 0% 100%"; readonly dark: "0 0% 3.9%" }; /* カード・パネルの面 */
  readonly "card-foreground": { readonly light: "0 0% 3.9%"; readonly dark: "0 0% 98%" }; /* カード面の文字色 */
  readonly "popover": { readonly light: "0 0% 100%"; readonly dark: "0 0% 3.9%" }; /* ポップオーバー・ドロップダウンの面 */
  readonly "popover-foreground": { readonly light: "0 0% 3.9%"; readonly dark: "0 0% 98%" }; /* ポップオーバー面の文字色 */
  readonly "primary": { readonly light: "0 0% 9%"; readonly dark: "0 0% 98%" }; /* 主要アクション（既定のボタン塗り）。neutral であり『青＝主要』ではない */
  readonly "primary-foreground": { readonly light: "0 0% 98%"; readonly dark: "0 0% 9%" }; /* primary 面の上の文字色 */
  readonly "secondary": { readonly light: "0 0% 96.1%"; readonly dark: "0 0% 14.9%" }; /* 副次アクションの面 */
  readonly "secondary-foreground": { readonly light: "0 0% 9%"; readonly dark: "0 0% 98%" }; /* secondary 面の上の文字色 */
  readonly "muted": { readonly light: "0 0% 96.1%"; readonly dark: "0 0% 14.9%" }; /* 薄い面（ゼブラ行・非強調ブロック） */
  readonly "muted-foreground": { readonly light: "0 0% 43%"; readonly dark: "0 0% 63.9%" }; /* 補助テキスト・ラベル・プレースホルダ */
  readonly "accent": { readonly light: "0 0% 96.1%"; readonly dark: "0 0% 14.9%" }; /* ホバー面・選択中項目の背景 */
  readonly "accent-foreground": { readonly light: "0 0% 9%"; readonly dark: "0 0% 98%" }; /* accent 面の上の文字色 */
  readonly "border": { readonly light: "0 0% 89.8%"; readonly dark: "0 0% 14.9%" }; /* 境界線・区切り線 */
  readonly "input": { readonly light: "0 0% 89.8%"; readonly dark: "0 0% 14.9%" }; /* フォーム入力の枠線 */
  readonly "ring": { readonly light: "0 0% 3.9%"; readonly dark: "0 0% 83.1%" }; /* フォーカスリング */
  readonly "overlay": { readonly light: "0 0% 0%"; readonly dark: "0 0% 0%" }; /* モーダル・ドロワーの暗幕。bg-overlay/50 のように不透明度付きで使う */
  readonly "icon-subtle": { readonly light: "0 0% 63.9%"; readonly dark: null }; /* 空状態の大きな装飾アイコン。装飾専用（3:1 未達のため操作・情報を担うアイコンに使わない） */
  readonly "icon": { readonly light: "0 0% 45.1%"; readonly dark: null }; /* 通常のアイコン（タブバーの非選択など）。半透明ではなくベタ色で持つ（SVG の線が重なる所だけ濃く見えるのを防ぐ） */
  readonly "icon-strong": { readonly light: "0 0% 32.2%"; readonly dark: null }; /* 選択中・強調のアイコンの線、hover 時のアイコン */
  readonly "icon-fill": { readonly light: "0 0% 83.1%"; readonly dark: null }; /* 選択中アイコンの塗り。装飾専用（形は icon-strong の線で伝える） */
  readonly "interactive-text": { readonly light: "224 76.3% 48%"; readonly dark: null }; /* background に載せる前景色（リンク文字） */
  readonly "interactive-surface": { readonly light: "214 94.6% 92.7%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "interactive-surface-foreground": { readonly light: "226 70.7% 40.2%"; readonly dark: null }; /* interactive-surface の上に載せる前景色 */
  readonly "interactive-solid": { readonly light: "221 83.2% 53.3%"; readonly dark: null }; /* アイコン塗り・ドット等の小面積オブジェクト（白グリフを載せる前提） */
  readonly "interactive-visited": { readonly light: "272.1 71.7% 47.1%"; readonly dark: null }; /* 記事・お知らせなど読み物の中の訪問済みリンク（visited:text-interactive-visited）。アプリ画面の一覧リンクには付けない */
  readonly "success-text": { readonly light: "142 71.8% 29.2%"; readonly dark: null }; /* background に載せる前景色 */
  readonly "success-surface": { readonly light: "141 84.5% 92.5%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "success-surface-foreground": { readonly light: "143 64.2% 24.1%"; readonly dark: null }; /* success-surface の上に載せる前景色 */
  readonly "success-solid": { readonly light: "142 71.8% 29.2%"; readonly dark: null }; /* アイコン塗り・ドット等（白グリフを載せるため -700 相当まで暗くしてある） */
  readonly "warning-text": { readonly light: "26 90.5% 37.1%"; readonly dark: null }; /* background に載せる前景色 */
  readonly "warning-surface": { readonly light: "48 96.5% 88.8%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "warning-surface-foreground": { readonly light: "23 82.5% 31.4%"; readonly dark: null }; /* warning-surface の上に載せる前景色 */
  readonly "warning-solid": { readonly light: "26 90.5% 37.1%"; readonly dark: null }; /* アイコン塗り・ドット等（白グリフを載せる前提） */
  readonly "info-text": { readonly light: "194 69.6% 27.1%"; readonly dark: null }; /* background に載せる前景色 */
  readonly "info-surface": { readonly light: "185 95.9% 90.4%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "info-surface-foreground": { readonly light: "196 63.6% 20.4%"; readonly dark: null }; /* info-surface の上に載せる前景色 */
  readonly "info-solid": { readonly light: "194 69.6% 27.1%"; readonly dark: null }; /* アイコン塗り・ドット等の小面積オブジェクト（白グリフを載せる前提） */
  readonly "inactive-surface": { readonly light: "220 13% 91%"; readonly dark: "215 27.9% 16.9%" }; /* 無効行・無効バッジの面 */
  readonly "inactive-surface-foreground": { readonly light: "215 13.8% 34.1%"; readonly dark: "217.9 10.6% 64.9%" }; /* inactive-surface の上に載せる前景色 */
  readonly "favorite-text": { readonly light: "333.3 71.4% 47%"; readonly dark: null }; /* background に載せる前景色（ハートアイコン・「興味あり」の文言） */
  readonly "favorite-surface": { readonly light: "326 77.8% 94.7%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "favorite-surface-foreground": { readonly light: "335.1 77.6% 42%"; readonly dark: null }; /* favorite-surface の上に載せる前景色 */
  readonly "favorite-solid": { readonly light: "333.3 71.4% 47%"; readonly dark: null }; /* アイコン塗り・ドット等の小面積オブジェクト（白グリフを載せる前提。98% のグリフで 4.97） */
  readonly "destructive": { readonly light: "0 72.2% 50.6%"; readonly dark: "0 62.8% 30.6%" }; /* 破壊的アクションのベタ塗り面。destructive-foreground を載せて AA 4.63（純白なら 4.83）。旧値 0 84.2% 60.2% は 3.76 で AA 未達のため不採用 */
  readonly "destructive-foreground": { readonly light: "0 0% 98%"; readonly dark: "0 0% 98%" }; /* destructive 面の上の文字色 */
  readonly "destructive-text": { readonly light: "0 73.7% 41.8%"; readonly dark: null }; /* background に載せるエラー文言の前景色 */
  readonly "destructive-surface": { readonly light: "0 93.3% 94.1%"; readonly dark: null }; /* 薄い面。必ず surface-foreground とセットで使う */
  readonly "destructive-surface-foreground": { readonly light: "0 70% 35.3%"; readonly dark: null }; /* destructive-surface の上に載せる前景色 */
  readonly "line": { readonly light: "150 94.3% 40.4%"; readonly dark: "150 94.3% 40.4%" }; /* LINE 公式ブランド色。LINE ログイン・友だち追加の導線だけに使う（汎用の緑・成功の表現に使わない） */
  readonly "line-hover": { readonly light: "150 94.4% 35.5%"; readonly dark: "150 94.4% 35.5%" }; /* LINE ボタンの hover（hover:bg-line-hover） */
  readonly "line-foreground": { readonly light: "0 0% 100%"; readonly dark: "0 0% 100%" }; /* line / line-hover 面の上の文字色（text-white を直書きしない） */
};

/** CSS 変数名（先頭の -- を除いたもの）。例: "background" / "success-text" */
export type TokenName = keyof typeof tokens;

/** 角丸の基準値 */
export declare const radius: "0.5rem";

/** 文字まわりの既定（Tailwind の font-sans / leading-* を上書きする値）。キーは CSS 変数名 */
export declare const typography: {
  readonly "font-sans": "\"Noto Sans JP\", -apple-system, BlinkMacSystemFont, \"Hiragino Sans\", \"Hiragino Kaku Gothic ProN\", \"Segoe UI\", Meiryo, Roboto, \"Helvetica Neue\", Arial, sans-serif";
  readonly "leading-relaxed": "1.7";
  readonly "leading-tight": "1.3";
};

/** ダーク値が未定義のトークン一覧 */
export declare const darkUnsupported: readonly TokenName[];

/** `var(--background)` のような CSS 変数参照を返す */
export declare function cssVar(name: TokenName): string;

/**
 * `hsl(var(--background))` を返す。インライン style や Tailwind の任意値ではなく、
 * canvas 描画・グラフライブラリ等クラスが使えない箇所でのみ使うこと。
 */
export declare function hsl(name: TokenName, alpha?: number): string;
