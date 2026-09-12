# スペーシング

思想は [typography.md](./typography.md) と同じ。
**独自のスペーシングスケールを定義しない。** Tailwind 標準（4px グリッド）の値を「用途」にマップして使う。

## 1. 使う値は 4 段に絞る

Tailwind には `p-0` 〜 `p-96` まで多数の値があるが、**実際に使うのは次の 4 段だけ**にする。

| 段 | クラス | px | 用途 |
|----|--------|-----|------|
| XS | `gap-1` / `p-1` / `space-y-1` | 4px | 密着させたい要素（ラベルと補足、アイコンと短い数字） |
| S | `gap-2` / `p-2` / `space-y-2` | 8px | インライン要素の間（アイコンとラベル、ボタン群、ラベルと入力欄） |
| M | `gap-4` / `p-4` / `space-y-4` | 16px | ブロックの間（フォームのフィールド間、カード内の要素間） |
| L | `gap-6` / `p-6` / `space-y-6` | 24px | 大きな区切り（セクション間、Card の内側 padding、ページ外周） |

**迷ったら M（`gap-4` / 16px）に寄せる。** インライン要素（同じ行に並ぶもの）で迷ったら S（`gap-2`）。
「ここは少し広げたい」で `gap-5` や `gap-7` を持ち出さない。**4 段のどれかに丸める。**

> 3 段で足りる画面なら S / M / L の 3 段で構わない。XS は「密着」が意味を持つ場合だけ使う。

## 2. 用途別の指定

### 2-1. ページの外周 padding

```tsx
<main className="p-4 md:p-6">
```

- モバイルは M（16px）、`md` 以上で L（24px）。
- ページごとに外周を変えない。レイアウト側で 1 回だけ指定し、各ページは padding を持たない。

### 2-2. セクション間の縦 gap

```tsx
<div className="space-y-6">
  <section>...</section>
  <section>...</section>
</div>
```

- セクション（見出し＋中身のまとまり）の間は **L（24px）**。
- 個々のセクションに `mt-*` / `mb-*` を付けない。**親で `space-y-*` を 1 回指定する。**
  マージンを子に持たせると、並べ替えたときに間隔が崩れる。

### 2-3. Card の内側 padding

```tsx
<div className="rounded-lg border border-border bg-card p-6">
```

- Card / パネルの内側は **L（24px）**。ヘッダ・ボディ・フッタで分かれている場合も同じ値を使う。
- 情報密度が高い小さなカード（統計タイル等）に限り M（`p-4`）を許容する。
- Card 内の要素間は M（`space-y-4`）。

### 2-4. フォームのフィールド間

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm">名称</label>
    <input />
    <p className="text-xs text-muted-foreground">補足説明</p>
  </div>
  ...
</form>
```

| 関係 | 段 |
|------|-----|
| フィールド同士の間 | M（`space-y-4`） |
| ラベル ↔ 入力欄、入力欄 ↔ 補足/エラー文 | S（`space-y-2`） |
| フォーム全体 ↔ 送信ボタン列 | L（`mt-6` または親の `space-y-6`） |

ラベルと入力欄が S、フィールド同士が M であることで「どのラベルがどの入力欄のものか」が視覚的に決まる。
**この 2 つを同じ値にしない。**

### 2-5. インライン要素（アイコンとラベル、ボタン群）

```tsx
<button className="inline-flex items-center gap-2">
  <Icon className="size-4" />
  保存
</button>

<div className="flex items-center gap-2">
  <Button variant="outline">キャンセル</Button>
  <Button>保存</Button>
</div>
```

- アイコン＋ラベル、ボタン群、バッジの並びは **S（`gap-2`）**。
- アイコン＋1〜2 文字の数値のように「1 つの塊」に見せたいときだけ XS（`gap-1`）。
- 横並びに `ml-*` / `mr-*` を使わない。**`flex` + `gap-*`** で表現する（要素の増減に強い）。

### 2-6. テーブルセルの padding

```tsx
<th className="px-4 py-2 text-sm">見出し</th>
<td className="px-4 py-2">値</td>
```

- 横 M（16px）／縦 S（8px）を既定にする。
- 行数が多く一覧性を優先する表は縦を XS（`py-1`）まで詰めてよいが、**1 つの表の中では必ず揃える。**
- セルごとに padding を変えない。列の幅は padding ではなく `w-*` / `min-w-*` で調整する。

## 3. やらないこと

- ❌ `p-[13px]` `gap-[10px]` `mt-[18px]` などの任意値 → §1 の 4 段に丸める
- ❌ `style={{ padding: 12 }}` のような px 直書き
- ❌ 独自のスペーシングトークンを Tailwind config に足す（`spacing: { xs: ... }`）
- ❌ 子要素に `mt-*` / `mb-*` を配って間隔を作る → 親で `space-y-*` / `gap-*`
- ❌ negative margin（`-mt-2` 等）でレイアウトのズレを補正する → 元の余白の付け方を直す
- ❌ 同じ画面内で「セクション間 24px」と「セクション間 20px」が混在する

### 例外

高密度グリッド（タイムライン、カレンダー、座席図など、px 寸法で絶対配置するもの）では、
グリッドの寸法計算にあわせた任意値を許容する。通常の一覧・フォーム・詳細画面では適用しない。

## 4. 角丸（参考）

角丸は `--radius`（既定 `0.5rem`）に集約されており、Tailwind クラスから引く。

| クラス | 値 |
|--------|-----|
| `rounded-lg` | `var(--radius)` |
| `rounded-md` | `calc(var(--radius) - 2px)` |
| `rounded-sm` | `calc(var(--radius) - 4px)` |

Card・ダイアログは `rounded-lg`、ボタン・入力欄は `rounded-md`、バッジはピル型（`rounded-full`）。
`rounded-[7px]` のような任意値は使わない。
