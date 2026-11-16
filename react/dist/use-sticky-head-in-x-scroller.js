import { useEffect, useRef, useState } from "react";
/** 見出し行を縦にずらす量(px)。見出し行(thead)自身に書く。表全体に書くと、継いだ変数の変化で毎フレーム表全体を再計算する */
const X_HEAD_SHIFT_VAR = "--x-head-shift";
/** 見出し行の高さ(px)。横スクロールの案内を見出しの下に置くのに使う(見出しが 2 段の表があるため) */
const X_HEAD_HEIGHT_VAR = "--x-head-height";
/** 左に固定した列の右端(枠の左端から、px)。左の端の影を固定列の右から出すのに使う */
const X_STICKY_LEFT_VAR = "--x-sticky-left";
/**
 * 見出し行をずらす量(px)。見出しの本来の上端が貼り付け位置(offset)より上に出た分だけずらし、
 * 見出しの下端が表(見出しの親)の下端を越えない範囲に収める。
 * 相対位置のずらしは見出しの矩形だけを動かすので、今のずらし量を引けば本来の上端になる。
 */
export function headShift({ headTop, headHeight, currentShift, containerBottom, offset, }) {
    const naturalTop = headTop - currentShift;
    const max = Math.max(0, containerBottom - naturalTop - headHeight);
    return Math.min(Math.max(offset - naturalTop, 0), max);
}
/** 横のどちら側が隠れているか。端数の幅で 1px 未満のはみ出しが出ても「続きがある」とは言わない */
export function hiddenSides({ scrollLeft, clientWidth, scrollWidth, }) {
    return { left: scrollLeft >= 1, right: scrollLeft + clientWidth < scrollWidth - 1 };
}
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
export function useStickyHeadInXScroller() {
    const rootRef = useRef(null);
    const scrollerRef = useRef(null);
    const proxyRef = useRef(null);
    const probeRef = useRef(null);
    const [sides, setSides] = useState({ left: false, right: false });
    useEffect(() => {
        const root = rootRef.current;
        const scroller = scrollerRef.current;
        const proxy = proxyRef.current;
        const proxyContent = proxy?.firstElementChild;
        const probe = probeRef.current;
        if (!root || !scroller || !proxy || !proxyContent || !probe)
            return;
        let frame = 0;
        let shift = 0;
        let offset = 0;
        let scrollWidth = 0;
        let clientWidth = 0;
        let table = null;
        let head = null;
        // 見出し行の 1 行目の左固定セル(position: sticky)。getComputedStyle は重いので見出しが替わったときだけ調べる
        let stickyCells = [];
        const updateShift = () => {
            frame = 0;
            const container = head?.parentElement;
            if (!head || !container)
                return;
            const headRect = head.getBoundingClientRect();
            const next = headShift({
                headTop: headRect.top,
                headHeight: headRect.height,
                currentShift: shift,
                containerBottom: container.getBoundingClientRect().bottom,
                offset,
            });
            if (next !== shift) {
                shift = next;
                head.style.setProperty(X_HEAD_SHIFT_VAR, `${next}px`);
            }
        };
        const scheduleShift = () => {
            if (frame === 0)
                frame = requestAnimationFrame(updateShift);
        };
        // 隠れ側が変わらなければ前の値を返し、描き直さない
        const updateHiddenSides = (scrollLeft) => {
            const next = hiddenSides({ scrollLeft, clientWidth, scrollWidth });
            setSides((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
        };
        // 書いた値を覚え、変わったときだけ書く(style の書き込みは再計算を起こす)
        const written = new Map();
        const writeRootVar = (name, value) => {
            if (written.get(name) === value)
                return;
            written.set(name, value);
            root.style.setProperty(name, value);
        };
        // 読み取りを先にまとめ、書き込みは後にまとめる(読み書きを交互にすると、そのたびに配置を計算し直す)
        const measure = () => {
            const nextOffset = probe.getBoundingClientRect().height;
            const nextScrollWidth = scroller.scrollWidth;
            const nextClientWidth = scroller.clientWidth;
            const scrollLeft = scroller.scrollLeft;
            const headHeight = head?.getBoundingClientRect().height;
            // 固定は左から詰めて並べる前提で、いちばん右の固定セルの右端を採る
            let stickyRight = 0;
            if (stickyCells.length > 0) {
                const scrollerLeft = scroller.getBoundingClientRect().left;
                for (const cell of stickyCells) {
                    stickyRight = Math.max(stickyRight, cell.getBoundingClientRect().right - scrollerLeft);
                }
            }
            offset = nextOffset;
            scrollWidth = nextScrollWidth;
            clientWidth = nextClientWidth;
            proxyContent.style.width = `${nextScrollWidth}px`;
            if (headHeight !== undefined) {
                writeRootVar(X_HEAD_HEIGHT_VAR, `${headHeight}px`);
                writeRootVar(X_STICKY_LEFT_VAR, `${stickyRight}px`);
            }
            updateHiddenSides(scrollLeft);
            scheduleShift();
        };
        // 大きさを見張るのは貼り付け位置の箱・枠・表だけ(外枠はこの 3 つで足りる)。画面の幅の変化も枠の大きさの変化として届く
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(probe);
        resizeObserver.observe(scroller);
        // 表・見出し行の差し替え(読み込み中の表示 ⇄ 表、見出しの作り直し)は、枠と表の直下の子の出し入れだけで見張る。
        // 行の増減は表の大きさの変化として ResizeObserver に届く
        let mutationObserver;
        const watchChildren = () => {
            if (!mutationObserver)
                return;
            mutationObserver.disconnect();
            mutationObserver.observe(scroller, { childList: true });
            if (table)
                mutationObserver.observe(table, { childList: true });
        };
        const observeTargets = () => {
            const nextTable = scroller.querySelector("table");
            if (nextTable !== table) {
                if (table)
                    resizeObserver.unobserve(table);
                table = nextTable;
                if (table)
                    resizeObserver.observe(table);
                watchChildren();
            }
            const nextHead = table?.querySelector("thead") ?? null;
            if (nextHead === head)
                return;
            head = nextHead;
            // 新しい見出し行にはずらす量がまだ書かれていない
            shift = 0;
            head?.style.setProperty(X_HEAD_SHIFT_VAR, "0px");
            stickyCells = Array.from(head?.querySelector("tr")?.children ?? []).filter((cell) => getComputedStyle(cell).position === "sticky");
        };
        observeTargets();
        mutationObserver = new MutationObserver(() => {
            observeTargets();
            measure();
        });
        watchChildren();
        // 同じ値の代入では scroll が発火しないので、互いに呼び合って止まらなくなることはない
        const syncScrollLeft = (from, to) => () => {
            if (Math.abs(to.scrollLeft - from.scrollLeft) >= 1)
                to.scrollLeft = from.scrollLeft;
        };
        const syncFromScroller = syncScrollLeft(scroller, proxy);
        const onScrollerScroll = () => {
            updateHiddenSides(scroller.scrollLeft);
            syncFromScroller();
        };
        const syncFromProxy = syncScrollLeft(proxy, scroller);
        scroller.addEventListener("scroll", onScrollerScroll, { passive: true });
        proxy.addEventListener("scroll", syncFromProxy, { passive: true });
        window.addEventListener("scroll", scheduleShift, { passive: true });
        measure();
        return () => {
            if (frame !== 0)
                cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            mutationObserver?.disconnect();
            scroller.removeEventListener("scroll", onScrollerScroll);
            proxy.removeEventListener("scroll", syncFromProxy);
            window.removeEventListener("scroll", scheduleShift);
        };
    }, []);
    return { rootRef, scrollerRef, proxyRef, probeRef, hiddenSides: sides };
}
