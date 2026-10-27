# デザインシステムの入口

このデザインシステムで画面・サービスを作るときの入口。
**部品と foundation（色・文字・余白・骨格）の定義は to B / to C 共通で 1 本。**
利用者層によって分かれるルールだけを §4 にまとめる。

## 1. 方針: 無駄な要素を置かない

**意味を持たない要素は置かない。迷ったら消す。** 要素が 1 つ増えるたびに、読む人は「これは何を伝えているのか」を考えさせられる。

| ❌ 置かない | 理由 |
|-------------|------|
| 写真の代わりの頭文字アバター（丸に「岡」） | 名前の 1 文字目を繰り返しているだけで、新しい情報が無い |
| 飾りだけのアイコン（見出しの頭の装飾、文字と同じことを言っているアイコン） | 読む量が増えるだけ。アイコンは位置と形で意味が通じるときに使う（[components.md](./components.md) §1-4） |
| 情報の無い副題・2 行目（名前の下の役職、見出しの下の言い換え） | 1 行目と同じことの言い換えか、その画面で使わない情報 |
| タブ名・パンくずと同じ語のカードの見出し | 直前に同じ語が見えている（[components.md](./components.md) の Tabs） |

- 足すときは「これを消したら何が分からなくなるか」を言えるものだけにする。言えなければ消す。
- 読み上げのために残すもの（`sr-only` の見出し等）は対象外。見た目から消しても、構造としては残す。

## 2. 読む順番

1. この文書の §4 で、作る画面が to B / to C のどちらかを決める
2. [layout.md](./layout.md) で骨格（ブレークポイント・地色・z-index・タッチターゲット）を決める
3. [color.md](./color.md) → [typography.md](./typography.md) → [spacing.md](./spacing.md) で値の選び方を押さえる
4. 部品を作る・使うときに [components.md](./components.md)、フォームは [forms.md](./forms.md)、
   メニューは [navigation.md](./navigation.md)
5. 文言を書くときに [writing.md](./writing.md)
6. 目指すアクセシビリティの水準と、部品をまたぐルール（キーボード・読み上げ・拡大）は [a11y.md](./a11y.md)

## 3. 共通の定義

| ドキュメント | 何が決まっているか |
|--------------|--------------------|
| [color.md](./color.md) | トークンカタログ、3 トーン体系、生カラー禁止、product layer での色の足し方 |
| [typography.md](./typography.md) | フォント、文字サイズと行間の用途マップ、サイズの下限、段落間と行長 |
| [spacing.md](./spacing.md) | 余白の 5 段、用途別の指定、角丸 |
| [layout.md](./layout.md) | ブレークポイント、テーブルのスマホ表示（カード表示）、最大幅、ページの地色、z-index、タッチターゲット、暗幕、横スクロール |
| [components.md](./components.md) | 部品ごとの仕様とルール、フォーカス表示、影、アイコン、レビュー用チェックリスト |
| [forms.md](./forms.md) | 1 項目の構造、必須の示し方、エラー表示、検証タイミング、送信、入力部品の選択（候補が多い選択の Combobox） |
| [navigation.md](./navigation.md) | メニューをオブジェクトで組む原則、権限とスコープ、to B のヘッダー（パンくず・ページ名・ユーザーメニュー）、スマホ向けナビ |
| [writing.md](./writing.md) | ラベル・説明文・エラー・ボタンの書き方、文体と表記の統一 |
| [a11y.md](./a11y.md) | 目標水準（JIS X 8341-3 AA 相当・WCAG 2.2 AA）、各 docs の a11y ルールの索引、ページの骨格・見出し・キーボード・通知・拡大などの横断ルール、確認方法 |

## 4. to B と to C で分かれるルール

部品と foundation は共通。**分かれるのは次の項目だけ。** ここに無い項目は to B / to C で同じルールを使う。

| 項目 | to B（業務画面） | to C（一般利用者向け） |
|------|------------------|------------------------|
| 主な利用環境（[layout.md](./layout.md)） | デスクトップ中心 | スマホ中心（モバイルファースト） |
| ページの地色（[layout.md](./layout.md) §3） | **原則カード型** | 画面の作り（カード型かどうか）で決める |
| ナビの骨格（[navigation.md](./navigation.md)） | サイドバー + 上の帯（パンくず + ページ名・通知・ユーザーメニュー。navigation.md §9） | ボトムタブバー + 下層ヘッダー（戻る + 画面名）。`lg` 以上はヘッダーのナビ |
| 文字の既定（[typography.md](./typography.md)） | 迷ったら `text-sm` | 本文は `text-base`、補助が `text-sm` |
| 行間の既定（[typography.md](./typography.md)） | 密な箇所は `leading-tight` | 文章は `leading-relaxed` |
| タッチターゲット（[layout.md](./layout.md)） | 44px。密な一覧の行アクションのみ 32px 可 | 44px。例外なし |
| 主要ボタンの色（[color.md](./color.md)） | `primary`（近黒）のまま | ブランド色を使う場合は `--primary` を上書き（手順は color.md） |
| リンクの visited（[color.md](./color.md)） | 付けない | 読み物の中だけ付ける（`interactive-visited`） |
| 情報の載せ方（[components.md](./components.md)） | テーブル中心（テーブルはカードに入れる） | カード・リスト中心 |
| ページの見出し `<h1>`（[components.md](./components.md) の PageHeader） | **上の帯**に置く（パンくずの後ろ。幅に関係なく見える）。本文に大きい見出しを置かず、本文の先頭は補足と操作の行だけ（navigation.md §9-1） | 本文の PageHeader。タブ直下は `sr-only`、下層ヘッダーで画面名を出す画面は `lg` 未満で `sr-only` |
| 下層画面の戻る導線（[navigation.md](./navigation.md)） | 上の帯のパンくず（URL の親子で固定）。`lg` 未満は帯の先頭の戻るボタン。本文に戻るリンクを置かない | 下層ヘッダーの戻る。`lg` 以上は本文の戻るリンク |

to B でも文章（説明文・お知らせ）は `leading-relaxed`、to C でも密な補足は `leading-tight` を使ってよい。
表の「既定」は迷ったときにどちらへ寄せるかを示す。

## 5. どちらでもないもの

- 1 つのプロダクトに管理画面と利用者向け画面の両方がある場合は、**画面ごとに §4 の表を当てはめる**。
  プロダクト単位で to B / to C を決めない。

## 6. 新しいサービスを始めるときの手順

- [ ] トークンを取り込む（[README のインストール節](../README.md#インストール)と、v3 / v4 の導入手順）
- [ ] 生カラーの lint（`design-system-lint`）を消費側の `package.json` と CI に入れる（[README](../README.md#生カラーの-lintdesign-system-lint)）
- [ ] フォントを配信する。Noto Sans JP の配信はプロダクトの責務（[typography.md](./typography.md)）
- [ ] ボトムタブバーを使うなら、プロダクト側の CSS で `--tabbar-height: 56px` と `--tabbar-offset` を定義する（core には無い。
  タブバー・本文の下余白・トーストの位置がこの変数を参照する。[navigation.md](./navigation.md) §12-3）
- [ ] 画面がカード型かどうかを決め、地色をレイアウト側で 1 回だけ指定する（[layout.md](./layout.md)）
- [ ] ブランド色を使うなら `--primary` 等を上書きし、コントラストを確認する（[color.md](./color.md)）
- [ ] ブランド色・アプリシェル・チャート色・ドメイン状態色など、core に無いものは product layer に置く
  （[color.md](./color.md)、[README](../README.md)）
- [ ] 見本ページ（スタイルガイド）を作り、色・文字・余白・部品を 1 画面に並べて確認できるようにする
- [ ] レビューでは [components.md](./components.md) と [a11y.md](./a11y.md) のレビュー用チェックリストを当てる
