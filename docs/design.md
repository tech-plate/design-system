# デザインシステムの入口

このデザインシステムで画面・サービスを作るときの入口。
**部品と foundation（色・文字・余白・骨格）の定義は to B / to C 共通で 1 本。**
利用者層によって分かれるルールだけを §3 にまとめる。

## 1. 読む順番

1. この文書の §3 で、作る画面が to B / to C のどちらかを決める
2. [layout.md](./layout.md) で骨格（ブレークポイント・地色・z-index・タッチターゲット）を決める
3. [color.md](./color.md) → [typography.md](./typography.md) → [spacing.md](./spacing.md) で値の選び方を押さえる
4. 部品を作る・使うときに [components.md](./components.md)、フォームは [forms.md](./forms.md)、
   メニューは [navigation.md](./navigation.md)
5. 文言を書くときに [writing.md](./writing.md)

## 2. 共通の定義

| ドキュメント | 何が決まっているか |
|--------------|--------------------|
| [color.md](./color.md) | トークンカタログ、3 トーン体系、生カラー禁止、product layer での色の足し方 |
| [typography.md](./typography.md) | フォント、文字サイズと行間の用途マップ、サイズの下限、段落間と行長 |
| [spacing.md](./spacing.md) | 余白の 4 段と縦長の画面用の大きい段、用途別の指定、角丸 |
| [layout.md](./layout.md) | ブレークポイント、最大幅、ページの地色、z-index、タッチターゲット、暗幕、横スクロール |
| [components.md](./components.md) | 部品ごとの仕様とルール、フォーカス表示、影、アイコン、レビュー用チェックリスト |
| [forms.md](./forms.md) | 1 項目の構造、必須の示し方、エラー表示、検証タイミング、送信 |
| [navigation.md](./navigation.md) | メニューをオブジェクトで組む原則、権限とスコープ、スマホ向けナビ |
| [writing.md](./writing.md) | ラベル・説明文・エラー・ボタンの書き方、文体と表記の統一 |

## 3. to B と to C で分かれるルール

部品と foundation は共通。**分かれるのは次の項目だけ。** ここに無い項目は to B / to C で同じルールを使う。

| 項目 | to B（業務画面） | to C（一般利用者向け） |
|------|------------------|------------------------|
| 主な利用環境（[layout.md](./layout.md)） | デスクトップ中心 | スマホ中心（モバイルファースト） |
| ナビの骨格（[navigation.md](./navigation.md)） | サイドバー + ヘッダー | ボトムタブバー + 下層ヘッダー（戻る + 画面名）。`lg` 以上はヘッダーのナビ |
| 文字の既定（[typography.md](./typography.md)） | 迷ったら `text-sm` | 本文は `text-base`、補助が `text-sm` |
| 行間の既定（[typography.md](./typography.md)） | 密な箇所は `leading-tight` | 文章は `leading-relaxed` |
| 余白（[spacing.md](./spacing.md)） | 4 段（〜24px） | 4 段 + 大きい段（48 / 64px）を縦長の画面で使用 |
| タッチターゲット（[layout.md](./layout.md)） | 44px。密な一覧の行アクションのみ 32px 可 | 44px。例外なし |
| 主要ボタンの色（[color.md](./color.md)） | `primary`（近黒）のまま | ブランド色を使う場合は `--primary` を上書き（手順は color.md） |
| リンクの visited（[color.md](./color.md)） | 付けない | 読み物の中だけ付ける（`interactive-visited`） |
| 情報の載せ方（[components.md](./components.md)） | テーブル中心 | カード・リスト中心 |

to B でも文章（説明文・お知らせ）は `leading-relaxed`、to C でも密な補足は `leading-tight` を使ってよい。
表の「既定」は迷ったときにどちらへ寄せるかを示す。

## 4. どちらでもないもの

- **ページの地色**は to B / to C ではなく、カード型の画面かどうかで決まる（[layout.md](./layout.md)）。
- 1 つのプロダクトに管理画面と利用者向け画面の両方がある場合は、**画面ごとに §3 の表を当てはめる**。
  プロダクト単位で to B / to C を決めない。

## 5. 新しいサービスを始めるときの手順

- [ ] トークンを取り込む（[README のインストール節](../README.md#インストール)と、v3 / v4 の導入手順）
- [ ] フォントを配信する。Noto Sans JP の配信はプロダクトの責務（[typography.md](./typography.md)）
- [ ] 画面がカード型かどうかを決め、地色をレイアウト側で 1 回だけ指定する（[layout.md](./layout.md)）
- [ ] ブランド色を使うなら `--primary` 等を上書きし、コントラストを確認する（[color.md](./color.md)）
- [ ] ブランド色・アプリシェル・チャート色・ドメイン状態色など、core に無いものは product layer に置く
  （[color.md](./color.md)、[README](../README.md)）
- [ ] 見本ページ（スタイルガイド）を作り、色・文字・余白・部品を 1 画面に並べて確認できるようにする
- [ ] レビューでは [components.md](./components.md) のレビュー用チェックリストを当てる
