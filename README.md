# @tech-plate/design-system

全社横断のデザインシステム。**デザイントークン（CSS 変数）とデザインルール（docs）だけ**を配布する。

## このリポジトリの位置づけ

- ここに入るのは **全社共通の最低限**。各プロダクトは、このトークンとルールの上に自分たちの
  ブランド・ドメイン固有の定義を**上乗せ**して使う。
- **正（single source of truth）は CSS 変数**（`tokens/tokens.css`）。
  消費側の Tailwind バージョンが v3 / v4 で分かれているため、`tailwind.config.ts` を共有物にせず、
  CSS 変数を正として **v3 preset と v4 `@theme inline` はそこを参照するだけの薄いアダプタ**にしている。
- **React コンポーネントも shadcn registry も配布しない。** 実装は各プロダクトが持ち、
  ここでは [docs/components.md](./docs/components.md) に「ルール」だけを置く。

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/design.md](./docs/design.md) | **入口**。方針（無駄な要素を置かない）、読む順番、各 docs の索引、to B / to C で分かれるルール、新しいサービスを始める手順 |
| [docs/color.md](./docs/color.md) | トークンカタログ（アイコン用グレー・favorite・LINE 公式色を含む）、3トーン体系、生カラー禁止、product layer の拡張方法 |
| [docs/typography.md](./docs/typography.md) | フォント、Tailwind 標準スケールと行間の用途マップ、サイズの下限、段落間と行長、mono の使いどころ |
| [docs/spacing.md](./docs/spacing.md) | 4px グリッド 5 段（4〜32px）の用途マップ |
| [docs/layout.md](./docs/layout.md) | ブレークポイント、最大幅、ページの地色、z-index、タッチターゲット、暗幕、横スクロール |
| [docs/components.md](./docs/components.md) | 部品ごとの仕様（variant・サイズ・状態）とルール、フォーカス表示、影、アイコン、レビューチェックリスト |
| [docs/navigation.md](./docs/navigation.md) | メニューをオブジェクトで組む原則、権限とスコープの扱い、階層の深さ、to B のヘッダー（パンくず・ユーザーメニュー）、スマホ向けナビ |
| [docs/writing.md](./docs/writing.md) | ラベル・説明文・エラー・ボタンの書き方、文体と句点の統一 |
| [docs/forms.md](./docs/forms.md) | 1項目の構造、必須の示し方、エラー表示、検証タイミング、送信 |
| [docs/a11y.md](./docs/a11y.md) | アクセシビリティの目標水準（JIS X 8341-3 AA 相当・WCAG 2.2 AA）、各 docs の a11y ルールの索引、横断ルール、確認方法 |

## インストール

git dependency で直接インストールする（npm レジストリには publish しない）。
**タグを必ず指定すること。**

```bash
pnpm add github:tech-plate/design-system#v0.7.0
```

生成物（`tokens/tokens.css` `tokens/index.mjs` `tokens/index.d.ts` `tailwind/preset.js` `tailwind/v4.css`）は
**リポジトリにコミット済み**なので、インストール時にビルドは走らない（`prepare` スクリプトに依存しない）。
ランタイム依存はゼロ。

### private リポジトリのため認証が要る

このリポジトリは private なので、`git clone` できる認証情報が無い環境ではインストールが失敗する。
環境ごとに次を用意する。

**ローカル（mac）**

`gh auth login` 済み、または SSH 鍵が GitHub に登録済みなら追加設定は不要。
HTTPS で 403 になる場合は SSH 形式で指定する。

```jsonc
// package.json
"@tech-plate/design-system": "git+ssh://git@github.com/tech-plate/design-system.git#v0.7.0"
```

**Docker（ローカル開発コンテナ）**

コンテナには認証情報が無い。ホストの認証を渡すか、
`~/.gitconfig` の `url.<...>.insteadOf` でトークン付き URL に書き換える。
コンテナ内で `pnpm install` する構成なら、`GITHUB_TOKEN` を渡したうえで次を実行する。

```sh
git config --global url."https://$GITHUB_TOKEN@github.com/".insteadOf "https://github.com/"
```

**Vercel**

Vercel は「デプロイ対象のリポジトリ」しかクローン権限を持たないため、**他の private リポジトリへの
git dependency は素のままでは失敗する**。プロジェクトの環境変数に read-only の
Personal Access Token（または GitHub App のトークン）を `GITHUB_TOKEN` として登録し、
Install Command を次のように上書きする。

```sh
git config --global url."https://$GITHUB_TOKEN@github.com/".insteadOf "https://github.com/" && pnpm install
```

**GitHub Actions**

同一 org 内の別リポジトリは `secrets.GITHUB_TOKEN` では読めない。
org 用の PAT か GitHub App トークンを secret に登録して、上記と同じ `insteadOf` を設定する。

> この手当てを消費側プロジェクトごとに1回ずつ入れる必要がある。
> 運用が重くなるようなら、中身に秘密情報が無いので public 化を再検討してよい。

## 導入手順: Tailwind CSS v3

### 1. グローバル CSS でトークンを読み込む

`@tailwind` ディレクティブより**前**、ファイルの先頭で読み込む（CSS の `@import` は他のルールより前に
置く必要があるため）。

```css
/* app/globals.css */
@import "@tech-plate/design-system/tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 2. preset を適用する

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import preset from "@tech-plate/design-system/preset";

const config: Config = {
  presets: [preset],
  // content は必ず各プロジェクトで指定する（preset には含まれていない）
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // プロダクト固有の色はここに足す（docs/color.md §6）
    },
  },
  plugins: [
    // plugins も preset には含まれていない。必要なものを各プロジェクトで入れる
  ],
};
export default config;
```

preset が提供するのは `darkMode: ["class"]` / `theme.extend.colors` / `theme.extend.borderRadius` と、
フォント・行間の上書き（`font-sans` = Noto Sans JP + システムフォールバック、`leading-relaxed` = 1.7、
`leading-tight` = 1.3）のみ。
**`content` と `plugins` は含まれていない。**

## 導入手順: Tailwind CSS v4

### 1. CSS で読み込む（これだけ）

**v4 では `tokens.css` を別途 import しない。** `tailwind-v4.css` が内部で `tokens.css` を
import しているので、1 行で完結する。

```css
/* app/globals.css */
@import "tailwindcss";
@import "@tech-plate/design-system/tailwind-v4.css";

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

`tailwind-v4.css` は次を行う。

- `tokens.css`（CSS 変数の実体）の import
- `@custom-variant dark (&:where(.dark, .dark *));`
  — トークンが `.dark` クラスで切り替わる方式なので、v4 既定の `prefers-color-scheme` ベースではなく
  **クラスベースの `dark:` バリアント**に揃えている
- `@theme inline` による `--color-*` / `--radius-*` の定義
- `--font-sans`（Noto Sans JP + システムフォールバック）と `--leading-relaxed: 1.7` / `--leading-tight: 1.3` の上書き
- `button` / `[role="button"]`（無効なものを除く）を `cursor: pointer` にする `@layer base`
  （理由は [docs/components.md](./docs/components.md) §1-7。プロダクト側で同じ指定を書かない）

### 2. プロダクト固有の色を足す

```css
@import "tailwindcss";
@import "@tech-plate/design-system/tailwind-v4.css";

:root {
  --brand: 28 90.2% 47.8%;
}

@theme inline {
  --color-brand: hsl(var(--brand));
}
```

### Tailwind 既定の上書き (フォント)

フォント（`font-sans`）と行間（`leading-relaxed` / `leading-tight`）は **core が設定済み**なので、
プロダクト側で書く必要はない（値は [docs/typography.md](./docs/typography.md)）。
ブレークポイントは Tailwind 標準のまま使い、書き換えない（[docs/layout.md](./docs/layout.md)）。

欧文用フォントを Noto Sans JP の前に足したいときだけ、プロダクト側で上書きする。
Tailwind v4 は `@theme` の変数を `:root` に出すので、消費側が `:root` に同名の変数を持つと
読み込み順で勝った方が両方に効く。**`@theme { … }` で上書きし、`:root` に同名変数を書かない。**

```css
@theme {
  --font-sans: "Inter", "Noto Sans JP", system-ui, sans-serif;
}
```

フォントファイルの配信（自前配信、`next/font` 等）は各プロダクトの責務。

## JS / TS からトークン値を参照する

クラス名が使えない箇所（canvas 描画、グラフライブラリ等）でのみ使う。

```ts
import { tokens, hsl, radius, darkUnsupported } from "@tech-plate/design-system";

hsl("interactive-solid");      // → "hsl(var(--interactive-solid))"
hsl("interactive-solid", 0.5); // → "hsl(var(--interactive-solid) / 0.5)"
tokens["success-text"].light;  // → "142 71.8% 29.2%"
```

実体は素の ESM（`tokens/index.mjs`）＋型定義（`tokens/index.d.ts`）。
git dependency では消費側のトランスパイルを前提にできないため、TypeScript のままでは配らない。
`transpilePackages` の設定は不要。

## 利用できるクラス（抜粋）

```
bg-background  text-foreground  bg-card  text-card-foreground
bg-popover  text-popover-foreground
bg-primary  text-primary-foreground  bg-secondary  text-secondary-foreground
bg-muted  text-muted-foreground  bg-accent  text-accent-foreground
border-border  border-input  ring-ring
bg-overlay/50
text-icon  text-icon-subtle  text-icon-strong  fill-icon-fill

text-interactive  bg-interactive-surface  text-interactive-surface-foreground  bg-interactive-solid
text-interactive-visited
text-success      bg-success-surface      text-success-surface-foreground      bg-success-solid
text-warning      bg-warning-surface      text-warning-surface-foreground      bg-warning-solid
text-info         bg-info-surface         text-info-surface-foreground         bg-info-solid
text-favorite     bg-favorite-surface     text-favorite-surface-foreground     bg-favorite-solid
                  bg-inactive-surface     text-inactive-surface-foreground
bg-destructive  text-destructive-foreground
text-destructive-text  bg-destructive-surface  text-destructive-surface-foreground

bg-line  hover:bg-line-hover  text-line-foreground

rounded-lg  rounded-md  rounded-sm
font-sans  leading-relaxed  leading-tight
```

`text-success` 等の接尾辞なしクラスは **text トーン**（`--success-text`）を指す。
`bg-destructive` だけは例外で、破壊的アクションのベタ塗り面（`--destructive`）を指す。

## トークンを変更する手順

1. **`tokens/tokens.json` を編集する**
2. `pnpm build`（= `node scripts/build-tokens.mjs`）で生成物を更新する
3. **`pnpm check`（= `node scripts/check-contrast.mjs`）が通ることを確認する**
   — WCAG 2.2 AA（テキスト 4.5:1、非テキスト 3:1）未満のペアがあれば exit 1 になる
4. 生成物を含めてコミットし、**タグを切る**（消費側はタグを指して固定する）

### ⚠️ 手編集禁止

次のファイルは `tokens/tokens.json` からの**生成物**。直接編集しないこと（次回ビルドで消える）。

- `tokens/tokens.css`
- `tokens/index.mjs`
- `tokens/index.d.ts`
- `tailwind/preset.js`
- `tailwind/v4.css`

### コントラスト検証の対象

`pnpm check` は light / dark 両テーマで次のペアを検証する（dark 値が無いトークンはスキップ）。

- 各 `*-text` vs `background`
- 各 `X-foreground` vs 対応する `X`（`X` が存在するもの。`*-surface-foreground` vs `*-surface`、`primary` / `secondary` / `muted` / `accent` / `card` / `popover` / `destructive` を含む）と、`X-hover` があれば `X-foreground` vs `X-hover`
- `foreground` / `muted-foreground` vs `background`
- `primary-foreground` vs 各 `*-solid`（白グリフを載せる前提のため）
- `icon` / `icon-strong` / `input` vs `background`（非テキストの 3:1）

`icon-subtle` / `icon-fill`（装飾専用）と `line-foreground` vs `line`（LINE のブランド規定）は検証から除外し、
出力に除外理由を出す。`border`（白地 1.26）は区切り線なので検証対象に入れていない。

任意の 2 色を調べることもできる。

```bash
node scripts/check-contrast.mjs "#ffffff" "142 71.8% 29.2%"
```

## core と product layer の境界

### core に入れるもの（このリポジトリ）

- ニュートラルのセマンティックトークン
  （`background` `foreground` `card` `popover` `primary` `secondary` `muted` `accent`
  `border` `input` `ring` とその `-foreground`）
- 拡張セマンティック 5 語彙 × トーン
  （`interactive` / `success` / `warning` / `info` は `-text` `-surface` `-surface-foreground` `-solid`、
  `inactive` は `-surface` `-surface-foreground` のみ）
- `destructive` 一式（`--destructive` `--destructive-foreground` `--destructive-text`
  `--destructive-surface` `--destructive-surface-foreground`）
- `--radius`
- 共通 UI の専用色（暗幕 `overlay`、アイコン用グレー `icon-subtle` / `icon` / `icon-strong` / `icon-fill`、
  `favorite` 一式、`interactive-visited`、LINE 公式色 `line` / `line-hover` / `line-foreground`）
- Tailwind 既定のうち日本語に合わせる上書き（`font-sans` / `leading-relaxed` / `leading-tight`）

### core に入れないもの（プロダクト側で定義する）

| 種類 | 例 |
|------|-----|
| ブランドカラー | `--brand` |
| アプリシェル | `--sidebar-*` |
| チャート系列色 | `--chart-1` 〜 `--chart-5` |
| ドメイン状態色 | 業務ステータス、ロール、曜日 等 |

書き方は [docs/color.md §6](./docs/color.md#6-product-layer-の拡張スロット) を参照。

## ダークモードの対応範囲

**ダークは部分対応。** 次のトークンには dark 値がある。

- ニュートラル一式（`background` 〜 `ring`）と `overlay`
- `line` / `line-hover` / `line-foreground`（公式色のため light と同じ値）
- `inactive-surface` / `inactive-surface-foreground`
- `destructive` / `destructive-foreground`

**次のトークンには dark 値が無い**（`tokens.json` で `dark: null`、`tokens.css` の `.dark` に出力されない）。

- `icon` / `icon-subtle` / `icon-strong` / `icon-fill`
- `interactive-text` / `-surface` / `-surface-foreground` / `-solid` / `-visited`
- `success-text` / `-surface` / `-surface-foreground` / `-solid`
- `warning-text` / `-surface` / `-surface-foreground` / `-solid`
- `info-text` / `-surface` / `-surface-foreground` / `-solid`
- `favorite-text` / `-surface` / `-surface-foreground` / `-solid`
- `destructive-text` / `destructive-surface` / `destructive-surface-foreground`

これらを `.dark` 配下で使うと **light の値がそのまま適用され、コントラストが破綻する**。
ダーク画面でこれらが必要なプロダクトは、自分の `.dark { ... }` で上書きし、
**そのプロダクトでコントラストを実測すること**。core は根拠のない値を持たない方針のため、
実測済みの値が用意できるまで dark は `null` のままにしている。

## 公開リポジトリとしての注意

一度公開した履歴は clone・ミラーに残り、後から消せない。次のものはコード・コミット・PR 本文・issue のどこにも書かない。

- **個人のメールアドレス**: コミットの作者欄・`Co-Authored-By` も含む。作者欄は GitHub の代用アドレス `<ID>+<ユーザー名>@users.noreply.github.com`(Settings → Emails に出る)にする。clone ごとの設定は漏れるので、グローバルの `~/.gitconfig` で当てる(`[includeIf "gitdir:~/tech/techplate/"]` で noreply を設定したファイルを読み込む)。同じ Emails の画面で「Keep my email addresses private」と「Block command line pushes that expose my email」もオンにする
- **顧客名・顧客のロゴやブランド素材**: プロダクト固有の素材は各プロダクト側に置く(上の「core に入れないもの」と同じ)
- **秘密情報**: トークン・パスワード・鍵

CI `public-safety`(`.github/workflows/public-safety.yml`)が、作者欄・タグ・コミットメッセージ・ファイル・PR 本文のメールアドレス(`scripts/check-public-safety.sh`、手元でも `bash scripts/check-public-safety.sh` で実行可)と、全履歴の秘密情報(gitleaks)を検査する。
CI は push・PR を作った**後**に走るので、検出した時点で内容はすでに公開されている。止める役は上の個人設定と GitHub の Push protection が担い、CI は取りこぼしに気づくための網。issue と PR のコメントは検査しない。
2026-10-19、public 化の前に作者欄の個人アドレスを消すため履歴を書き換え、リポジトリを作り直した(旧リポジトリは private の `tech-plate/design-system-archive`。PR #1〜#3 の議論はそちら)。

## ライセンス

MIT
