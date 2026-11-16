// 背景のスクロール停止（docs/components.md §7-2）。部品をまたいで 1 つのカウンタを持つ参照カウント。
// 部品ごとにカウンタを持つと、入れ子で開閉したとき（Combobox のシートの上に確認ダイアログなど）に
// 片方が先に元へ戻して早く外れる、または保存した "hidden" を書き戻して残る。
// 0 → 1 の 1 回だけ元の値を保存して止め、1 → 0 の 1 回だけ戻すので、閉じる順に関係なく壊れない。
//
// html にも掛ける: html に overflow（`overflow-x: clip` など）が付いていると、body の overflow が
// ビューポートへ伝わらず（伝わるのは html が visible のときだけ）、body だけでは背面が動く。

let lockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";

/** 背景のスクロールを止め、解く関数を返す。解く関数は何度呼んでも 1 回分だけ解く */
export function lockBodyScroll(): () => void {
  if (lockCount++ === 0) {
    const { body, documentElement: html } = document;
    savedBodyOverflow = body.style.overflow;
    savedHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0) {
      document.body.style.overflow = savedBodyOverflow;
      document.documentElement.style.overflow = savedHtmlOverflow;
    }
  };
}
