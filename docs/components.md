# コンポーネントのルール

このリポジトリは **React コンポーネントを配布しない**。実装は各プロダクトが自前で持つ。
ここに書くのは、どのプロダクトでも守る **ルール**と、**部品ごとの仕様**（variant・サイズ・状態ごとの見た目）。
仕様があれば、誰が実装しても同じ見た目になる。

- 実装コードは載せない（実装の重複は避け、判断基準と値だけを共有する）。クラス名は表で示す。
- 部品の仕様は to B / to C 共通で 1 本。分かれるルールは [design.md](./design.md) にまとめている。
- 骨格の値（ブレークポイント・z-index・タッチターゲット・暗幕）は [layout.md](./layout.md) が正。
  ここでは値を繰り返さず「layout.md のモーダルの層」のように参照する。
- 色は [color.md](./color.md)、文字は [typography.md](./typography.md)、余白は [spacing.md](./spacing.md)、
  フォームの 1 項目の構造は [forms.md](./forms.md)、文言は [writing.md](./writing.md) を参照。

### 仕様表の読み方

- 部品の内側の余白は仕様表が正（[spacing.md](./spacing.md) §3 の例外）。

- 「クラス」列は**完全なクラス名**で書く。状態や variant ごとに完全な文字列を持ち、
  テンプレートリテラルで組み立てない（[color.md](./color.md) の「クラス名は文字列で完全に書く」）。
- 状態で同じプロパティを切り替えるとき（`border-input` ⇄ `border-destructive` 等）は、
  **既定のクラスに足すのではなく置き換える**。同じプロパティのクラスが 2 つ乗ると、
  どちらが勝つかは記述順ではなく生成された CSS の順で決まり、黙って効かなくなる。
- 仕様表にある**部品の内側の余白**（内側 padding の `px-3`、アイコン位置合わせの `mt-0.5`、
  EmptyState・ErrorState・ダイアログ・PageHeader 内部の `mt-*` / `mb-*` 等）は、この表が正。
  [spacing.md](./spacing.md) の 5 段と「子に `mt-*` / `mb-*` を付けない」は画面を組む側のルールで、部品の内側には当てない。

---

## 1. 全部品に共通する約束

### 1-1. フォーカス表示

**キーボードで操作したときだけ出す（`focus-visible`）。マウス・タッチでは出さない。**

| 対象 | クラス |
|------|--------|
| ボタン・チップ・タブ・アイコンボタン・ボタン型のリンク | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| 入力欄（Input / Textarea / Select）・Checkbox | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` |
| エラー中の入力欄（`aria-invalid="true"` の Input / Textarea / Select） | 上の入力欄のクラス + `aria-[invalid=true]:focus-visible:ring-destructive` |
| メニューの項目・タブ列のタブ・スクロール容器（`overflow-*-auto`）の中の押せる項目 | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring` |

- リングは **2px（`ring-2`）、色は `ring-ring`**。生カラー（`ring-blue-500` 等）にしない。
- **`outline-none` だけで消さない。** ブラウザ既定の outline を消すときは、必ず上のリングを代わりに付ける。
  消しただけの要素は、キーボード利用者から現在位置が見えなくなる。
- ボタン類は **`ring-offset-2`** で塗りとリングの間に 2px の隙間を空ける。
  塗り（`bg-primary` 等）とリングが同じ暗さで接すると、リングがボタンの縁と一体化してフォーカスの有無が判別できない。
- **箱・スクロール容器の中の項目は `ring-inset`** で、リングを項目の内側に描く。外側に出すと、`overflow-x-auto` の列では
  上下が容器の端で切れ（横だけ指定しても縦も切り取られる）、メニューの箱では枠や隣の項目と重なる。
- 入力欄は offset を付けない。枠線のすぐ外にリングが乗る方が、どの欄に入力しているかが分かりやすい。
- **エラー中の入力欄はリングも `ring-destructive` にする。** 枠だけ赤くてリングが通常色だと、フォーカスした途端に
  エラーの手がかりが弱まる。`aria-[invalid=true]:` は属性セレクタの分だけ詳細度が高く、`ring-ring` と併記しても必ず勝つ
  （Tailwind v3.2+ / v4）。このため「置き換える」の例外とする。
- **フォーカスインジケーターは、隣接する色に対して 3:1 以上**にする（DADS の基準）。
  `ring-ring` は `bg-background` / `bg-card` / `bg-muted` のいずれの上でも 3:1 を満たす。
  これ以外の暗い面の上に部品を置く場合は、その面で 3:1 を実測する。

### 1-2. タッチターゲット

押せる領域の最小値と例外は [layout.md](./layout.md) が正。部品側の作法だけここに書く。

- **見た目を小さくしたまま押せる領域だけ広げたい**ときは、`relative` + `before:absolute` の疑似要素で
  当たり判定を上下に広げる（FilterChip・Checkbox がこの方式）。負のマージンで周りの余白を削らない。
- アイコンだけのボタンは、押せる領域（`size-11`）と中のアイコンの大きさ（§1-4）を分けて指定する。

### 1-3. 影（エレベーション）

**影は「実際に他の要素の上に浮いているもの」だけに付ける。** 浮いていないものに影を付けない。

| 段 | クラス | 対象 |
|----|--------|------|
| なし | — | Card・パネル・Button・入力部品・Badge・Tabs・固定／追従するヘッダーとタブバー |
| 1. メニュー・ポップオーバー | `shadow-md` | ドロップダウンメニュー、ポップオーバー、入力候補のリスト、ツールチップ |
| 2. モーダル・ダイアログ | `shadow-lg` | Modal、確認ダイアログ、トースト（§9） |

- 段は 2 つだけ。`shadow-sm` / `shadow-xl` / `shadow-2xl` / 任意値（`shadow-[...]`）は使わない。
  段が増えると、どれがどれより手前にあるのかが読み取れなくなる。
- **境界は影ではなく枠線で示す。** 影は背景とのコントラストを確保できない（DADS の基準）。
  メニュー・ポップオーバーは `border border-border` を付け、影は補助として重ねる。
  モーダルは暗幕（[layout.md](./layout.md)）で背景から切り離されるので枠線は不要。
- 固定・追従するヘッダーとタブバーも影を付けず、`border-b` / `border-t` で本文と区切る。
- UI ライブラリが既定で付ける `shadow*` は除去する。
  例外は Switch のツマミのように、立体表現そのものが意味を持つもの。

### 1-4. アイコン

#### サイズ

**16 / 20 / 24px の 3 段だけ使う。** 並べる文字の大きさと置き場所で決める。

| サイズ | クラス | 使う場面 |
|--------|--------|---------|
| 16px | `size-4` | `text-xs` / `text-sm` の文字と並べるアイコン（メタ情報の日付、戻るリンクの矢印、Alert・トーストのアイコン、Badge の中、`text-sm` のリンク末尾の矢印）、外部リンクのアイコン |
| 20px | `size-5` | `text-base` の文字と並べるアイコン（リスト行の先頭、行末の矢印、`md` の Button の中）、ボトムタブバー |
| 24px | `size-6` | ヘッダーのアイコンボタン（戻る・閉じる・右端の操作） |

- **例外は空状態・エラー状態の大きなアイコンだけ**で、32px（`size-8`）を使う（§8）。
- 12 / 14 / 18 / 22 / 28px のような中間の値を作らない。
- 形は**1 つのアイコンセットからだけ選ぶ**。似た形を別のライブラリから混ぜると、線の太さや角の丸みが
  少しずつ食い違う。
- 線のアイコンを基本にし、選択中は**同じ形の内側を塗った版**で示す（形を別のアイコンに差し替えない）。

#### 色

- 文字と並べるアイコンは**文字色をそのまま継承する**（`currentColor`。アイコン側に色を付けない）。
- 単独で置くアイコン（空状態、ナビ）は [color.md](./color.md) のアイコン用トークンを使う。

| 用途 | クラス |
|------|--------|
| 空状態の大きなアイコン | `text-icon-subtle` |
| ナビのアイコン（通常） | `text-icon` |
| ナビのアイコン（選択中の線） | `text-icon-strong` |
| ナビのアイコン（選択中の塗り） | `fill-icon-fill` |
| エラー状態のアイコン | `text-destructive-text` |

- `text-muted-foreground/70` のような**半透明で近似しない**。線が重なる箇所だけ濃く見える。

#### 読み上げ

| 置き方 | 規定 |
|--------|------|
| テキストと併記する | **装飾扱い**。`aria-hidden="true"`（SVG は `focusable="false"` も付ける） |
| アイコンだけのボタン | ボタンに **`aria-label` 必須**（§2） |
| アイコンだけで状態を伝える（未読の印など） | 印に `aria-label`、または押せる親要素の `aria-label` に状態を含めて印は `aria-hidden` |

**原則テキストと併記する。** アイコンだけで意味が通じるのは、戻る・閉じる・ナビのように
位置と形で慣習が確立しているものに限る。

#### 外部リンク（新しいタブで開くリンク）

- `target="_blank"` に `rel="noopener noreferrer"` を付ける。
- **リンク文字の末尾に 16px の外部リンクアイコン**（`size-4`）を付ける。
- 「新しいタブで開きます」に相当する**代替テキスト**を持たせる（アイコンを `aria-hidden` にして、
  `sr-only` のテキストを添える）。予告なしにタブが変わると、戻るボタンで元の画面に戻れず迷う（DADS の基準）。
- Button の見た目のリンク（外部サービスへの導線）にも同じ規定を当てる。

### 1-5. disabled と処理中

| 状態 | 表現 |
|------|------|
| disabled | 専用のグレーを作らず `disabled:opacity-60` + `disabled:cursor-not-allowed`（入力部品は §3。カーソルは §1-7） |
| 処理中 | Button は §2 のローディング状態。画面の一部は Spinner、ページ全体は Skeleton（§8） |

### 1-6. hover の塗り

**地が透明な部品の hover は、全部品で `hover:bg-foreground/5`。**
Button の `secondary` / `outline` / `ghost`、FilterChip（非選択）、アイコンボタン、テーブルの行などが対象。

- `hover:bg-accent` にしない。`accent` は `muted` と同じ明るさ（96.1%）なので、グレー地（`bg-muted`）の上では hover が見えない。
- 半透明の `bg-foreground/5` は地の色に関係なく効く（白地での見え方は `accent` とほぼ同じ）。
- 塗りのある部品（`primary` / `destructive` / `line`、選択中の FilterChip）の hover は各部品の表のとおり。
- **下線型のタブ・テキストリンク（パンくずの親、ナビのテキストリンク、戻るリンク）は塗らず、文字色だけ変える**
  （`text-muted-foreground hover:text-foreground`）。下線型のタブに塗りを足すと選択中と紛れ、文字だけのリンクに面が出ると
  文字より広い範囲がボタンに見える。

### 1-7. カーソル

**押せるものはカーソルを `pointer`、無効なもの（`disabled` / `aria-disabled="true"`）は `not-allowed` にする。**

| 対象 | 規定 |
|------|------|
| `button` / `[role="button"]`（無効なものを除く） | core の `tailwind-v4.css` が `cursor: pointer` を設定済み。部品側で書かない（v4 の preflight が `cursor: default` にするため。v3 は preflight が元から `pointer`） |
| `<button>` 以外に押す処理を持たせた要素（クリックで遷移するテーブルの行など） | 部品側で `cursor-pointer`（§12） |
| `disabled` の要素 | `disabled:cursor-not-allowed`（§1-5） |
| `aria-disabled="true"` で無効にした要素（フォーカスを残したいもの） | `aria-disabled:cursor-not-allowed`。core の `pointer` は `aria-disabled="true"` を除外している |

---

## 2. Button / アクション

### 2-1. ルール

- **生の `<button>` を直接書かない。** 各プロダクトの共通 Button を通す。
  そうしないとフォーカスリング・disabled の表現・角丸・高さがファイルごとにばらつく。
- **非同期処理を伴うボタンはローディング状態を持つ。** 押下中は自動で `disabled` になり、
  スピナーまたはローディング文言を表示する。`disabled` を手で付け外しする実装をコピーしない。
- **アイコンのみのボタンには `aria-label` を必須**にする。何をするボタンかをテキストで持たない UI は、
  スクリーンリーダーから操作不能になる。
- **ボタンの文言は定数から引く**（「保存」「削除」「キャンセル」等）。文字列を直書きすると、
  同じ操作の呼び方が画面ごとにズレる。ローディング中の文言（「保存中...」）も同じ定数群に置く。
- **主要アクションの塗りは `primary` のみ。** 色つきベタ塗りボタン（緑の成功ボタン等）は作らない
  （[color.md](./color.md) の「solid はベタ塗りボタンではない」）。
- 破壊的アクションだけが `destructive` の塗りを使ってよい。LINE に関わる操作は `line` の塗り（§2-2）。
- 1 つの画面・1 つのダイアログに主要アクション（塗りボタン）は 1 つ。残りは secondary / outline / ghost。
  - `line` も塗りなのでこのルールと重なる。LINE ボタンを置く画面では、`primary` との優先順位をプロダクト側で決める。
- 遷移するだけのボタンは `<a>`（リンク）として描画し、見た目は Button と同じにする。

### 2-2. 仕様

**共通**: `inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors`

| variant | 使う場面 | クラス | hover |
|---------|---------|--------|-------|
| `primary`（既定） | 画面・ダイアログの主要アクション。1 つだけ | `border-0 bg-primary text-primary-foreground` | `hover:bg-primary/90` |
| `secondary` | 主要アクションではないが、その画面で前に進むための操作（空状態の次の行動、エラーからの再読み込み、「編集」など、画面や単位ごとの主な操作） | `border border-foreground bg-transparent text-foreground` | `hover:bg-foreground/5` |
| `outline` | キャンセル・戻る・補助的な操作。破壊的操作の入口（確認ダイアログを開くだけの「削除」「取り消す」ボタン） | `border border-input bg-transparent text-foreground` | `hover:bg-foreground/5` |
| `ghost` | 面の上で目立たせたくない操作 | `border-0 bg-transparent text-foreground` | `hover:bg-foreground/5` |
| `destructive` | 削除・取り消しなど元に戻せない操作 | `border-0 bg-destructive text-destructive-foreground` | `hover:bg-destructive/90` |
| `line` | LINE に関わる操作（LINE ログイン・友だち追加など）。どの場面で使うかはプロダクトごとに決める | `border-0 bg-line text-line-foreground` | `hover:bg-line-hover` |

> `secondary` / `outline` / `ghost` の地は**透明**（`bg-transparent`）。`bg-card`（白）にすると、グレー地（`bg-muted`）の上で白い箱が浮く。
> hover は §1-6（`hover:bg-foreground/5`）。

> **`outline` はグレー地（`bg-muted`）の上に直接置かない。** 枠の `border-input`（89.8%）がグレー地（96.1%）とほぼ同じで見えなくなる。
> グレー地では、まずボタンをカード（白地）の中に置く。カードに入れられないときは、上の表で `outline` の場面（キャンセル・戻るなど）でも `secondary` を使う。

> `line` は LINE 公式のブランド規定色。LINE と関係のない操作に汎用の緑として転用しない。

| size | 高さ | 左右 padding | 文字 | 使う場面 |
|------|------|-------------|------|---------|
| `md`（既定） | `min-h-11`（44px） | `px-6` | `text-base` | すべての場面 |
| `sm` | `h-8`（32px） | `px-4` | `text-sm` | **to B の密な一覧の行アクションだけ**（[layout.md](./layout.md) のタッチターゲットの例外） |

角丸はどちらも `rounded-md`。

| 状態 | 見た目 |
|------|--------|
| hover | variant の表のとおり |
| focus-visible | §1-1 のボタン類のリング |
| disabled | `disabled:cursor-not-allowed disabled:opacity-60` |
| loading | 文言の左に Spinner（`sm`、16px）を出し、自動で disabled。押せないことは opacity で示す |

### 2-3. ボタン行

**ボタン行**とは、ボタンだけを並べた行のこと（フォームの送信行、モーダル・確認ダイアログのフッター、
画面やカードの末尾の操作行）。ボタン行の規定はこの節が正で、他の文書はここを参照する。

**対象外**: 文字や情報と同じ行に置くボタン（カード見出し横の「編集」、テーブル・リストの行アクション、
ヘッダーのボタン、入力欄の横のボタンなど）と、中央寄せの塊の中の行動（EmptyState / ErrorState の次の行動・再読み込み。§8-4・§8-5）は
ボタン行ではない。**幅に関係なく中身の幅のまま**にし、この節の規定を当てない。

| 項目 | `md` 未満（スマホ） | `md` 以上 |
|------|-------------------|-----------|
| 幅 | **容器の幅いっぱい**（1 つなら全幅、2 つなら均等幅） | 中身の幅 |
| 寄せ | —（横いっぱい） | 右寄せ |
| 1 行に並べる数 | **2 つまで**。3 つは 2 行（下のルール） | 1 行に横並び |
| 並び順 | 副次 → 主（**主要アクションが右**、2 行なら下） | 副次 → 主（主要アクションが右端） |
| サイズ | `md` | `md` |

クラスはボタンの数ごとの表（下）が正。モーダル・確認ダイアログは下の「ダイアログの扱い」に従う。

- **3 つ以上置きたくなったら、幅に関係なくまず別の置き方を検討する。**
  - アイコンだけのボタンにする（`aria-label` 必須。§2-1）
  - ヘッダーの右端へ移す（[navigation.md](./navigation.md) §14-4 の条件に合う操作だけ。編集・削除などその画面固有の操作は置けない）
  - 頻度の低い操作はメニューにまとめる
- それでも 3 つになるときは、`md` 未満で 2 行にする。**主要アクションは下の行に単独で全幅**、上の行に残りの 2 つを均等幅で置く。
  DOM の順は 副次 → 主 のまま（上の行 → 下の行）にし、`md` 以上では上の行の囲みを `md:contents` で外して 1 行に並べる。

| ボタンの数 | 外側 | 各ボタン |
|-----------|------|---------|
| 1 つ | `md:flex md:justify-end` | `w-full md:w-auto` |
| 2 つ | `grid grid-cols-2 gap-2 md:flex md:justify-end` | `w-full md:w-auto` |
| 3 つ（`md` 未満は 2 行） | `grid gap-2 md:flex md:justify-end` の中に、上の行 `grid grid-cols-2 gap-2 md:contents` + 下の行の主要ボタン | `w-full md:w-auto` |

```tsx
{/* 2 つ */}
<div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
  <Button variant="outline" className="w-full md:w-auto">キャンセル</Button>
  <Button className="w-full md:w-auto">保存する</Button>
</div>

{/* 3 つ（md 未満は 2 行、md 以上は 1 行） */}
<div className="grid gap-2 md:flex md:justify-end">
  <div className="grid grid-cols-2 gap-2 md:contents">
    <Button variant="ghost" className="w-full md:w-auto">下書き保存</Button>
    <Button variant="outline" className="w-full md:w-auto">キャンセル</Button>
  </div>
  <Button className="w-full md:w-auto">申請を提出する</Button>
</div>
```

- スマホで全幅にするのは、押せる範囲を広げ、片手でも押しやすくするため。
- **均等幅に文言が収まるか確かめる**（`md` 未満のボタン行と、幅に関係なくダイアログ）。スマホ幅（375px）で 2 つ並べると 1 つあたり約 160px で、左右の `px-6` を引くと
  全角 7 文字ほどしか入らない（ボタンは `whitespace-nowrap` なので、はみ出した文字は隣のボタンに重なる）。収まらないときは次の順で直す。
  1. **まず文言を短くする。**
  2. 短くできなければ縦に積む。DOM の順のまま積むので、副次 → 主 の行では主要アクションが下に来る。
     - 通常のボタン行: `md` 未満だけ縦に積む（外側を `grid gap-2 md:flex md:justify-end`）
     - ダイアログ: 幅に関係なく縦に積む（外側を `grid gap-2`）

**ダイアログの扱い**（Modal・確認ダイアログのボタン行。§7）

- **幅に関係なく均等幅の 2 列**（`grid grid-cols-2 gap-2`、各ボタン `w-full`）。1 つなら `w-full`。`md` 以上でも右寄せにしない。
- 並びは 副次 → 主（主要アクションが右）。**破壊的・取り消せない操作のダイアログだけは実行が左・キャンセルが右**で、
  初期フォーカスはキャンセルに当てる（詳細は §7-4）。
- 例外: スマホ幅で全画面表示する編集モーダル（§7-3）の `md` 未満のフッターは、主要アクション 1 つを `w-full` にし、
  キャンセルを出さない（閉じる導線はヘッダー左の ×）。

---

## 3. 入力部品（Input / Textarea / Select / Checkbox）

ラベル・説明文・エラー文の並びと余白は [forms.md](./forms.md) が正。ここは**入力部品そのものの見た目**だけ。

### 3-1. Input / Textarea / Select の共通仕様

| 項目 | クラス |
|------|--------|
| 枠・面 | `w-full rounded-md border border-input bg-card text-foreground transition-colors` |
| 高さ | `min-h-11`（44px。[layout.md](./layout.md)） |
| 内側 padding | `px-3 py-2` |
| 文字 | **`text-base` 固定**（[typography.md](./typography.md)。16px 未満だと iOS がフォーカス時に画面を拡大する） |
| プレースホルダ | `placeholder:text-muted-foreground`（Select には無い） |

| 状態 | 見た目 |
|------|--------|
| focus-visible | §1-1 の入力欄のリング |
| disabled | `disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground` |
| エラー | 枠を `border-input` から **`border-destructive` に置き換え**、`aria-invalid="true"` を付ける。エラー文は [forms.md](./forms.md) |
| エラー中の focus-visible | リングを `ring-destructive` にする（§1-1 のエラー中の入力欄） |

| 部品 | 固有の規定 |
|------|-----------|
| Input | `type="date"` / `type="month"` は `appearance-none min-w-0 max-w-full` を部品側で当てる（[forms.md](./forms.md)） |
| Textarea | 最小の高さ 72px（`min-h-[4.5rem]`。v4 では `min-h-18`）、`resize-y`（縦方向だけ伸縮） |
| Select | `appearance-none pr-10` にしてブラウザ既定の矢印を消し、chevron を自前で置く（下の表）。既定の矢印は右端に寄りすぎ、ブラウザ内部の余白で文字の左位置も Input よりずれる。`appearance-none` にすると左の余白は Input と同じ `px-3` になる |

**Select の chevron**

| 項目 | クラス・規定 |
|------|------------|
| 親 | `relative`（select をくるむ） |
| アイコン | ChevronDown 20px（`size-5`）、`text-icon`、`aria-hidden="true"` |
| 位置 | `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2`。日付入力（`type="date"`）のカレンダーアイコンと右からの距離が揃う（Chromium で確認。iOS Safari の日付入力は [forms.md](./forms.md) §8-1 の `appearance: none` でアイコンが出ない） |
| 文字との重なり | select 側に `pr-10`（40px）。長い選択肢でも文字が chevron の下に潜らない |

### 3-2. Checkbox

| 項目 | クラス |
|------|--------|
| 外側の `<label>` | `relative inline-flex cursor-pointer items-center gap-2 text-sm text-foreground` |
| 当たり判定 | `before:absolute before:inset-x-0 before:-inset-y-3`（20px の見た目に上下 12px ずつ足して 44px） |
| チェック本体 | ネイティブの `<input type="checkbox">`。`relative size-5 shrink-0 cursor-pointer rounded-sm border border-input accent-primary` |
| チェック時の色 | `accent-primary`（生カラーの `accent-blue-600` 等にしない） |

- ネイティブの checkbox を `<label>` で包み、**ラベル文字ごと押せる**ようにする。
- チェック本体にも `relative` を付ける。付けないと当たり判定の疑似要素が本体の上に重なり、
  本体を直接操作する支援技術や E2E テストから「別の要素に遮られている」と判定される。

| 状態 | 見た目 |
|------|--------|
| focus-visible | §1-1 の入力欄のリング（チェック本体に付ける） |
| disabled | ラベルに `has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted-foreground`、本体に `disabled:cursor-not-allowed` |

---

## 4. Banner / Alert（通知・注記）

### 4-1. ルール

- **基本は Card（またはコンテンツのまとまり）の中に置き、塗りのみ・border なし**で表現する。
  `bg-*-surface` + `text-*-surface-foreground` の組み合わせだけを使い、枠線を足さない。
  カードの中で塗りと枠線を両方付けると主張が強すぎ、画面内で通知が乱立して見える。
- **カードの外に単独で置くときだけ border で囲む**（枠色は §4-2）。文脈上カードから独立させたいとき、
  カード型でない画面（[layout.md](./layout.md) の地色）のときに限る。地の上に塗りだけの帯を置くと、
  面の境界がぼやけてどこまでが通知か分かりにくいため。
- 語彙は意味で選ぶ: エラー = `destructive`、注意 = `warning`、情報 = `info`、完了 = `success`。
  **見た目の好みで色を選ばない。**
- アイコンを添える場合は `*-solid` を使う（`*-surface-foreground` でも可）。
- 恒常的な説明文には使わない。常に出ている通知は通知として認識されなくなる。

### 4-2. 仕様

| 項目 | クラス |
|------|--------|
| 外枠 | `flex items-start gap-2 rounded-md p-4 text-sm` |
| アイコン（任意） | 16px（`size-4`）。`mt-0.5 shrink-0`、`aria-hidden="true"` |
| 本文 | `min-w-0 flex-1`（右端に矢印などを寄せられるよう横いっぱいに広げる） |

| tone | クラス |
|------|--------|
| `destructive` | `bg-destructive-surface text-destructive-surface-foreground` |
| `warning` | `bg-warning-surface text-warning-surface-foreground` |
| `info` | `bg-info-surface text-info-surface-foreground` |
| `success` | `bg-success-surface text-success-surface-foreground` |

**カードの外に単独で置くときの枠色**（`border` + 下の色。Card の中では枠なし。§4-1）

| tone | 枠色 |
|------|-------------------|
| `destructive` | `border-destructive`（入力欄のエラー枠と同じ） |
| `warning` | `border-warning` |
| `info` | `border-info` |
| `success` | `border-success` |

枠色は各トーンの text トーン（`destructive` は DEFAULT）を使う。どれも白地に対して 3:1 以上
（text トーンは `background` に対して 4.5:1 以上、`destructive` の赤は純白に対して 4.83。[color.md](./color.md)）で、非テキストのコントラスト（WCAG 1.4.11）を満たす。

**読み上げのロール**は緊急度で選ぶ。

| ロール | 使う場面 |
|--------|---------|
| `alert` | エラー・操作の失敗。読み上げを即座に割り込ませる |
| `status` | 緊急性の低い通知（プレビュー表示中、下書きの復元など）。読み上げを中断させない |
| `note` | 補足（入力済み項目の注記など） |

---

## 5. Badge / StatusBadge

### 5-1. ルール

- **ピル型（`rounded-full`）+ `*-surface` 塗り**に統一する。
- **solid variant（黒／赤のベタ塗り）を状態表示に使わない。** ベタ塗りはアクションの合図なので、
  押せないバッジに使うと誤解される。
- 状態を表すバッジの色は、コンポーネント内に直書きせず **constants の色マップから引く**
  （[color.md](./color.md) の「状態色は constants に集約する」）。
  どの状態をどの tone・文言で出すかは 1 箇所の関数にまとめ、Badge 側は受け取った tone を描くだけにする。
- バッジ内の文字は `text-xs` 相当まで。長文をバッジに入れない。
- 非アクティブ・期限切れは `inactive-surface` を使う。`bg-gray-300` 等の直書きは禁止。

### 5-2. Badge の仕様

**共通**: `inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap`

| size | 高さ | padding |
|------|------|---------|
| `md`（既定） | 24px | `px-3 py-1` |
| `sm` | 20px | `min-h-5 px-2 py-0` |

| tone | クラス | 意味 |
|------|--------|------|
| `success` | `bg-success-surface text-success-surface-foreground` | 確定・ポジティブ |
| `warning` | `bg-warning-surface text-warning-surface-foreground` | 要アクション |
| `info` | `bg-info-surface text-info-surface-foreground` | 中立的な情報 |
| `destructive` | `bg-destructive-surface text-destructive-surface-foreground` | 不可・拒否 |
| `inactive` | `bg-inactive-surface text-inactive-surface-foreground` | 終了・非アクティブ |
| `favorite` | `bg-favorite-surface text-favorite-surface-foreground` | お気に入り・興味あり（`destructive` と意味が違うので互いに代用しない） |

アイコンを添えるときは 16px（`size-4`）、`aria-hidden="true"`。

### 5-3. 件数と印（StatusBadge の count / dot）

状態の**ラベル**ではなく、**件数**や**有無**だけを示すインジケーター。Badge とは別の variant として持つ。

| variant | 形 | クラス | 使う場面 |
|---------|-----|--------|---------|
| `count` | 高さ 20px のピル、最小幅 20px | `inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums` + tone の反転ペア（下表） | 未対応の件数など。タブ・見出しの横に添える |
| `dot` | 8px の円 | `inline-block size-2 shrink-0 rounded-full` + tone の solid（下表） | 未読など、件数を出さず有無だけを示す |

| tone | count（反転ペア） | dot（solid） |
|------|-------------------|--------------|
| `success` | `bg-success-surface-foreground text-success-surface` | `bg-success-solid` |
| `warning` | `bg-warning-surface-foreground text-warning-surface` | `bg-warning-solid` |
| `info` | `bg-info-surface-foreground text-info-surface` | `bg-info-solid` |
| `destructive` | `bg-destructive text-destructive-foreground` | `bg-destructive` |
| `favorite` | `bg-favorite-surface-foreground text-favorite-surface` | `bg-favorite-solid` |

- count は surface のペアを**前景と背景を入れ替えて**使う。コントラストは surface のペアと同じ値になり、
  白文字の生カラーを使わずに済む。
- **dot は文字を持たないので、読み上げの手当てが必須。** dot 自体に `aria-label`（「未読」等）を付けるか、
  押せる親要素の `aria-label` に状態を含めて dot を `aria-hidden="true"` にする。
- 面の上に重ねる dot（アイコンの右上など）は `ring-2 ring-card` で縁取り、下の線と分離する。

---

## 6. Card

- **border + rounded のみ。shadow を付けない**（§1-3）。
  画面個別に `shadow-sm` / `shadow-md` / `shadow-lg` を Card・パネルへ追加しない。
- Button・フォーム部品（Input / Select / Checkbox / Radio / Switch 本体 / Calendar）・Badge・Tabs も
  同様にフラット。UI ライブラリ既定の `shadow*` は除去する。
- 内側 padding とカード内の要素間隔は [spacing.md](./spacing.md) の「Card の内側 padding」に従う。

| 項目 | クラス |
|------|--------|
| 面 | `rounded-lg border border-border bg-card` |
| padding `md`（既定） | `p-4 md:p-6`（スマホ 16px、`md` 以上 24px） |
| padding `sm` | `p-4`（情報密度の高い小さなカード、一覧の 1 件） |
| padding `none` | なし（中で区画ごとに padding を持つとき） |

- 見出しを持つ独立した区画は `<section>`（または `<article>`）で出す。`<div>` のままだとランドマークにならず、
  支援技術から「見出しのある区画」として辿れない。
- Card は面だけを提供する。見出しと本文の組み立ては呼び出し側で行う。

---

## 7. Modal / 確認ダイアログ

### 7-1. ルール

- **`window.confirm()` / `window.alert()` を使わない。** スタイルが当たらず、
  文言の制御もできず、テストからも扱いづらい。共通の確認ダイアログを使う。
- 破壊的操作（削除・取消不可の操作）は確認ダイアログを必須にする。
- 確認ダイアログは **ESC キー・背景クリックで閉じない**。誤操作で「キャンセル」されるのは問題ないが、
  閉じ方が曖昧だと「実行したのかどうか」がユーザーに残らない。
- 確認ボタンの文言は「OK」ではなく **動詞**にする（「削除する」「送信する」。書き方は [writing.md](./writing.md)）。
- **フォーム入力が必要なものは確認ダイアログではなく通常の Modal。** 確認ダイアログは確認だけ。
- 確認ダイアログも実行中はローディング状態を持つ（二重送信の防止）。
- 重なりの順序と暗幕は [layout.md](./layout.md) に従う。Tailwind 既定の `z-50` に丸めない。

### 7-2. Modal（汎用）

選択・入力を伴う一般的なダイアログ。

| 項目 | クラス |
|------|--------|
| 外側（暗幕） | `fixed inset-0 flex items-center justify-center p-4` + layout.md のモーダルの層と暗幕 |
| 箱 | `w-full max-h-[90dvh] overflow-y-auto rounded-lg bg-card p-6 text-card-foreground shadow-lg` |
| 幅 | 既定 `max-w-md`。入力項目の多い編集フォームは `max-w-xl` |
| タイトル | `<h2>`、`text-lg font-semibold leading-normal`。本文との間は `space-y-2` 相当 |
| アクション行 | 本文の後ろに `mt-6` で置く。幅・並び順は §2-3 のダイアログの扱い |

**振る舞い**

| 項目 | 規定 |
|------|------|
| 閉じ方 | ESC・背景クリック・×（またはキャンセル）で閉じる。箱の内側のクリックは背景へ貫通させない |
| ロール | `role="dialog"` `aria-modal="true"`、タイトルを `aria-labelledby` で紐づける |
| 初期フォーカス | 開いたら最初のフォーカス可能な要素へ移す。**ヘッダーの × は飛ばす**（開いた直後に × に当たると Enter で閉じてしまう）。中身が自分でフォーカスしていれば奪わない |
| フォーカスの閉じ込め | Tab / Shift+Tab がダイアログの外に出ないようにする |
| 背景のスクロール | 開いている間は body のスクロールを止める。**参照カウント方式**にする（入れ子で開いたときに、閉じる順序によってスクロール不能のまま残るのを防ぐ） |
| 入れ子 | キー操作は入力を受けた要素に一番近いダイアログだけが処理する（ESC で外側まで一斉に閉じない） |

### 7-3. 全画面の編集モーダル（スマホ）

保存して元の画面に戻る編集フォームを、スマホ幅で全画面に広げる形。使い分けは
[navigation.md](./navigation.md) の「モーダルとして開く画面」を参照。

| 項目 | `md` 未満 | `md` 以上 |
|------|-----------|-----------|
| 箱 | `h-dvh max-h-dvh max-w-full rounded-none`（暗幕の `p-4` も外す） | §7-2 の箱（`max-w-xl`） |
| ヘッダー | 下層ヘッダーと同じ形（左に ×、中央にタイトル。[navigation.md](./navigation.md)）+ 上端に safe-area の余白 | 同左 |
| 本文 | `flex-1 overflow-y-auto p-6`（本文だけがスクロールする） | 同左 |
| フッター | `border-t border-border p-4` + 下端に safe-area の余白。ボタンは §2-3 のダイアログの扱いの例外（主要アクション 1 つだけ） | §2-3 のダイアログの扱い |
| 保存失敗 | 本文の先頭に Alert（`destructive`）。モーダルの背後の画面に出しても、開いている間は見えない | 同左 |

### 7-4. 確認ダイアログ

| 項目 | クラス・規定 |
|------|------------|
| 外側 | `fixed inset-0 flex items-center justify-center p-4`。重なりは **layout.md の確認ダイアログの層**（単体で開くときも同じ層に固定し、開き方によって値を変えない） |
| 暗幕 | 単体: layout.md の暗幕。**別のモーダルの中から開くときは `bg-overlay/25`**（外側の暗幕と重なって単体と同程度の濃さになる。暗幕を消すと白い箱どうしが重なって輪郭が消える） |
| 箱 | `w-full max-w-sm rounded-lg bg-card p-6 text-card-foreground shadow-lg` |
| タイトル | `<h2>`、`text-lg font-semibold leading-normal`。問いの形で書く |
| 説明（任意） | `text-sm text-muted-foreground`、タイトルとの間は `space-y-2` 相当。元に戻せるかどうかを書く |
| ボタン行 | 本文の後ろに `mt-6` で置く。幅は §2-3 のダイアログの扱い。サイズは `md`。並び順は下の表 |
| 閉じ方 | ESC・背景クリックでは閉じない。キャンセルボタンだけ |
| 実行中 | 実行ボタンをローディング状態にし、キャンセルも disabled にする |
| フォーカス | 閉じ込め・参照カウントのスクロール停止は Modal と同じ。初期フォーカスは下の表 |

| 操作の種類 | 左 | 右 | 初期フォーカス |
|-----------|----|----|---------------|
| 通常（送信・確定など） | キャンセル（`outline`） | 実行（`primary`） | 左（キャンセル） |
| 破壊的・取り消せない操作（削除・予約の取り消しなど） | 実行（`destructive`） | キャンセル（`outline`） | 右（キャンセル）。実行ボタンは初期フォーカスから外す |

- 表示順と DOM の順は揃える（CSS の `order` で入れ替えない。Tab の順が見た目と逆になる）。
- 破壊的操作では、実行ボタンが先頭に来ても**初期フォーカスは必ずキャンセル側**に当てる。開いた直後の Enter で取り消せない操作が実行されないようにするため。

---

## 8. ローディング・空・エラーの表示

### 8-1. ルール

- **独自のローディングコンポーネントを新規に作らない。** 共通のものを使う。
- 使い分けの原則:

| 状況 | 表現 |
|------|------|
| ページ全体の初期読み込み | Skeleton（実際のレイアウトに沿った形） |
| 一覧・テーブル | テーブル用 Skeleton（列数・行数を指定） |
| ボタン押下後 | ボタン内のローディング（§2） |
| 部分的な非同期表示 | インラインのスピナー |
| 取得は成功したが 0 件 | EmptyState |
| 取得に失敗した | ErrorState |

- **スピナーを全画面に出さない。** レイアウトが一度消えて戻ると、位置の記憶が失われる。
  形のある Skeleton を優先する。
- **空状態に「再読み込み」を置かない。** 取得は成功していて 0 件なので、再試行しても結果は変わらない。
  再試行の導線は ErrorState の責務。

### 8-2. Spinner

| size | クラス | 使う場面 |
|------|--------|---------|
| `sm` | `size-4 border-2` | ボタンの中、文字と並べるとき |
| `md`（既定） | `size-6 border-[3px]` | 画面の一部の読み込み |

- 共通: `inline-block shrink-0 animate-spin motion-reduce:animate-none rounded-full border-current border-t-transparent`
- 色は文字色を継承する（`border-current`）。
- 既定は装飾扱い（`aria-hidden="true"`）。スピナーだけで読み込み中を伝えるときは
  `role="status"` と `aria-label` を付ける。

### 8-3. Skeleton

| 項目 | クラス・規定 |
|------|------------|
| 面 | `block animate-pulse motion-reduce:animate-none bg-muted` |
| 角丸 | 文字・ブロックは `rounded-sm`、バッジ・チップの代わりは `rounded-full` |
| 寸法 | 置き換える実物の寸法に合わせる（文字 1 行なら高さ 1em） |
| 載せる面 | Card（`bg-card`）の上。`bg-muted` の地の上に直に置くと見えない |
| 読み上げ | 個々の Skeleton は `aria-hidden="true"`。まとまりの外枠に `aria-busy="true"` |

- `animate-pulse` は `prefers-reduced-motion` を尊重しないので、`motion-reduce:animate-none` を必ず付ける。
- **実物と同じ骨格にする。** カードの padding・要素間の gap・角丸・カード間の gap まで実物に揃え、
  読み込み後に高さが変わらないようにする（実物を変えたら Skeleton も同じ差分で直す）。
- **その幅で実物に無いものの枠を確保しない。** 実物で視覚的に隠している見出し（`sr-only`）や、
  ある幅でしか出ない戻るリンクのぶんを確保すると、読み込み後にその高さだけ詰まってガタつく。
  幅ごとの出し分けは実物と同じブレークポイントで行う。
- ヘッダーは Skeleton にしない（[navigation.md](./navigation.md) の「読み込み中のヘッダー」）。

### 8-4. EmptyState（0 件）

体裁は **アイコン → 見出し → 補足 → 次の行動** の縦並び・中央寄せで全画面共通にする。

| 要素 | クラス・規定 |
|------|------------|
| 外枠 | `text-center text-muted-foreground`、`role="status"` |
| アイコン | **必ず出す**。32px（`size-8`）、`text-icon-subtle`、`aria-hidden="true"`。下に `mb-4` |
| 見出し | 「〜はありません」。`text-xl font-semibold leading-normal text-foreground`、下に `mb-2` |
| 補足（任意） | 次に何が起きるか・何をすればよいか。`text-base leading-relaxed break-words` |
| 次の行動（任意） | 遷移するリンクの Button（`secondary`、`md`）。**中身の幅で中央寄せ**（§2-3 の対象外）。`mt-6 flex flex-wrap justify-center gap-2` |

| variant | 外枠の padding・面 | 使う場面 |
|---------|-------------------|---------|
| `page`（既定） | `px-4 py-8` | 一覧ページ全体が 0 件 |
| `card` | `px-4 py-6 rounded-lg bg-muted` | カードの外のセクション内 |
| `plain` | `px-4 py-6` | カードの中の節 |

文言は [writing.md](./writing.md)（状況 + 次の一手）。

### 8-5. ErrorState（取得失敗）

EmptyState と対になる部品。体裁を揃える。

| 要素 | クラス・規定 |
|------|------------|
| 外枠 | `px-4 py-8 text-center text-muted-foreground`、`role="alert"` |
| アイコン | 警告の三角形。32px（`size-8`）、`text-destructive-text`、`aria-hidden="true"`。下に `mb-4` |
| メッセージ | `text-base break-words`。文言は [writing.md](./writing.md) |
| 行動 | **中身の幅で中央寄せ**（§2-3 の対象外）。`mt-6 flex flex-wrap items-center justify-center gap-2`。再試行できるなら「再読み込み」（`secondary`）、認証切れなら「ログイン」（`primary`）。サイズは `md` |

---

## 9. Toast（操作完了の通知）

### 9-1. ルール

- **操作が完了したことを短く知らせるときだけ**使う（「保存しました」「コピーしました」）。
- トーストは自動で消える。そのため**閉じるボタン（×）は付けず**、**対応が必要なエラー・入力エラー**や
  後から見返す必要がある情報をトーストだけに載せない（読み逃し、どこを直すかも示せない）。
  操作の失敗は Alert（§4）、入力エラーはフィールドのエラー（[forms.md](./forms.md)）で出す。
- **同時に出すのは 1 件。** 新しいトーストが来たら、表示中のものを置き換える（積み重ねない）。

### 9-2. 仕様

| 項目 | クラス・規定 |
|------|------------|
| 箱 | `flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg` |
| 位置（`lg` 未満・タブバーのある画面） | `fixed inset-x-4 bottom-[calc(var(--tabbar-offset)+1rem)]`（タブバーの上端から 16px、左右 16px） |
| 位置（`lg` 未満・タブバーの無い画面） | `fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))]`（`bottom-4` + safe-area） |
| 位置（`lg` 以上） | `lg:left-auto lg:right-6 lg:bottom-6 lg:w-full lg:max-w-sm`（右下） |
| 重なり | **layout.md のトーストの層**（モーダルより上） |
| アイコン | 左に種類のアイコン。16px（`size-4`）、`mt-0.5 shrink-0`、`aria-hidden="true"`。色は Alert と同じく solid（下表） |
| 本文 | `min-w-0 flex-1` |
| アクション（任意） | 「元に戻す」等。本文の右に置き、押せる領域は 44px（§1-2） |

| 種類 | アイコンの色 | 使う場面 |
|------|-------------|---------|
| `success`（既定） | `text-success-solid` | 保存・送信・削除などの完了 |
| `info` | `text-info-solid` | 完了以外の短いお知らせ |

`--tabbar-offset` はプロダクト側の CSS で定義する（[navigation.md](./navigation.md) §12-3）。

**振る舞い**

| 項目 | 規定 |
|------|------|
| 表示時間 | **5 秒**。アクション付きは **8 秒** |
| 一時停止 | hover 中・フォーカスが中にある間はタイマーを止め、離れたら再開する |
| ロール | `role="status"`。`role="status"` を持つ要素は常に DOM に置き、中のトーストだけを出し入れする（ロールごと後から足すと読み上げられないことがある） |
| 出るとき | 下から（`translate-y-2` → 0）フェードイン、150ms。`prefers-reduced-motion` ではフェードだけ（移動しない） |

---

## 10. FilterChip（一覧の絞り込み）

一覧の上に並べる、**単一選択**の絞り込みトグル。選択中の chip は「いま何を見ているか」を示す状態表示なので、
§2 の「塗りの主要アクションは 1 画面に 1 つ」とは別枠として扱う。

**共通**: `relative inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm whitespace-nowrap transition-colors before:absolute before:inset-x-0 before:-inset-y-1`

| 状態 | クラス |
|------|--------|
| 選択中 | `border-primary bg-primary font-semibold text-primary-foreground hover:bg-primary/90` |
| 非選択 | `border-muted-foreground/60 font-medium text-foreground hover:bg-foreground/5` |
| focus-visible | §1-1 のボタン類のリング（`ring-offset-2` あり） |
| disabled | `disabled:cursor-not-allowed disabled:opacity-60` |

- 見た目の高さは 36px（`h-9`）。当たり判定は疑似要素で上下に 4px ずつ広げて 44px にする。
  見た目を 44px にすると一覧の上で chip が重く見える。
- 選択状態は `aria-pressed` で伝える。
- 非選択の hover は §1-6。
- 非選択の枠線は `border-input` にしない。白地でほとんど見えず、押せる要素だと分からない。
- chip 群は `flex flex-wrap gap-2`。スマホで収まらない場合は折り返す。

---

## 11. PageHeader（ページ見出し）

本文の先頭に置く行。**to B と to C で中身が違う**（理由は [design.md](./design.md) §4 と [navigation.md](./navigation.md) §9-1）。
どちらも戻るリンクは置かない（to B は帯のパンくず、`lg` 未満は帯の戻る。to C は下層ヘッダー。`lg` 以上の to C だけ本文の戻るリンク。[navigation.md](./navigation.md) §14-5）。

### 11-1. to B: 補足と操作の行

`<h1>` は上の帯に置くので、本文には見出しを置かず、**補足情報（左）とページの操作（右）だけ**を並べる。

| 要素 | クラス・規定 |
|------|------------|
| 外枠 | `mb-6 flex flex-wrap items-center justify-between gap-4`。**補足も操作も無い画面では行ごと出さない** |
| 補足（任意） | 左。`flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground`。会員番号・ふりがな・状態の Badge など、`<h1>` に入れない識別情報 |
| 操作（任意） | 右。`ml-auto flex min-w-0 max-w-full flex-wrap gap-2`（`shrink-0` にしない。狭い幅では折り返す。補足が無くても右に寄る） |

### 11-2. to C: 見出しの行

| 要素 | クラス・規定 |
|------|------------|
| 外枠 | `mb-6 flex flex-wrap items-start justify-between gap-4` |
| 見出し | `<h1>`。サイズと行間は [typography.md](./typography.md) のページ見出し。**1 画面に 1 つ** |
| 説明（任意） | `mt-2 text-base text-muted-foreground` |
| アクション（任意） | 右側。`min-w-0 max-w-full`（`shrink-0` にしない。狭い幅では自分の幅を縮めて中のボタンを折り返す） |

`<h1>` を `sr-only` にするかは画面で決まる（理由は [navigation.md](./navigation.md) §13・§14-2）。
タブ直下で `sr-only` にした画面では説明・アクションも出さない。`<h1>` 自体は消さない（見出しジャンプやページの主題が読み上げで取れなくなる）。

| 画面 | `<h1>` のクラス |
|------|----------------|
| タブ直下 | `sr-only` |
| それ自体が名前を持つ画面（下層ヘッダーに画面名を出す） | `max-lg:sr-only` |
| 一覧から入った個別のレコードの詳細 | なし（見せる） |

---

## 12. テーブル（セルの見た目）

列の順序・ソート・ページネーション等のルールは別途定める。ここはセルの見た目だけ。

| 要素 | クラス |
|------|--------|
| `<table>` | `w-full border-collapse text-sm` |
| `<th>` | `border-b border-border bg-muted px-4 py-2 text-left font-semibold whitespace-nowrap text-foreground` |
| `<td>`（既定） | `border-b border-border px-4 py-2 text-left align-middle whitespace-nowrap text-foreground` |
| `<td>`（可変長の短めの文字: 氏名・組織名など） | 既定 + `max-w-48 truncate`、`title` に全文 |
| `<td>`（可変長の長めの文字: メール・タイトル・説明など） | 既定 + `max-w-xs truncate`、`title` に全文 |
| `<tr>`（行） | `transition-colors hover:bg-foreground/5`。クリックで遷移する行は `cursor-pointer` も付ける |

- 行の hover は §1-6。
- セルの padding は [spacing.md](./spacing.md) の「テーブルセルの padding」に従う（横 16px／縦 8px）。
  1 つの表の中で揃える。
- 全セルを 1 行（`whitespace-nowrap`）にし、縦方向は `align-middle` で揃える。
  バッジやボタンで背の高いセルと文字だけのセルが混ざっても、行内で文字の位置がずれない。
- **truncate する列には必ず `title` に元の文字列を渡す**（省略された全文をホバーで読めるようにする）。
  中身が JSX（バッジ・ボタン・ツールチップ）の列は truncate しない（`overflow-hidden` が浮いた要素まで切る）。
- `max-w-*` は「幅が足りないときにここまでは縮む」下限の目安として効く（`w-full` の表では余った幅が配分される）。
  任意値（`max-w-[200px]`）にしない。
- 1 つのセルに `max-w-*` を 2 つ乗せない（勝敗が CSS の生成順で決まる）。幅の違う列は別の定数として持つ。
- 横幅が足りない画面では、表の親を `overflow-x-auto` で包む。表でページ全体を横スクロールさせない。

---

## 13. フォーム

- ラベルは必ず入力欄と関連付ける（`htmlFor` / `id`）。プレースホルダをラベル代わりにしない。
- エラーメッセージは入力欄の**直下**に `text-destructive-text` で出す。
  フォーム上部にまとめるだけの実装にしない（どの欄が問題か分からない）。
- 必須・任意の表示方法をプロダクト内で統一する（必須にマークを付けるか、任意にマークを付けるかの
  どちらか一方）。具体的な示し方は [forms.md](./forms.md)。

---

## 14. Tabs（画面内のタブ）

1 件のレコード（設定なら 1 つのオブジェクト）の**別の面**を、同じ画面の中で切り替える下線型のタブ。

### 14-1. ルール

- **同じものの別の面を切り替えるときだけ**使う（会員の「基本情報」「予約履歴」、営業時間の設定の「営業時間」「早番遅番」）。
  別のもの（予約と会員）を並べたいなら、タブにせず別のページ（メニューの項目）にする。
  メニューの 3 段目・肥大したグループを「画面内のタブに降ろす」とき（[navigation.md](./navigation.md) §4・§6）、
  保存の境界でタブを分けるとき（[forms.md](./forms.md) §2）もこの部品を使う。
- **選択中のタブを URL に持つ**（`?tab=history`。既定のタブはパラメータなし）。リロード・共有・ブックマークで同じタブが開く。
- **置き場所はカードの外**（カード型の画面ならグレー地の上）。中身はタブ列の下にカードとして置く。タブ列をカードの中に入れない。
- **タブ 1 つにカードが 1 枚だけなら、そのカードの見出しを出さない。** タブ名と同じ語の繰り返しになる。
  見出しの無いカードは `<div>` にし（§6 の `<section>` は見出しを持つ区画のため）、区画の名前は tabpanel がタブから取る。
- 件数を添えるときはタブ名の右に小さく数字だけ（下表）。StatusBadge の count（§5-3）にしない。
- **入りきらないときは横スクロール**（`overflow-x-auto`）。折り返さない（2 段になると、下線がどの段のタブのものか分からない）。

### 14-2. 仕様

**共通**: `-mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm whitespace-nowrap` + §1-1 の `ring-inset` のリング（タブ列は横スクロールの容器なので）

| 要素・状態 | クラス |
|------------|--------|
| タブ列 | `flex overflow-x-auto border-b border-border` |
| 選択中 | 共通 + `border-foreground font-semibold text-foreground` |
| 非選択 | 共通 + `border-transparent font-medium text-muted-foreground hover:text-foreground` |
| 件数（任意） | タブ名の右に `text-xs tabular-nums text-muted-foreground` |
| 中身 | タブ列の下に `space-y-4` 相当の間隔でカードを置く |

- 選択中は**太さと色の両方**で示し、下線（`border-b-2 border-foreground`）を足す（色だけで状態を伝えない。[navigation.md](./navigation.md) §12-2 と同じ）。
- `-mb-px` で各タブの下線をタブ列の `border-b` に重ねる。
- hover は文字色だけ変え、塗らない（§1-6）。
- ナビと同じくブランド色（`text-primary`）を使わない。

### 14-3. 振る舞い（ARIA）

実装は次の 2 通りのどちらか。**1 つのプロダクトの中ではどちらかに揃える。**

| 実装 | 規定 |
|------|------|
| A. タブ（既定） | タブ列 `role="tablist"` + `aria-label`、各タブ `<button role="tab">` + `aria-selected` + `aria-controls`、中身 `role="tabpanel"` + `aria-labelledby`。フォーカスを受けるのは選択中のタブだけ（`tabindex="0"`、他は `-1`）。**←→ キーで隣のタブへ移って選択**（端で反対側に回る。Home / End で端へ）。選択を変えたら URL のクエリを書き換える |
| B. リンク | 各タブを `<a href="?tab=…">` にし、選択中に `aria-current="page"`。タブ列は `<nav aria-label>`。`role="tab"` と矢印キーは付けない（Tab キーで移動する） |

- B は切り替えのたびにページ遷移として扱うフレームワーク（サーバーで中身を描くもの）向け。A と B の ARIA を混ぜない
  （`role="tab"` のリンク、`aria-selected` と `aria-current` の併用をしない）。

---

## 15. DescriptionList（詳細の項目と値）

レコードの詳細画面で、項目名と値の組を並べる。`<dl>` で書く。

| 要素 | クラス・規定 |
|------|------------|
| `<dl>` | `grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2`（スマホ 1 列、`md` 以上 2 列。項目間 16px） |
| 1 項目 | `<div class="space-y-1">` で `<dt>` と `<dd>` を包む（項目名と値の間 4px） |
| 長い値の項目（住所・備考・メモ） | 1 項目 + `md:col-span-2` |
| 項目名 `<dt>` | `text-sm leading-tight text-muted-foreground`。値の**上**に置く |
| 値 `<dd>` | `text-base leading-relaxed break-words text-foreground`（[typography.md](./typography.md) の本文・フォーム値） |
| メール・URL の値 | 値 + `break-all`（区切りの無い長い英数字を途中で折る） |

- **縦積み**（項目名が上、値が下）。項目名を左・値を右の横並びにしない（項目名の長さで値の位置がばらつき、スマホで崩れる）。
- **空の値は「—」**（全角ダッシュ 1 文字）。「未設定」「なし」「-」と書き分けない。
- 長い値は**折り返す**。`truncate` しない（詳細画面は全文を読む場所）。
- **編集はカード単位。** カードの見出しの横に `secondary` の Button（§2）を 1 つ置き、カードの項目をまとめて編集する。
  項目ごとに編集ボタンを並べない。

---

## 16. Menu（ドロップダウンメニュー）

ボタンから開く、操作の一覧。行のその他の操作（`…`）や、ヘッダーのユーザーメニュー（[navigation.md](./navigation.md) §9-5）で使う。

### 16-1. ルール

- **操作が 1 つならメニューにせずボタンを置く。2 つ以上のときだけメニューにまとめる。** メニューに隠した操作は見つけにくい。
- 項目に**アイコンを付けない**（文字だけ）。
- **破壊的な項目**（削除・取り消し）は §16-2 の表の色にし、**メニューの一番下に区切り線を挟んで**置く。
  押したら確認ダイアログ（§7-4）を出す。メニューの中で確認しない。
- 通知の一覧のように、操作ではなく情報を出すもの（ポップオーバー）も、箱・重なり・portal・閉じ方はこの節に従う（`role="menu"` は付けない）。

### 16-2. 仕様

| 要素 | クラス・規定 |
|------|------------|
| 箱 | `min-w-40 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md`（影は §1-3 の 1 段目） |
| 項目 | `flex min-h-11 w-full items-center px-3 text-left text-sm whitespace-nowrap text-foreground hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring` |
| 破壊的な項目 | 項目の `text-foreground` を `text-destructive-text` に置き換える |
| 区切り線 | 破壊的な項目の前に `my-1 border-t border-border`（`role="separator"`） |
| 位置 | 開いたボタンの 4px 下。画面の右側から開くものは右端を揃える。揃えると画面の外にはみ出す幅なら、画面の端から 16px の位置まで寄せる |
| 重なり | [layout.md](./layout.md) §4 のメニュー・ポップオーバーの層 |

- 項目の hover は §1-6、フォーカスのリングは §1-1 の `ring-inset` の行。
- **どこから開いても portal で body 直下に出し**、`position: fixed` で開いたボタンの位置に合わせる。
  開いたボタンの近くに置くと、表のスクロール領域やモーダルの箱（`overflow-y-auto`）で切れる。
- 位置はインライン style で書いてよい（[color.md](./color.md) §7 の例外。使えるプロパティもそこが正）。
  スクロール・リサイズでは位置を追従させる。
- 項目からモーダル・確認ダイアログを開くときは、メニューを閉じてから開く。メニューの層はモーダルより上なので、開いたままだとダイアログに重なる。

### 16-3. 振る舞い

| 項目 | 規定 |
|------|------|
| 開くボタン | `aria-haspopup="menu"`、`aria-expanded`。アイコンだけのボタンは `aria-label` 必須（§2） |
| ロール | 箱 `role="menu"`、項目 `role="menuitem"`、区切り線 `role="separator"` |
| 開いたとき | 最初の項目にフォーカスを移す |
| キー | ↑↓ で項目を移動（端で反対側に回る）、Home / End で端へ、Enter で実行、**Esc で閉じる** |
| 閉じたとき | **開いたボタンにフォーカスを戻す**（Esc・項目の実行のどちらでも。項目から確認ダイアログを開いたときは、ダイアログが閉じたあとに戻す） |
| 外側のクリック | 閉じる |

---

## 17. レビュー用チェックリスト

差分行を対象にチェックする（既存行の全置換は強制しない。**触った画面のついでに直す**）。

### カラー

- [ ] 新規・変更行に生カラー（`text-gray-*` `bg-blue-*` `text-red-*` 等。白文字の直書きも含む）が無いか
- [ ] クラス名をテンプレートリテラルで組み立てていないか → 完全な文字列で書く（[color.md](./color.md)）
- [ ] 状態色をコンポーネントに直書きしていないか → constants の色マップへ
- [ ] `*-surface` を使う箇所で `*-surface-foreground` とセットになっているか
- [ ] 色つきベタ塗りボタンを作っていないか（塗りは `primary` / `destructive` / LINE に関わる操作の `line` のみ）
- [ ] 16進カラー・インライン style が [color.md](./color.md) §7 の例外以外で使われていないか
- [ ] 新しい色を足した場合、`pnpm check`（コントラスト検証）を通したか

### タイポグラフィ

- [ ] フォントサイズが標準スケールか（px 直書き・`text-[..px]` 任意値が無いか）
- [ ] 強調がウェイトで表現されているか（色での強調が乱発されていないか）
- [ ] 金額・ID に `font-mono` を使っていないか
- [ ] 入力欄の文字が `text-base`（16px）か（`text-sm` にしていないか）

### スペーシング

- [ ] 画面側の余白（部品どうし・セクションの間、ページ外周）が spacing.md §1 の段に収まっているか（`p-[13px]` 等の任意値が無いか）
- [ ] 画面側で、子要素の `mt-*` / `mb-*` ではなく親の `space-y-*` / `gap-*` で間隔を作っているか

### コンポーネント

- [ ] 生の `<button>` を使っていないか
- [ ] 非同期ボタンがローディング状態を持っているか
- [ ] アイコンのみのボタンに `aria-label` があるか
- [ ] ボタン文言が定数から引かれているか
- [ ] `size="sm"`（32px）のボタンを、to B の密な一覧の行アクション以外で使っていないか
- [ ] ボタン行が §2-3 に従っているか（`md` 未満は全幅・1 行 2 つまで、ダイアログは均等幅 2 列。§7-3 の `md` 未満を除く）
- [ ] ボタン行でないボタン（見出し横・行アクション・ヘッダー・EmptyState / ErrorState）を全幅にしていないか
- [ ] `window.confirm()` を使っていないか
- [ ] 確認ダイアログが ESC・背景クリックで閉じないか
- [ ] 破壊的な確認ダイアログは 実行（左）／キャンセル（右）で、初期フォーカスがキャンセルか
- [ ] 通知・バナーが Card の中では枠なし、カードの外に単独で置くときだけトーンの枠色の `border` で囲まれているか
- [ ] トーストを操作完了の短い通知だけに使っているか（対応が必要なエラー・入力エラーをトーストで出していないか）
- [ ] 状態で切り替えるクラスを、既定のクラスに足さず置き換えているか（`border-input` と `border-destructive` が同居していないか）
- [ ] Tabs を同じものの別の面の切り替えだけに使い、選択中のタブを URL に持っているか。カード 1 枚だけのタブでカードの見出しを重ねていないか
- [ ] DescriptionList の空の値が「—」に揃っているか（「未設定」「なし」が混ざっていないか）。メール・URL に `break-all` があるか
- [ ] 操作が 1 つだけの箇所をメニューにしていないか。メニューの項目にアイコンが無く、破壊的な項目が区切り線の下にあるか
- [ ] メニュー・ポップオーバーを portal で body 直下に出しているか。Esc で閉じて開いたボタンにフォーカスが戻るか
- [ ] 押せる要素のカーソルが `pointer` か（`<button>` 以外に押す処理を持たせた要素に `cursor-pointer` があるか）

### フォーカス・タッチターゲット

- [ ] フォーカス表示が `focus-visible` で、`ring-2 ring-ring` のリングがあるか（`outline-none` だけで消していないか）
- [ ] エラー中（`aria-invalid="true"`）の入力欄のリングが `ring-destructive` になっているか
- [ ] 塗りのあるボタン類に `ring-offset-2` があるか（メニューの項目・タブ・スクロール容器の中の項目は `ring-inset`）
- [ ] 押せる要素が 44px 以上か（`min-h-11` / `size-11`。見た目を小さくする場合は疑似要素で当たり判定を広げているか）
- [ ] 入力欄の高さが `min-h-11` 以上か

### 重なり・影

- [ ] ナビ・メニュー・モーダル・確認ダイアログ・トーストの z-index が [layout.md](./layout.md) の表の値か（`z-50` 等に丸めていないか）
- [ ] 暗幕が layout.md の規定どおりか（生カラーの `bg-black/50` にしていないか）
- [ ] Card・パネル・固定ヘッダー・タブバーに shadow を足していないか（shadow は浮いているものだけ）
- [ ] 影が 2 段（メニュー・ポップオーバー `shadow-md` / モーダル・ダイアログ `shadow-lg`）のどちらかか
- [ ] メニュー・ポップオーバーに `border border-border` があるか（境界を影だけで示していないか）

### アイコン

- [ ] アイコンが 16 / 20 / 24px（`size-4` / `size-5` / `size-6`）のどれかか（空状態・エラー状態の 32px を除く）
- [ ] テキストと併記したアイコンが `aria-hidden="true"` か
- [ ] アイコンの色がトークン（`currentColor` かアイコン用トークン）で、半透明で近似していないか
- [ ] 新しいタブで開くリンクに、末尾の 16px アイコンと「新しいタブで開きます」の代替テキストがあるか
