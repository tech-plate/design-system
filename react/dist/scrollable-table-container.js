"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSyncExternalStore } from "react";
import { cx, Icon, XIcon } from "./internal.js";
import { useStickyHeadInXScroller } from "./use-sticky-head-in-x-scroller.js";
const ROOT_CLASS = "relative isolate w-full min-w-0 rounded-[inherit] [&_thead]:relative [&_thead]:z-20 [&_thead]:top-[var(--x-head-shift,0px)] [&_thead_th]:border-t-0";
const SCROLLER_CLASS = "relative overflow-x-auto overflow-y-hidden rounded-[inherit] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
/**
 * 画面下端に貼り付く代わりのバー。macOS のオーバーレイ式だと高さ 0 の箱に描かれて見えないため、常に出る形に描く
 * （Chrome・Safari は ::-webkit-scrollbar、それ以外は scrollbar-color。Chrome 121+ は scrollbar-color を書くと
 * ::-webkit-scrollbar を無視するため、scrollbar-color は ::-webkit-scrollbar の無いブラウザだけに当てる）
 */
const PROXY_CLASS = "sticky bottom-0 z-20 overflow-x-auto overflow-y-hidden bg-card [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-3 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-muted [&::-webkit-scrollbar-thumb]:bg-icon-subtle not-supports-[selector(::-webkit-scrollbar)]:[scrollbar-width:thin] not-supports-[selector(::-webkit-scrollbar)]:[scrollbar-color:var(--color-icon-subtle)_var(--color-muted)]";
/** 隠れている側の端の影。左は固定した列があればその右から（--x-sticky-left は useStickyHeadInXScroller が測る） */
const SHADOW_SIDE_CLASS = {
    left: "left-[var(--x-sticky-left,0px)] bg-linear-to-r",
    right: "right-0 bg-linear-to-l",
};
const SIDES = ["left", "right"];
const SHADOW_CLASS = "pointer-events-none absolute inset-y-0 z-30 w-6 from-foreground/10 to-transparent";
/**
 * 案内を置く高さ。重ねる箱の上余白（表が画面に収まっているとき）と、表が縦に長いときに止まる位置の両方を
 * 見出し行（--x-head-height）の 0.5rem 下にそろえる。止まる位置は上端の帯（--app-header-height）の下。
 * Shift＋ホイールはマウスの操作なので、指で操作する端末（pointer: coarse）では出さない
 */
const HINT_BOX_CLASS = "pointer-events-none absolute inset-y-0 right-2 z-30 pt-[calc(var(--x-head-height,0px)+0.5rem)] pointer-coarse:hidden";
const HINT_CLASS = "pointer-events-auto sticky top-[calc(var(--app-header-height,0px)+var(--x-head-height,0px)+0.5rem)] flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card py-1 pr-1 pl-3 text-sm text-foreground shadow-md";
/** 案内の行に収めるため 32px。マウスの端末だけに出すもの（上の pointer-coarse:hidden） */
const HINT_CLOSE_CLASS = "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-icon hover:bg-foreground/5 hover:text-icon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
/** 案内を閉じたことを覚えるキー。閉じた人は分かっている人なので、そのブラウザでは以後出さない */
export const X_SCROLL_HINT_DISMISSED_KEY = "tech-plate-design-system:x-scroll-hint-dismissed";
// 閉じた状態は画面内の全部の表で共有する（片方で閉じたらもう片方も消す）。別タブで閉じたら storage イベントで追う。
// localStorage は描画のたびには読まず、表を出して最初の getSnapshot（閉じた人に 1 フレームも出さないよう、描く前に読む）と
// storage イベントのときだけ読む。localStorage が使えない環境（プライベートブラウズ等）では、表を出している間だけ閉じる
const hintListeners = new Set();
let hintDismissed;
function readHintDismissed() {
    try {
        return window.localStorage.getItem(X_SCROLL_HINT_DISMISSED_KEY) !== null;
    }
    catch {
        return false;
    }
}
function getHintDismissed() {
    hintDismissed ??= readHintDismissed();
    return hintDismissed;
}
function notifyHint() {
    for (const listener of hintListeners)
        listener();
}
function onStorage(event) {
    // localStorage.clear() は key が null で届く
    if (event.key !== null && event.key !== X_SCROLL_HINT_DISMISSED_KEY)
        return;
    hintDismissed = readHintDismissed();
    notifyHint();
}
function subscribeHint(listener) {
    if (hintListeners.size === 0)
        window.addEventListener("storage", onStorage);
    hintListeners.add(listener);
    return () => {
        hintListeners.delete(listener);
        if (hintListeners.size > 0)
            return;
        window.removeEventListener("storage", onStorage);
        // 表が 1 つも無い間の別タブの変化は追えないので、次に表を出すときに読み直す
        hintDismissed = undefined;
    };
}
function dismissHint() {
    hintDismissed = true;
    try {
        window.localStorage.setItem(X_SCROLL_HINT_DISMISSED_KEY, "1");
    }
    catch {
        // 覚えられなくても、このページを開いている間は閉じたまま
    }
    notifyHint();
}
/** ホイールの線が縦に流れるマウスの絵。出るたびに 3 回流して止める（animate-tp-wheel-scroll は tailwind-v4.css。reduced-motion では動かさない） */
function WheelMouseIcon() {
    return (_jsxs(Icon, { className: "size-5 shrink-0 text-icon-strong", children: [_jsx("rect", { x: "5", y: "2", width: "14", height: "20", rx: "7" }), _jsx("path", { d: "M12 6v4", className: "animate-tp-wheel-scroll motion-reduce:animate-none" })] }));
}
/** 「Shift＋マウスホイールで横に移動」の案内。閉じる（×）まで出し続ける。表の中の右端、見出し行の下に浮かせる */
function XScrollHint() {
    // サーバでは閉じた扱い（出さない）。この部品ははみ出しを測った後にしか描かないので食い違わない
    const dismissed = useSyncExternalStore(subscribeHint, getHintDismissed, () => true);
    if (dismissed)
        return null;
    return (_jsx("div", { className: HINT_BOX_CLASS, children: _jsxs("p", { "data-scroll-hint": "", className: HINT_CLASS, children: [_jsx(WheelMouseIcon, {}), "Shift\uFF0B\u30DE\u30A6\u30B9\u30DB\u30A4\u30FC\u30EB\u3067\u6A2A\u306B\u79FB\u52D5", _jsx("button", { type: "button", "aria-label": "\u6A2A\u30B9\u30AF\u30ED\u30FC\u30EB\u306E\u6848\u5185\u3092\u9589\u3058\u308B", className: HINT_CLOSE_CLASS, onClick: dismissHint, children: _jsx(XIcon, { className: "size-4" }) })] }) }));
}
/** 隠れている側の端にうっすら影を出す。見出し行（z-20）より上に重ね、押せる行の邪魔をしないよう pointer-events-none */
function XScrollShadows({ sides }) {
    return SIDES.map((side) => sides[side] ? (_jsx("div", { "aria-hidden": "true", "data-scroll-shadow": side, className: cx(SHADOW_CLASS, SHADOW_SIDE_CLASS[side]) }, side)) : null);
}
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
export function ScrollableTableContainer({ label, className, children }) {
    const { rootRef, scrollerRef, proxyRef, probeRef, hiddenSides } = useStickyHeadInXScroller();
    const overflowing = hiddenSides.left || hiddenSides.right;
    return (_jsxs("div", { ref: rootRef, className: cx(ROOT_CLASS, className), children: [_jsx("div", { ref: probeRef, "aria-hidden": "true", className: "pointer-events-none invisible absolute top-0 left-0 h-[var(--app-header-height,0px)] w-0" }), _jsxs("div", { className: "relative rounded-[inherit]", children: [_jsx("div", { ref: scrollerRef, role: overflowing ? "region" : undefined, "aria-label": overflowing ? label : undefined, tabIndex: overflowing ? 0 : undefined, className: SCROLLER_CLASS, children: children }), _jsx(XScrollShadows, { sides: hiddenSides }), overflowing && _jsx(XScrollHint, {})] }), _jsx("div", { ref: proxyRef, "aria-hidden": "true", tabIndex: -1, "data-x-scroll-proxy": "", className: overflowing ? PROXY_CLASS : "hidden", children: _jsx("div", { className: "h-px" }) })] }));
}
