# @tech-plate/design-system

全社横断のデザインシステム。**デザイントークン（CSS 変数）とデザインルール（docs）だけ**を配布する。
ルールのうち機械で止められる生カラー禁止だけは、lint（`design-system-lint`）も同梱する。

## このリポジトリの位置づけ

- ここに入るのは **全社共通の最低限**。各プロダクトは、このトークンとルールの上に自分たちの
  ブランド・ドメイン固有の定義を**上乗せ**して使う。
- **正（single source of truth）は CSS 変数**（`tokens/tokens.css`）。
  消費側の Tailwind バージョンが v3 / v4 で分かれているため、`tailwind.config.ts` を共有物にせず、
  CSS 変数を正として **v3 preset と v4 `@theme inline` はそこを参照するだけの薄いアダプタ**にしている。
- **React コンポーネントは原則配布しない（shadcn registry も配布しない）。** 実装は各プロダクトが持ち、
  ここでは [docs/components.md](./docs/components.md) に「ルール」だけを置く。
  例外は、振る舞いが複雑でプロダクトごとに作るとずれやすい部品だけで、`@tech-plate/design-system/react` から配る
  （今は `Combobox` と `ScrollableTableContainer`。下の「React の部品」）。

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/design.md](./docs/design.md) | **入口**。方針（無駄な要素を置かない）、読む順番、各 docs の索引、to B / to C で分かれるルール、新しいサービスを始める手順 |
| [docs/color.md](./docs/color.md) | トークンカタログ（アイコン用グレー・favorite・LINE 公式色を含む）、3トーン体系、生カラー禁止、product layer の拡張方法 |
| [docs/typography.md](./docs/typography.md) | フォント、Tailwind 標準スケールと行間の用途マップ、サイズの下限、段落間と行長、mono の使いどころ |
| [docs/spacing.md](./docs/spacing.md) | 4px グリッド 5 段（4〜32px）の用途マップ |
| [docs/layout.md](./docs/layout.md) | ブレークポイント、テーブルのスマホ表示（カード表示）、最大幅、ページの地色、z-index、タッチターゲット、暗幕、横スクロール |
| [docs/components.md](./docs/components.md) | 部品ごとの仕様（variant・サイズ・状態）とルール、フォーカス表示、影、アイコン、レビューチェックリスト |
| [docs/navigation.md](./docs/navigation.md) | メニューをオブジェクトで組む原則、権限とスコープの扱い、階層の深さ、to B のヘッダー（パンくず・ヘルプと AI チャットの入口・ユーザーメニュー）、スマホ向けナビ |
| [docs/manual.md](./docs/manual.md) | 業務アプリのマニュアル（画面の中で読める使い方の手引き）の置き場・構成（トップ + 1 画面 1 ページ）・ページの形・画像・レイアウト・権限・検証 |
| [docs/writing.md](./docs/writing.md) | ラベル・説明文・エラー・ボタンの書き方、文体と句点の統一 |
| [docs/forms.md](./docs/forms.md) | 1項目の構造、必須の示し方、エラー表示、検証タイミング、送信、入力部品の選択（候補が多い選択の Combobox） |
| [docs/a11y.md](./docs/a11y.md) | アクセシビリティの目標水準（JIS X 8341-3 AA 相当・WCAG 2.2 AA）、各 docs の a11y ルールの索引、横断ルール、確認方法 |

## インストール

npm レジストリ（public）から入れる。**`^0.x` で範囲を指定し、上げるときは差分（トークン値・docs）を読んでから上げる。**

```bash
pnpm add @tech-plate/design-system@^0.11.0
```

0.x の間は、`^0.11.0` は 0.11.x だけを受け入れる（0.12.0 には自動で上がらない）。
トークンの値や docs のルールが変わるのはマイナー（0.11 → 0.12）なので、上げるときに消費側で見た目とコントラストを確かめる。

生成物（`tokens/tokens.css` `tokens/index.mjs` `tokens/index.d.ts` `tailwind/preset.js` `tailwind/v4.css`、React の部品の `react/dist`）は
**パッケージに同梱済み**なので、インストール時にビルドは走らない。ランタイム依存はゼロ（React の部品を使うときだけ、peerDependencies の `react` / `react-dom` 19 以上が要る）。
認証も要らない（public パッケージなので、Docker・Vercel・GitHub Actions でも追加の設定なしで入る）。

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

## React の部品（`@tech-plate/design-system/react`）

docs の規定どおりに作った部品を配る。今あるのは `Combobox`（[docs/forms.md](./docs/forms.md) §8-3）と `ScrollableTableContainer`（[docs/layout.md](./docs/layout.md) §7-1）。

```tsx
import { Combobox } from "@tech-plate/design-system/react";

<Field label="担当者" required error={errors.assigneeId}>
  <Combobox
    id="assigneeId"               // Field の <label htmlFor> と合わせる
    label="担当者"                 // <label> と同じ文字。一覧の名前とスマホのシートのタイトル
    value={assigneeId}            // 未選択は null
    onValueChange={setAssigneeId} // 候補を選んだ・× で解除した（null）ときだけ呼ばれる
    options={staff}               // { value, label, reading?, disabled? }[]
    noun="担当者"                  // 「「〇〇」に一致する担当者がありません」
    required                      // 必須なら × の解除ボタンを出さない
    aria-invalid={!!errors.assigneeId}
    aria-describedby={errors.assigneeId ? "assigneeId-error" : undefined}
  />
</Field>
```

各 props の意味（サーバで検索する `onSearch`、その場で作る `onCreate` など）は型定義の JSDoc に書いてある。ここには部品をまたぐ約束だけを置く。

- **Tailwind は v4 だけ。** `tailwind-v4.css` を読み込んでいれば、部品が使うクラスは消費側の Tailwind が生成する（`tailwind-v4.css` の中の `@source "../react/dist"`）。`@source` を足す必要はない。
- **React 19 以上。** `react` / `react-dom` は peerDependencies（トークンだけ使うプロダクトに入れさせないよう optional）。ランタイム依存は無く（アイコンも SVG を中に持つ）、素の ESM と型定義で配るので `transpilePackages` も要らない。
- 部品のファイルに `"use client"` が付いているので、Server Component からそのまま import できる。
- **`md` 未満では全画面のシートで開く**（docs/forms.md §8-3 のスマホ）。画面側で出し分けない。
- **サーバで検索するときも、選ばれている候補は `options` に入れて渡す。** 入力欄に名前を出すため（選んだ直後は部品が覚えているが、画面を開き直したときに要る）。
- **サーバ側の検索は `@tech-plate/design-system/match` で同じそろえ方にする。** React を読み込まない入口なので、Hono などのサーバや Server Component からも使える。

```ts
import { matchesOption, normalizeQuery, normalizeForMatch } from "@tech-plate/design-system/match";

const found = staff.filter((s) => matchesOption(s, query)); // 部分一致。名前と読みの両方に当てる
// DB で検索するなら、保存する側の列を normalizeForMatch で、入力を normalizeQuery でそろえて比べる
```

### モーダルの中で使う

一覧（`md` 以上）とシート（`md` 未満）は既定で `document.body` に portal で出す。
フォーカスを閉じ込めるモーダル（Radix の Dialog など）は箱の外を「外側」とみなし、そこへの押す・打つ・スクロールを止めるので、
モーダルの中では `ComboboxPortalContainer` で出す先をモーダルの箱にする。

```tsx
import { Combobox, ComboboxPortalContainer } from "@tech-plate/design-system/react";

const [box, setBox] = useState<HTMLDivElement | null>(null);

<DialogContent ref={setBox}>
  <ComboboxPortalContainer container={box}>
    {/* この中の Combobox はすべて box の中に出る。null の間は document.body */}
  </ComboboxPortalContainer>
</DialogContent>
```

- **渡す要素とその祖先に CSS の `transform` を付けない。** 一覧は `position: fixed` で入力欄の下に置くので、transform のある祖先があるとそこが基準になり、位置がずれる（`translate-x-[-50%]` などで中央に寄せる箱がこれに当たる。flex / grid で中央に寄せる）。
- **Esc:** 一覧が開いているときの Esc は部品が `stopPropagation` して外へ伝えない（一覧だけを閉じる）。ただし document に capture で Esc を受けるモーダル（Radix の DismissableLayer など）には部品より先に届くので、モーダル側で `event.target` が `[role=combobox][aria-expanded=true]` のときは閉じないようにする（Radix なら `onEscapeKeyDown` で `event.preventDefault()`）。


### 幅の広い表の枠（`ScrollableTableContainer`）

[docs/layout.md](./docs/layout.md) §7-1 の枠。横は枠の中だけでスクロールし、縦は画面ごとスクロールする。見出し行は画面の上端の帯の下に貼り付き、
はみ出しているときだけ、画面下端の代わりの横スクロールバー・隠れている側の端の影・「Shift＋マウスホイールで横に移動」の案内（× で閉じたらそのブラウザでは以後出さない）を出す。

```tsx
import { ScrollableTableContainer } from "@tech-plate/design-system/react";

<div className="rounded-lg border border-border bg-card">  {/* 外周の罫線・地色・角丸は入れ物が持つ */}
  <ScrollableTableContainer label="経費の一覧">         {/* はみ出しているときの領域の名前（必須） */}
    <table className="w-full border-collapse">…</table>  {/* <thead> を持つ表 */}
  </ScrollableTableContainer>
</div>
```

- **外周の罫線・地色・角丸は付けない。** 入れ物（Card など）が持ち、枠は入れ物の角丸を受け継いで中身を切り抜く（`rounded-[inherit]`）。枠そのものに付けたいときは `className` で足す。
- **見出し行を止める位置は CSS 変数 `--app-header-height`**（上端に貼り付く帯の高さ。無ければ画面の上端）。レイアウトで `:root { --app-header-height: 4rem; }` のように 1 か所に書き、ページごとに渡さない。
- **見出しのセルに上の罫線を付けない**（部品が `border-t-0` にする。外周の線は入れ物が引く）。先頭の列は `sticky left-0` で固定できる（左の影は固定列の右から出る）。
- **枠の祖先に `overflow-hidden` / `overflow-x-auto` を置かない。** 下端の代わりのバー（`sticky bottom-0`）が画面に貼り付かなくなる。
- 案内を閉じたことは `localStorage` のキー `X_SCROLL_HINT_DISMISSED_KEY`（export している）に覚える。指で操作する端末（`pointer: coarse`）では案内を出さない。
- ホイールの線の動き（`animate-wheel-scroll`）の keyframes は `tailwind-v4.css` に入っている。プロダクト側の CSS は要らない。

## JS / TS からトークン値を参照する

クラス名が使えない箇所（canvas 描画、グラフライブラリ等）でのみ使う。

```ts
import { tokens, hsl, radius, darkUnsupported } from "@tech-plate/design-system";

hsl("interactive-solid");      // → "hsl(var(--interactive-solid))"
hsl("interactive-solid", 0.5); // → "hsl(var(--interactive-solid) / 0.5)"
tokens["success-text"].light;  // → "142 71.8% 29.2%"
```

実体は素の ESM（`tokens/index.mjs`）＋型定義（`tokens/index.d.ts`）。
消費側のトランスパイルを前提にしないため、TypeScript のままでは配らない。
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
4. 生成物を含めてコミットし、`package.json` の `version` を上げて npm に publish する（タグ `vX.Y.Z` も切る）。
   publish の前に `prepublishOnly` が `build`・`build:react`・`lint`・`test` を回す

### React の部品を変更する手順

1. `npm install`（開発用の依存を入れる。React の部品の開発にだけ使う）
2. テストを先に書く（`react/src/*.test.tsx`、vitest + jsdom + Testing Library）。`npm test` で回す
3. `react/src` を直す。クラスはトークンの語彙だけ（`npm run lint` が生カラーを止める）
4. `npm run build:react` で `react/dist`（ESM と型定義）を作り、`react/src` と一緒にコミットする（tokens の生成物と同じ扱い）

### ⚠️ 手編集禁止

次のファイルは `tokens/tokens.json` からの**生成物**。直接編集しないこと（次回ビルドで消える）。

- `tokens/tokens.css`
- `tokens/index.mjs`
- `tokens/index.d.ts`
- `tailwind/preset.js`
- `tailwind/v4.css`

`react/dist` も `react/src` からの生成物（`npm run build:react`）なので、直接編集しない。

### コントラスト検証の対象

`pnpm check` は light / dark 両テーマで次のペアを検証する（dark 値が無いトークンはスキップ）。

- 各 `*-text` vs `background`
- 各 `X-foreground` vs 対応する `X`（`X` が存在するもの。`*-surface-foreground` vs `*-surface`、`primary` / `secondary` / `muted` / `accent` / `card` / `popover` / `destructive` を含む）と、`X-hover` があれば `X-foreground` vs `X-hover`
- `foreground` / `muted-foreground` vs `background`
- `primary-foreground` vs 各 `*-solid`（白グリフを載せる前提のため。dark でもグリフは白なので light 値で測る）
- 各 `*-solid` vs `background`（dark のみ。非テキストの 3:1。ドット等が暗い地から見分けられるか）
- `icon` / `icon-strong` / `input` vs `background`（非テキストの 3:1）

`icon-subtle` / `icon-fill`（装飾専用）と `line-foreground` vs `line`（LINE のブランド規定）は検証から除外し、
出力に除外理由を出す。`border`（白地 1.26）は区切り線なので検証対象に入れていない。

任意の 2 色を調べることもできる。

```bash
node scripts/check-contrast.mjs "#ffffff" "142 71.8% 29.2%"
```

## 生カラーの lint（`design-system-lint`）

[docs/color.md](./docs/color.md) §3・§7 の「生カラー禁止」を機械で止める CLI を同梱している。依存ゼロの Node スクリプト（Node 18 以上）。

```bash
npx design-system-lint src            # ディレクトリでもファイルでもよい。複数指定できる
npx design-system-lint src packages/ui/src
```

消費側の `package.json` に足して CI で回す。

```jsonc
"scripts": {
  "lint:colors": "design-system-lint src"
}
```

| 終了コード | 意味 |
|-----------|------|
| 0 | 違反なし |
| 1 | 違反あり（`ファイル:行:列  [ルール] 内容` を標準エラーに出す） |
| 2 | 使い方・設定ファイルの誤り |

**検出するもの**

| ルール | 例 |
|--------|-----|
| `palette` | `bg-gray-50` `text-indigo-600` `border-red-300/50` `dark:hover:text-slate-400` `!bg-zinc-950` `bg-white` `text-black/70`、v4 のパレット変数 `var(--color-gray-500)` |
| `hex` | `#fff` `#1f2937` `bg-[#0070f3]`。数字だけのものは issue 番号と区別するため、`#000` のような同じ数字の 3 桁と 6・8 桁だけを拾う |
| `color-func` | `rgb(0 0 0)` `rgba(0,0,0,.5)` `hsl(220 13% 91%)` `oklch(0.7 …)` のような値の直書き。`hsl(var(--brand))` のようなトークンの参照と、このパッケージの `hsl("success-text")` は対象外 |

コメントの中と `data:` URI の中は見ない。既定の対象拡張子は `.js` `.jsx` `.mjs` `.cjs` `.ts` `.tsx` `.mts` `.cts` `.css` `.scss` `.vue` `.svelte` `.astro`。
`node_modules` `.next` `dist` `build` `out` `coverage` `__tests__`、`*.test.*` `*.spec.*` `*.d.ts` は既定で除外する。

**例外の書き方**（理由は必須。理由の無い指定はそれ自体を違反として出す）

| 範囲 | 書き方 |
|------|--------|
| その行 | 行末に `// design-system-lint-ignore-line: <理由>`（JSX なら `{/* … */}`、CSS なら `/* … */`） |
| 次の行 | 直前の行に `design-system-lint-ignore-next-line: <理由>` |
| ファイル全体 | 先頭 5 行以内に `design-system-lint-ignore-file: <理由>`。color.md §7 の例外（PDF テンプレート、グローバルエラー画面など）に使う |

まとめて外すときは、カレントディレクトリに `design-system-lint.config.json` を置く（`--config <file>` で別の場所も指定できる）。

```jsonc
{
  "ignore": ["src/components/pdf/**", "src/app/global-error.tsx"], // 設定ファイルからの相対の glob
  "allow": ["text-white"],                                         // 許すクラス（variant と不透明度を外した形で照合）
  "extensions": [".ts", ".tsx", ".css"],                           // 既定の拡張子を置き換える
  "rules": { "color-func": false }                                 // ルールを止める（既定はすべて有効）
}
```

既存の違反が多いプロダクトは、まず `ignore` に今ある違反のファイルを並べて新規だけを止め、直したものから外していく。

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
- `success-text` / `-surface` / `-surface-foreground` / `-solid`（0.8.0 から）
- `warning-text` / `-surface` / `-surface-foreground` / `-solid`（0.8.0 から）
- `info-text` / `-surface` / `-surface-foreground` / `-solid`（0.8.0 から）

success / warning / info の dark 値は、各トーンの light 値と**同じ色相・彩度のまま明度だけ**変えて作り、
`pnpm check` で AA を確かめている（導き方は `tokens.json` の `$meta.rules` と各グループの `$dark`、比は `contrastDark`）。

**次のトークンには dark 値が無い**（`tokens.json` で `dark: null`、`tokens.css` の `.dark` に出力されない）。

- `icon` / `icon-subtle` / `icon-strong` / `icon-fill`
- `interactive-text` / `-surface` / `-surface-foreground` / `-solid` / `-visited`
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
