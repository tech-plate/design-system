# カラー

色の唯一の参照元は `tokens/tokens.json`（実体は `tokens/tokens.css` の CSS 変数）。
Tailwind のクラス名は v3 preset / v4 `@theme inline` が CSS 変数を参照して生成する。
**新しい色を発明せず、まずこのカタログから選ぶこと。**

## 1. トークンカタログ

### 1-1. ニュートラル（面と文字の基本）

| トークン | 意図・使いどころ | 主なクラス |
|---------|----------------|-----------|
| `background` / `foreground` | ページ地色 / 既定の文字色 | `bg-background` `text-foreground` |
| `card` / `card-foreground` | カード・パネルの面と文字 | `bg-card` `text-card-foreground` |
| `popover` / `popover-foreground` | ポップオーバー・ドロップダウンの面 | `bg-popover` `text-popover-foreground` |
| `primary` / `primary-foreground` | 主要アクション（既定のボタン） | `bg-primary` `text-primary-foreground` |
| `secondary` / `secondary-foreground` | 副次アクション・控えめな強調 | `bg-secondary` `text-secondary-foreground` |
| `muted` / `muted-foreground` | 薄い面 / 補助テキスト・ラベル | `bg-muted` `text-muted-foreground` |
| `accent` / `accent-foreground` | ホバー面・選択中の項目背景 | `bg-accent` `text-accent-foreground` |
| `border` | 境界線・区切り | `border-border` |
| `input` | フォーム入力の枠線 | `border-input` |
| `ring` | フォーカスリング | `ring-ring` |
| `overlay` | モーダル・ドロワーの暗幕（黒。light / dark 共通） | `bg-overlay/50`（**必ず不透明度付きで使う**） |

> **`primary` は neutral（ほぼ黒）**。「青 = 主要」という思い込みで `bg-blue-*` を足さないこと。
> 主要アクションは既定の Button（= `primary`）に任せる。

**アイコン用グレー（4 階調）**。アイコンの色は文字色と分けて、次の 4 つから選ぶ（使い分けは §3）。

| トークン | 用途 | 主なクラス | 白地コントラスト |
|---------|------|-----------|----------------|
| `icon-subtle` | 空状態の大きな装飾アイコン。**装飾専用** | `text-icon-subtle` | 2.52（3:1 未達。検証対象外） |
| `icon` | 通常のアイコン（タブバーの非選択、ソート・フィルタ等の平時） | `text-icon` | 4.74 |
| `icon-strong` | 選択中・強調・hover のアイコンの線 | `text-icon-strong` | 7.81 |
| `icon-fill` | 選択中アイコンの塗り。**装飾専用**（形は `icon-strong` の線で伝える） | `fill-icon-fill` | 1.48（検証対象外） |

`icon` / `icon-strong` は非テキストのコントラスト 3:1（WCAG 1.4.11）を `pnpm check` で検証している。
`icon-subtle` / `icon-fill` は `tokens.json` で `decorative: true` とし、検証から除外している。
操作や状態を伝えるアイコンに装飾専用の 2 つを使わないこと。

### 1-2. 拡張セマンティック（7語彙 × トーン）

blue / green / yellow を複数の意味に流用すると（リンクも情報バッジも青、など）役割が衝突する。
これを避けるため、意味ごとに語彙を定義する。

| トークン | 意味 | 用途の例 |
|---------|------|---------|
| `interactive` | リンク・クリック可能テキスト（読み物の訪問済みリンクは `interactive-visited`） | 一覧内のリンク、切り替えテキスト |
| `success` | 正常・確定・完了の**信号** | 完了通知、正常ステータスの強調 |
| `warning` | 注意・要確認 | 警告メッセージ、未確定の強調 |
| `info` | 情報・区分ラベル | 情報バナー、区分タグ |
| `inactive` | 非アクティブ・期限切れ | 無効行、無効バッジ |
| `favorite` | お気に入り・興味あり | ハートアイコン、「興味あり」バッジ |
| `destructive` | 破壊的操作・エラー | 削除ボタン、エラー文言 |

`favorite` はピンク（hue 333）。`destructive`（赤、hue 0）と色相で見分けるためで、**互いに代用しない**（§4）。

### 1-3. 3トーン体系（text / surface / solid）

同じ語彙でも用途によって必要なコントラストが違う。そのため各語彙を3トーンに分ける。
**すべて WCAG 2.1 AA（通常テキスト 4.5:1）以上を実測済み**（`pnpm check`）。

| トーン | 用途 | 使い方 |
|--------|------|--------|
| **text** | `background` の上に載せる前景色 | リンク文字・ステータス文言・補足の強調 |
| **surface** | 薄い面（バッジ・アラート帯） | **必ず `*-surface-foreground` とセットで使う** |
| **solid** | アイコン塗り・ステータスドット・小さなインジケータ | 白いグリフを載せる小面積オブジェクト |

| 語彙 | text | surface / surface-foreground | solid | DEFAULT クラス |
|------|------|------------------------------|-------|---------------|
| `interactive` | ✅ (6.64) | ✅ (7.15) | ✅ (5.12) | `text-interactive` = text |
| `success` | ✅ (5.02) | ✅ (6.49) | ✅ (5.02) | `text-success` = text |
| `warning` | ✅ (5.02) | ✅ (6.32) | ✅ (5.02) | `text-warning` = text |
| `info` | ✅ (7.18) | ✅ (9.56) | ✅ (7.18) | `text-info` = text |
| `inactive` | — | ✅ (light 6.10 / dark 5.78) | — | なし |
| `favorite` | ✅ (5.19) | ✅ (5.14) | ✅ (5.19) | `text-favorite` = text |
| `destructive` | ✅ (6.47) | ✅ (6.80) | `bg-destructive` (4.63) | `bg-destructive` = ベタ塗り面 |

括弧内は実測コントラスト比。値は `tokens/tokens.json` の `contrast` フィールドが正。
solid の比は純白のグリフを載せた値。`pnpm check` は白グリフを `primary-foreground`（98%）で測るため少し低く出る
（例: `favorite-solid` は 4.97）。いずれも 4.5:1 以上。

`interactive` だけは 4 つ目のトーンとして **`visited`**（`text-interactive-visited`、紫 hue 272、6.98）を持つ。
読み物の中の訪問済みリンク専用（§4「リンクの状態」）。

- `inactive` は **surface トーンのみ**。非アクション・非情報の状態表現に限るため text / solid は定義しない。
- `destructive` だけは `DEFAULT`（`bg-destructive` + `text-destructive-foreground`）が
  従来からのベタ塗り面として存在する。他の語彙にベタ塗りボタン用の色は無い（次項）。

### 1-4. ♿ WCAG 上の重要な制約

- 鮮やか系（`-500` / `-600` 相当）は**白い文字・グリフを載せると AA に届かない**（緑+白 = 3.30 等）。
  そのため **solid トーンは `-700` 相当まで暗くして 4.5:1 を確保**している。
- `*-foreground` を機械的に白固定しないこと。
- surface（薄面）には**必ず暗い前景**（`*-surface-foreground`）を組み合わせる。

### 1-5. 外部サービスの公式ブランド色（LINE）

プロダクト固有の色は core に入れない（§6）が、**外部サービスの公式ブランド色だけは例外**として core に置く。
どのプロダクトでも同じ値で使い、値を変えてはいけない色だから。`tokens.json` の `external` グループにある。

| トークン | 値 | 主なクラス |
|---------|-----|-----------|
| `line` | LINE 公式緑（`150 94.3% 40.4%`）。light / dark 共通 | `bg-line` |
| `line-hover` | hover 時の面（`150 94.4% 35.5%`） | `hover:bg-line-hover` |
| `line-foreground` | `line` 面の上の文字（白） | `text-line-foreground` |

- **使ってよいのは LINE ログイン・友だち追加の導線だけ。** 汎用の緑や成功の表現に使わない（成功は `success`）。
- 上の文字は `text-line-foreground` を使う。`text-white` を直書きしない。
- `line-foreground` on `line` は 2.22（hover 時 2.85）で **AA 未達**。LINE のブランド規定による色の組み合わせなので
  例外として認め、`tokens.json` の `exempt` に理由を書いて検証から除外している（`pnpm check` に「除外: 理由」が出る）。
  この例外を他の色の前例にしない。

## 2. solid はベタ塗りボタンではない

主要アクションのベタ塗りは `primary`（既定の Button）を使う。
**「緑の成功ボタン」「青の情報ボタン」のような色つきベタ塗りボタンは作らない。**
solid はアイコン・ドット・インジケータ等の小面積オブジェクト専用。

同じ理由で、**`primary`（黒）を非アクションの強調に使わない**。
「今日」バッジ・特別扱いの行ハイライトのような強調は `*-surface`（意味で語彙を選ぶ）で表現する。
黒塗りはアクション（ボタン）専用。

## 3. 生カラー禁止と置換表

`text-gray-700` のような Tailwind の生カラーパレットは使わない。

| 用途 | ❌ 生カラー | ✅ トークン |
|------|-----------|------------|
| 本文 | `text-black` `text-gray-900` | `text-foreground` |
| 補助テキスト・ラベル | `text-gray-500` `text-gray-600` | `text-muted-foreground` |
| 境界線 | `border-gray-200` `border-gray-300` | `border-border` / `border-input` |
| 背景（薄いグレー面） | `bg-gray-50` `bg-gray-100` | `bg-muted` |
| カード面 | `bg-white` | `bg-card` + `text-card-foreground` |
| 主要アクション | `bg-blue-600 text-white` | `bg-primary text-primary-foreground` |
| リンク | `text-blue-600` | `text-interactive` |
| アイコン | `text-gray-400` `text-gray-500` `text-foreground/70` | `text-icon` / `text-icon-strong` / `text-icon-subtle` |
| モーダルの暗幕 | `bg-black/50` | `bg-overlay/50` |
| お気に入り・興味あり | `text-pink-600` `text-red-500` | `text-favorite` |
| 破壊的・エラー | `text-red-600` `bg-red-500` | `text-destructive-text` / `bg-destructive text-destructive-foreground` |
| フォーカスリング | `ring-blue-500` | `ring-ring` |

### グレーは少数のトークンに集約する

実プロジェクトで最も多い生カラーはグレー系で、その大半はテーブルの本文/補助/罫線/面。
次の振り分けでほぼ吸収できる。

- テキストは **2 種**で足りる: 本文 → `foreground`、補助テキスト・プレースホルダ → `muted-foreground`。
  **迷う中間グレーは `muted-foreground` に寄せる。**
- 罫線・外枠 → `border-border`。地色 → `bg-background`、薄い面・ゼブラ → `bg-muted`。
- **アイコンは文字色ではなくアイコン用トークン（§1-1）で塗る。** 通常は `text-icon`、
  hover・focus・選択中は `text-icon-strong`（押せる場合は `bg-accent` も足す）、空状態などの装飾は `text-icon-subtle`。
  色を増やさず明度＋状態変化で操作可能を示す。
- アイコンに `text-foreground/70` のような**半透明を使わない** — SVG の線が重なる所だけ濃く見えるので、ベタ色のトークンで持っている。
- **disabled** は専用グレートークンを作らず、地色に `opacity`（≒50%）で表現する。

### クラス名は文字列で完全に書く

Tailwind は**ソースを静的に走査して、見つけたクラス名だけ**ユーティリティを生成する。
クラス名をテンプレートリテラルや文字列連結で組み立てると走査に引っかからず、
**エラーも警告も出ないまま無色で描画される**（v3 / v4 とも同じ挙動）。

```tsx
// NG: bg-warning-surface というクラスがソース上に存在しないので生成されない。
//     背景が透明のまま、エラーも出ずに描画される
<span className={`bg-${status}-surface text-${status}-surface-foreground`} />

// OK: 完全なクラス名を定数から引く（§5 の状態色マップと同じ考え方）
const STATUS_BADGE_CLASS = {
  provisional: "bg-warning-surface text-warning-surface-foreground",
  completed: "bg-success-surface text-success-surface-foreground",
  cancelled: "bg-destructive-surface text-destructive-surface-foreground",
} as const;

<span className={STATUS_BADGE_CLASS[status]} />
```

トークンを正しく配っても、使う側がこの書き方を外すと黙って効かない。
**新しいトークンを使い始めたときは、ブラウザで実際に色が乗っていることを必ず確認する。**

## 4. `interactive` と `info` を分ける

色が似ていても役割が違うので、**押せるもの（`interactive`）と情報提示（`info`）は必ず別トークン**にする。
リンクと情報バッジが同じ青になって「押せるのか押せないのか分からない」状態を作らない。
そのため `info` は cyan 系（hue 194）にして `interactive`（hue 224）と色相そのもので分けている。

同じ理由で、**オブジェクトの塗りに `success` を使わない**。
例えばカレンダー上の「予定が入っているブロック」の塗りは *実体が存在すること* を表しているのであって、
*成功* ではない。そういう塗りはドメイン状態色（§6）で未確定／確定／取消を分けるのが正で、
`success` は「正常完了の信号」専用とする。

### `favorite` と `destructive` を代用しない

お気に入り・興味ありは `favorite`（ピンク）、エラー・破壊的操作は `destructive`（赤）。
**「赤いハートだから `destructive`」「目立つからエラーに `favorite`」のような流用をしない。**
色相を分けてあるのは、ハートとエラーが同じ画面に並んでも意味を取り違えないようにするため。

### リンクの状態

| 場面 | 下線 | visited |
|------|------|---------|
| 本文中のリンク（文章の中に埋め込まれたもの） | **常時下線**。hover で太くする（`hover:decoration-2`） | 読み物なら付ける |
| ナビゲーション・ボタン状のリンク・カード全体がリンク | 不要（形と位置で押せると分かる） | 付けない |
| アプリ画面の一覧リンク（案件一覧の行など） | 場面に応じて | **付けない** |

- 本文中のリンクは**色だけで区別しない**（色覚の差・モノクロ印刷で見分けられなくなる）。下線を常に出す。
- `visited:text-interactive-visited` は**記事・お知らせなど読み物の中だけ**に付ける。
  アプリ画面の一覧で付けると「既読」のような別の意味に読まれるので付けない。

```tsx
// 読み物の本文中のリンク
<a className="text-interactive underline hover:decoration-2 visited:text-interactive-visited" href={url}>
  詳しくはこちら
</a>
```

## 5. 状態色は constants に集約する

ステータス・ロール・増減のような **意味のある状態色** は、コンポーネント内でクラス文字列を直書きしない。
`constants/`（あるいは各プロジェクトの同等の場所）の色マップを単一の参照元にする。

```tsx
// ❌ 各所でバラバラに直書き（濃さがファイルごとにズレる）
const cls = status === "pending" ? "bg-yellow-100 text-yellow-800" : "...";

// ✅ 定数から引く
import { STATUS_BADGE_CLASS } from "@/constants/status";
<span className={STATUS_BADGE_CLASS[status]}>{label}</span>
```

- 新しい状態色が必要になったら、まず該当ドメインの `constants/*.ts` にマップを足してから参照する。
- **状態色の意味はセマンティック語彙（§1-2）に対応させる**（注意 = `warning`、正常/確定 = `success`、
  取消/エラー = `destructive`）。状態色とセマンティックを無関係な2系統にしないことが一貫性の肝。
- 型で網羅性を担保する（ステータスの union に対する `Record<Status, string>` など）。

## 6. product layer の拡張スロット

このリポジトリ（core）には**全社共通の最低限**しか入れない。
次のものは **core に定義せず、各プロダクト側で定義する**。

| 種類 | 例 | 理由 |
|------|-----|------|
| ブランドカラー | `--brand` | プロダクト／サービスごとに違う（外部サービスの公式色 LINE だけは例外で core にある。§1-5） |
| サイドバー・シェル | `--sidebar-*` | レイアウトの作りに依存する |
| チャート系列色 | `--chart-1` 〜 `--chart-5` | 使うかどうか・系列数がプロダクト依存 |
| ドメイン状態色 | 業務ステータス、ロール、曜日 等 | ドメイン語彙そのもの |

### 書き方（v3 / v4 共通: CSS 変数を足す）

プロダクト側の `globals.css` で、core の `tokens.css` を読み込んだ**後**に追加定義する。

```css
@import "@tech-plate/design-system/tokens.css";

:root {
  /* ブランド（装飾専用。白地で文字 AA を満たさない鮮やか色は文字・主要ボタンに使わない） */
  --brand: 28 90.2% 47.8%;

  /* アプリシェル */
  --sidebar-background: 240 5.9% 10%;
  --sidebar-foreground: 0 0% 100%;
  --sidebar-border: 240 5.3% 26.1%;

  /* チャート系列 */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
}

.dark {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
}
```

### Tailwind への露出（v3）

```js
// tailwind.config.js
module.exports = {
  presets: [require("@tech-plate/design-system/preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: "hsl(var(--brand) / <alpha-value>)",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
        },
      },
    },
  },
};
```

### Tailwind への露出（v4）

```css
@import "tailwindcss";
@import "@tech-plate/design-system/tailwind-v4.css";

@theme inline {
  --color-brand: hsl(var(--brand));
  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-chart-1: hsl(var(--chart-1));
}
```

**プロダクト側で色を足したら、そのプロダクトでもコントラストを検証すること**（§8）。

### ブランド色を主要ボタンに使う

主要ボタンをブランド色にしたいときは、新しいクラスを作らず **`--primary` / `--primary-foreground` / `--ring` を
プロダクト側で上書き**する。既定の Button（`bg-primary text-primary-foreground`）がそのまま追従する。

```css
:root {
  --primary: 28 90.2% 36%;           /* --brand を白文字で 4.5:1 を満たす濃さまで下げた色（5.05） */
  --primary-foreground: 0 0% 100%;
  --ring: 28 90.2% 36%;
}
```

- 上書きしたら **`primary-foreground` on `primary` が 4.5:1 以上あるかをそのプロダクトで確認する**
  （design-system リポジトリで `node scripts/check-contrast.mjs "<fg>" "<bg>"` を実行すると任意 2 色の比が出る）。
- `--brand` は装飾専用（ロゴ周り・イラスト・アクセントの線）で、文字 AA を満たさない鮮やかな色でもよい。
  主要ボタンに載るのは AA を満たすよう調整した `--primary` のほうで、`bg-brand` のボタンは作らない。

## 7. 16進カラー・インライン style は原則禁止

`style={{ color: "#666" }}` や `#0070f3` のクラス外直書きは使わない。トークンか Tailwind クラスで表現する。

**許容される例外:**

- **PDF 等の Tailwind が効かないレンダラ** — 16進指定が必要。色値はテンプレート内で定数化し、
  マジックナンバーを散らさない。
- **CSS レイヤーが読み込まれない可能性のあるトップレベルのフォールバック画面**
  （グローバルエラー / 404 など）— インライン style を許容。
- **非本番環境であることを示す診断表示** — 製品 UI ではないため装飾を許容。
- **canvas / グラフライブラリ等、クラス名を受け取らない API** — `hsl()` ヘルパー
  （`import { hsl } from "@tech-plate/design-system"`）でトークンから取得し、16進を書かない。

## 8. 新しい色を追加・変更するときの手順

1. `tokens/tokens.json` を編集する（`tokens.css` を直接編集しない）
2. `pnpm build` で生成物を更新する
3. **`pnpm check` を通す** — AA 4.5:1 未満があれば exit 1 になる
4. 生成物を含めてコミットし、タグを切る

`pnpm check` は次のペアを light / dark 両方で検証する（dark 値が無いトークンはスキップ）。

テキスト（4.5:1）:

- 各 `*-text` / `interactive-visited` vs `background`
- 各 `X-foreground` vs 対応する `X`（`X` が存在するもの。`*-surface-foreground` vs `*-surface`、`primary` / `secondary` / `muted` / `accent` / `card` / `popover` / `destructive` を含む）。`X-hover` があれば `X-foreground` vs `X-hover` も
- 各 `*-solid` vs 白グリフ（`primary-foreground` の light 値 98%。light のみ）
- `foreground` / `muted-foreground` vs `background`

非テキスト（3:1、WCAG 1.4.11）:

- `nonText: true` のトークン（`icon` / `icon-strong`）vs `background`

除外（`EXEMPT` 行。黙ってスキップせず「除外: 理由」を出力し、PASS/FAIL の集計に含めない）:

- `decorative: true` のトークン（`icon-subtle` / `icon-fill`）— 装飾専用
- `exempt` に理由を持つトークン（`line-foreground` vs `line` / `line-hover`）— LINE のブランド規定

参考表示（`INFO` 行。閾値なし）: 各 `*-surface` vs `background`。

`border` / `input`（白地で 1.26）は現時点で 3:1 の対象にしていない。値を変えると全プロダクトの見た目が変わるため。
入力欄の枠のように境界そのものが操作対象を示す場面では、枠線の色だけに頼らずラベル・背景の差でも示すこと。

## 9. ダークモードの対応範囲

ニュートラル（アイコン用グレーを除く。`overlay` を含む）・`inactive`・`destructive` の DEFAULT / foreground・LINE 公式色には dark 値があるが、
**アイコン用グレー 4 階調、拡張セマンティックの text / surface / solid（`interactive` `success` `warning` `info` `favorite`）、
`interactive-visited`、`destructive` の text / surface トーンには dark 値が無い**（`tokens.json` で `dark: null`）。

ダーク画面でこれらを使う場合は、プロダクト側で `.dark { --success-text: ...; }` のように上書きし、
**そのプロダクトでコントラストを実測すること**。core は勝手な値を持たない。
