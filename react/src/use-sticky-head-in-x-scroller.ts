import { useEffect, useRef, useState } from "react";

/** 見出し行を縦にずらす量(px)。見出し行(thead)自身に書く。表全体に書くと、継いだ変数の変化で毎フレーム表全体を再計算する */
const X_HEAD_SHIFT_VAR = "--x-head-shift";
/** 見出し行の高さ(px)。横スクロールの案内を見出しの下に置くのに使う(見出しが 2 段の表があるため) */
const X_HEAD_HEIGHT_VAR = "--x-head-height";
/** 左に固定した列の右端(枠の左端から、px)。左の端の影を固定列の右から出すのに使う */
const X_STICKY_LEFT_VAR = "--x-sticky-left";

/** 横にはみ出して隠れている側。左右どちらも false なら、はみ出していない */
export type HiddenSides = { left: boolean; right: boolean };

/**
 * 見出し行をずらす量(px)。見出しの本来の上端が貼り付け位置(offset)より上に出た分だけずらし、
 * 見出しの下端が表(見出しの親)の下端を越えない範囲に収める。
 * 相対位置のずらしは見出しの矩形だけを動かすので、今のずらし量を引けば本来の上端になる。
 */
export function headShift({
  headTop,
  headHeight,
  currentShift,
  containerBottom,
  offset,
}: {
  headTop: number;
  headHeight: number;
  currentShift: number;
  containerBottom: number;
  offset: number;
}): number {
  const naturalTop = headTop - currentShift;
  const max = Math.max(0, containerBottom - naturalTop - headHeight);
  return Math.min(Math.max(offset - naturalTop, 0), max);
}

/** 横のどちら側が隠れているか。端数の幅で 1px 未満のはみ出しが出ても「続きがある」とは言わない */
export function hiddenSides({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}): HiddenSides {
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
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [sides, setSides] = useState<HiddenSides>({ left: false, right: false });

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollerRef.current;
    const proxy = proxyRef.current;
    const proxyContent = proxy?.firstElementChild as HTMLElement | null | undefined;
    const probe = probeRef.current;
    if (!root || !scroller || !proxy || !proxyContent || !probe) return;

    let frame = 0;
    let shift = 0;
    let offset = 0;
    let head: HTMLElement | null = null;
    // 見出し行の 1 行目の左固定セル(position: sticky)。getComputedStyle は重いので見出しが替わったときだけ調べる
    let stickyCells: Element[] = [];

    const updateShift = () => {
      frame = 0;
      const container = head?.parentElement;
      if (!head || !container) return;
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
      if (frame === 0) frame = requestAnimationFrame(updateShift);
    };

    let scrollWidth = 0;
    let clientWidth = 0;
    let current: HiddenSides = { left: false, right: false };
    const updateHiddenSides = () => {
      const next = hiddenSides({ scrollLeft: scroller.scrollLeft, clientWidth, scrollWidth });
      if (next.left === current.left && next.right === current.right) return;
      current = next;
      setSides(next);
    };

    // 書いた値を覚え、変わったときだけ書く(style の書き込みは再計算を起こす)
    const written = new Map<string, string>();
    const writeRootVar = (name: string, value: string) => {
      if (written.get(name) === value) return;
      written.set(name, value);
      root.style.setProperty(name, value);
    };

    // 固定は左から詰めて並べる前提で、いちばん右の固定セルの右端を採る
    const writeHeadMetrics = () => {
      if (!head) return;
      const scrollerLeft = scroller.getBoundingClientRect().left;
      let stickyRight = 0;
      for (const cell of stickyCells) {
        stickyRight = Math.max(stickyRight, cell.getBoundingClientRect().right - scrollerLeft);
      }
      writeRootVar(X_HEAD_HEIGHT_VAR, `${head.getBoundingClientRect().height}px`);
      writeRootVar(X_STICKY_LEFT_VAR, `${stickyRight}px`);
    };

    const measure = () => {
      offset = probe.getBoundingClientRect().height;
      scrollWidth = scroller.scrollWidth;
      clientWidth = scroller.clientWidth;
      proxyContent.style.width = `${scrollWidth}px`;
      writeHeadMetrics();
      updateHiddenSides();
      scheduleShift();
    };

    // 中身の差し替え(読み込み中の表示 ⇄ 表、行の増減)で見出しが入れ替わったときだけ観測先を付け直す。
    // 観測するのは枠と表まわりだけ(ページ全体を見張らない)
    const resizeObserver = new ResizeObserver(measure);
    const observeTargets = () => {
      const nextHead = scroller.querySelector<HTMLElement>("thead");
      if (nextHead === head && head !== null) return;
      head = nextHead;
      // 新しい見出し行にはずらす量がまだ書かれていない
      shift = 0;
      head?.style.setProperty(X_HEAD_SHIFT_VAR, "0px");
      stickyCells = Array.from(head?.querySelector("tr")?.children ?? []).filter(
        (cell) => getComputedStyle(cell).position === "sticky",
      );
      resizeObserver.disconnect();
      for (const el of [root, probe, scroller, scroller.firstElementChild, head?.parentElement]) {
        if (el) resizeObserver.observe(el);
      }
    };
    observeTargets();
    const mutationObserver = new MutationObserver(observeTargets);
    mutationObserver.observe(scroller, { childList: true, subtree: true });

    // 同じ値の代入では scroll が発火しないので、互いに呼び合って止まらなくなることはない
    const syncScrollLeft = (from: HTMLElement, to: HTMLElement) => () => {
      if (Math.abs(to.scrollLeft - from.scrollLeft) >= 1) to.scrollLeft = from.scrollLeft;
    };
    const syncFromScroller = syncScrollLeft(scroller, proxy);
    const onScrollerScroll = () => {
      updateHiddenSides();
      syncFromScroller();
    };
    const syncFromProxy = syncScrollLeft(proxy, scroller);
    scroller.addEventListener("scroll", onScrollerScroll, { passive: true });
    proxy.addEventListener("scroll", syncFromProxy, { passive: true });
    window.addEventListener("scroll", scheduleShift, { passive: true });
    measure();

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      scroller.removeEventListener("scroll", onScrollerScroll);
      proxy.removeEventListener("scroll", syncFromProxy);
      window.removeEventListener("scroll", scheduleShift);
    };
  }, []);

  return { rootRef, scrollerRef, proxyRef, probeRef, hiddenSides: sides };
}
