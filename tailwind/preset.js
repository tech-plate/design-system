/**
 * このファイルは tokens/tokens.json から自動生成されています。
 * 手で編集しないこと。値を変えるときは tokens/tokens.json を編集して
 * `pnpm build`（node scripts/build-tokens.mjs）を実行し、`pnpm check` を通すこと。
 */

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
      colors: {
        "background": "hsl(var(--background) / <alpha-value>)",
        "foreground": "hsl(var(--foreground) / <alpha-value>)",
        "card": {
          "DEFAULT": "hsl(var(--card) / <alpha-value>)",
          "foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        },
        "popover": {
          "DEFAULT": "hsl(var(--popover) / <alpha-value>)",
          "foreground": "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        "primary": {
          "DEFAULT": "hsl(var(--primary) / <alpha-value>)",
          "foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        "secondary": {
          "DEFAULT": "hsl(var(--secondary) / <alpha-value>)",
          "foreground": "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        "muted": {
          "DEFAULT": "hsl(var(--muted) / <alpha-value>)",
          "foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        "accent": {
          "DEFAULT": "hsl(var(--accent) / <alpha-value>)",
          "foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        "border": "hsl(var(--border) / <alpha-value>)",
        "input": "hsl(var(--input) / <alpha-value>)",
        "ring": "hsl(var(--ring) / <alpha-value>)",
        "interactive": {
          "DEFAULT": "hsl(var(--interactive-text) / <alpha-value>)",
          "surface": "hsl(var(--interactive-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--interactive-surface-foreground) / <alpha-value>)",
          "solid": "hsl(var(--interactive-solid) / <alpha-value>)",
        },
        "success": {
          "DEFAULT": "hsl(var(--success-text) / <alpha-value>)",
          "surface": "hsl(var(--success-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--success-surface-foreground) / <alpha-value>)",
          "solid": "hsl(var(--success-solid) / <alpha-value>)",
        },
        "warning": {
          "DEFAULT": "hsl(var(--warning-text) / <alpha-value>)",
          "surface": "hsl(var(--warning-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--warning-surface-foreground) / <alpha-value>)",
          "solid": "hsl(var(--warning-solid) / <alpha-value>)",
        },
        "info": {
          "DEFAULT": "hsl(var(--info-text) / <alpha-value>)",
          "surface": "hsl(var(--info-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--info-surface-foreground) / <alpha-value>)",
          "solid": "hsl(var(--info-solid) / <alpha-value>)",
        },
        "inactive": {
          "surface": "hsl(var(--inactive-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--inactive-surface-foreground) / <alpha-value>)",
        },
        "destructive": {
          "DEFAULT": "hsl(var(--destructive) / <alpha-value>)",
          "foreground": "hsl(var(--destructive-foreground) / <alpha-value>)",
          "text": "hsl(var(--destructive-text) / <alpha-value>)",
          "surface": "hsl(var(--destructive-surface) / <alpha-value>)",
          "surface-foreground": "hsl(var(--destructive-surface-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
