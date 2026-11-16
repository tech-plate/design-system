import { type ReactNode } from "react";
/** 幅の広い表の枠（docs/layout.md §7-1） */
export type ScrollableTableContainerProps = {
    /** はみ出しているときの領域（role="region"）の名前。画面の中で表を見分けられる名前にする（例「経費の一覧」） */
    label: string;
    /**
     * 外枠に足すクラス。外周の罫線・地色・角丸はこの部品では付けないので、呼び出し側の入れ物で付ける
     * （中身は入れ物の角丸を受け継いで切り抜く）
     */
    className?: string;
    /** `<table>`（`<thead>` を持つもの） */
    children: ReactNode;
};
/** 案内を閉じたことを覚えるキー。閉じた人は分かっている人なので、そのブラウザでは以後出さない */
export declare const X_SCROLL_HINT_DISMISSED_KEY = "tech-plate-design-system:x-scroll-hint-dismissed";
/**
 * 幅の広い表の枠（docs/layout.md §7-1）。横は枠の中だけでスクロールし、縦は画面全体でスクロールする（表の中を縦にスクロールさせない）。
 *
 * - 横: 枠自身のスクロールバーは隠し、画面下端に貼り付く代わりのバーを出す（表の途中を見ていても横に動かせるように）。
 *   はみ出していないときは出さない。代わりのバーはマウス用の複製なので支援技術から隠す
 * - 縦: 見出し行（thead）は sticky が枠基準になり効かないため、見出し行に --x-head-shift を書いて position: relative の top でずらす。
 *   止める位置は上端の帯の下（--app-header-height。無ければ画面の上端）。z-20 で本文の固定列（sticky left-0）より上。
 *   isolate で中の z を枠の中だけで比べる（外のメニューやダイアログより上に出さない）
 * - 見出しのセルの上の罫線は外す（border-collapse の表でずらした見出し行に上の罫線があると、Chrome がその上端に下の行を透けて描く）
 * - はみ出しているときだけ、枠を名前つきの領域にして Tab で選べるようにし（矢印キーで横に動かせる）、隠れている側の端に影を、
 *   表の中の右に「Shift＋マウスホイールで横に移動」の案内を出す（× で閉じたら、そのブラウザでは以後出さない）
 * - 枠は relative にする。中の absolute の要素（sr-only の読み上げ用の文など）の基準が枠の外になると、枠の overflow で切られず、
 *   表の右端の分だけページ全体が横にスクロールする
 *
 * 枠の祖先に overflow-hidden / overflow-x-auto を置かない（下端の代わりのバーの sticky が画面に貼り付かなくなる）。
 */
export declare function ScrollableTableContainer({ label, className, children }: ScrollableTableContainerProps): import("react").JSX.Element;
