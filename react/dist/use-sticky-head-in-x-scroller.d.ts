/** 横にはみ出して隠れている側。左右どちらも false なら、はみ出していない */
export type HiddenSides = {
    left: boolean;
    right: boolean;
};
/**
 * 見出し行をずらす量(px)。見出しの本来の上端が貼り付け位置(offset)より上に出た分だけずらし、
 * 見出しの下端が表(見出しの親)の下端を越えない範囲に収める。
 * 相対位置のずらしは見出しの矩形だけを動かすので、今のずらし量を引けば本来の上端になる。
 */
export declare function headShift({ headTop, headHeight, currentShift, containerBottom, offset, }: {
    headTop: number;
    headHeight: number;
    currentShift: number;
    containerBottom: number;
    offset: number;
}): number;
/** 横のどちら側が隠れているか。端数の幅で 1px 未満のはみ出しが出ても「続きがある」とは言わない */
export declare function hiddenSides({ scrollLeft, clientWidth, scrollWidth, }: {
    scrollLeft: number;
    clientWidth: number;
    scrollWidth: number;
}): HiddenSides;
/**
 * 横スクロールの枠(overflow-x: auto)の中の表の見出し行(thead)を、画面(文書)の縦スクロールに貼り付ける(docs/layout.md §7-1)。
 *
 * 枠の中では position: sticky の top が枠基準になり、画面のスクロールに効かない。そこで
 * - 見出し行は元の位置のまま headShift の分だけ縦にずらす。貼り付け位置は probe の高さ(--app-header-height)で読む
 *   (CSS 変数は rem や calc で書かれ、getComputedStyle では px に解決されないため)。
 *   ずらしは position: relative の top で行う。transform だと border-collapse の表で罫線や背景の描画がずれる
 * - 枠の横スクロールバーは隠し、画面下端に貼り付けた代わりのバー(proxy)と scrollLeft を双方向に同期する
 *
 * 縦スクロールのたびに測るのは見出しと表の位置だけ、横スクロールのたびは scrollLeft だけ。幅・貼り付け位置・見出しの高さは
 * 大きさが変わったとき(ResizeObserver。画面の幅の変化も枠の大きさの変化として届く)だけ測る。
 * React の state は変えず CSS 変数を要素へ直接書き、値が変わったときだけ書く
 * (隠れている側だけは代わりのバー・影・案内の出し入れと枠のフォーカス可否に使うので state。変わったときだけ更新する)。
 */
export declare function useStickyHeadInXScroller(): {
    rootRef: import("react").RefObject<HTMLDivElement | null>;
    scrollerRef: import("react").RefObject<HTMLDivElement | null>;
    proxyRef: import("react").RefObject<HTMLDivElement | null>;
    probeRef: import("react").RefObject<HTMLDivElement | null>;
    hiddenSides: HiddenSides;
};
