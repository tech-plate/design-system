/**
 * 横は表の枠の中だけでスクロールし、縦は画面全体でスクロールする（docs/layout.md §7-1）ことを固定する。
 * 縦の内部スクロール（max-height）に戻ると二重スクロールになり、枠を w-fit に戻すと画面ごと右へはみ出す。
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollableTableContainer, X_SCROLL_HINT_DISMISSED_KEY } from "./scrollable-table-container.js";
import { headShift, hiddenSides } from "./use-sticky-head-in-x-scroller.js";

/** overflow-y-hidden 等に含まれる "hidden" と区別する */
const HIDDEN_CLASS = /(^|\s)hidden(\s|$)/;
const CLOSE_HINT = 'button[aria-label="横スクロールの案内を閉じる"]';

function rect(partial: Partial<DOMRect>): DOMRect {
  return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}), ...partial };
}

function setBox(el: Element, { scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number }) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
}

function renderContainer({
  className,
  label = "経費の一覧",
  stickyFirstColumn = false,
}: { className?: string; label?: string; stickyFirstColumn?: boolean } = {}) {
  const { container } = render(
    <ScrollableTableContainer label={label} className={className}>
      <table>
        <thead>
          <tr>
            <th style={stickyFirstColumn ? { position: "sticky", left: 0 } : undefined}>見出し</th>
            <th>見出し 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>本文</td>
            <td>本文 2</td>
          </tr>
        </tbody>
      </table>
    </ScrollableTableContainer>,
  );
  const root = container.firstChild as HTMLElement;
  const [probe, scrollerFrame, proxy] = Array.from(root.children) as HTMLElement[];
  const scroller = scrollerFrame!.firstElementChild as HTMLElement;
  return {
    root,
    probe: probe!,
    scroller,
    proxy: proxy!,
    thead: root.querySelector("thead")!,
    table: root.querySelector("table")!,
  };
}

/**
 * 大きさの変化（ResizeObserver）を受けて測り直させる。jsdom には ResizeObserver が無いので、
 * 作られた観測者を覚える stub を置き、そのコールバックを呼ぶ（rAF は同期で実行するよう差し替えている）
 */
let resizeCallbacks: Set<() => void>;
let observed: Element[];
class ResizeObserverStub {
  constructor(callback: () => void) {
    resizeCallbacks.add(callback);
  }
  observe(el: Element) {
    observed.push(el);
  }
  unobserve() {}
  disconnect() {}
}
function remeasure() {
  act(() => {
    for (const callback of Array.from(resizeCallbacks)) callback();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  resizeCallbacks = new Set();
  observed = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  // 0 を返すのは、同期実行のあとに「予約済み」のまま残らないように
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("headShift / hiddenSides", () => {
  it("見出しの本来の上端が止める位置より上に出た分だけずらし、表の下端を越えない", () => {
    const base = { headHeight: 40, currentShift: 0, containerBottom: 1000, offset: 64 };
    expect(headShift({ ...base, headTop: 200 })).toBe(0);
    expect(headShift({ ...base, headTop: 20 })).toBe(44);
    // 今のずらし量を引いて本来の上端を出す
    expect(headShift({ ...base, headTop: 20 + 44, currentShift: 44 })).toBe(44);
    expect(headShift({ ...base, headTop: -1000, containerBottom: 100 })).toBe(1060);
  });

  it("1px 未満のはみ出しは隠れているとみなさない", () => {
    expect(hiddenSides({ scrollLeft: 0, clientWidth: 500, scrollWidth: 500.5 })).toEqual({ left: false, right: false });
    expect(hiddenSides({ scrollLeft: 0, clientWidth: 500, scrollWidth: 1500 })).toEqual({ left: false, right: true });
    expect(hiddenSides({ scrollLeft: 1000, clientWidth: 500, scrollWidth: 1500 })).toEqual({ left: true, right: false });
  });
});

describe("ScrollableTableContainer: 枠", () => {
  it("枠は親の幅に収め（画面をはみ出さない）、横だけ枠の中でスクロールする", () => {
    const { root, scroller } = renderContainer();
    expect(root.className).toContain("w-full");
    expect(root.className).toContain("min-w-0");
    expect(root.className).toContain("isolate");
    expect(root.className).not.toContain("w-fit");
    expect(scroller.className).toContain("overflow-x-auto");
    expect(scroller.className).toContain("overflow-y-hidden");
    // 中の absolute の要素（sr-only の文など）の基準を枠にし、枠の外へはみ出してページ全体を横にスクロールさせない
    expect(scroller.className).toMatch(/(^| )relative( |$)/);
    expect(scroller.className).not.toMatch(/max-h-/);
  });

  it("外周の罫線・地色は付けず、呼び出し側のクラスを足せる。角丸は入れ物から受け継ぐ", () => {
    const plain = renderContainer();
    expect(plain.root.className).not.toMatch(/(^| )(border|bg-)/);
    expect(plain.root.className).toContain("rounded-[inherit]");
    cleanup();
    const { root } = renderContainer({ className: "rounded-md border border-border" });
    expect(root.className).toContain("rounded-md border border-border");
  });

  it("見出し行は --x-head-shift の relative top で動かし、本文の固定列より上に描く。見出しのセルの上の罫線を外す", () => {
    const { root } = renderContainer();
    expect(root.className).toContain("[&_thead]:relative");
    expect(root.className).toContain("[&_thead]:top-[var(--x-head-shift,0px)]");
    expect(root.className).toContain("[&_thead]:z-20");
    expect(root.className).toContain("[&_thead_th]:border-t-0");
    expect(root.className).not.toContain("[&_thead]:sticky");
    expect(root.className).not.toMatch(/translate/);
  });

  it("見出し行を止める位置は上端の帯の高さ（--app-header-height、無ければ 0）で読む", () => {
    const { probe } = renderContainer();
    expect(probe.className).toContain("h-[var(--app-header-height,0px)]");
    expect(probe.getAttribute("aria-hidden")).toBe("true");
  });

  it("大きさを見張るのは枠・表まわりだけ", () => {
    const { root, probe, scroller, table } = renderContainer();
    expect(new Set(observed)).toEqual(new Set([root, probe, scroller, table]));
  });
});

describe("ScrollableTableContainer: 見出し行を画面の縦スクロールに貼り付ける", () => {
  it("止める位置より上へ流れた分だけ下にずらし、表の下端で止める。ずらし量は見出し行に書く", () => {
    const { root, probe, thead, table } = renderContainer();
    vi.spyOn(probe, "getBoundingClientRect").mockReturnValue(rect({ height: 64 }));
    const theadRect = vi.spyOn(thead, "getBoundingClientRect");
    const tableRect = vi.spyOn(table, "getBoundingClientRect").mockReturnValue(rect({ bottom: 1000 }));

    theadRect.mockReturnValue(rect({ top: 200, height: 40 }));
    remeasure();
    expect(thead.style.getPropertyValue("--x-head-shift")).toBe("0px");

    // 画面の縦スクロールで追う
    theadRect.mockReturnValue(rect({ top: 20, height: 40 }));
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(thead.style.getPropertyValue("--x-head-shift")).toBe("44px");

    // 返る位置はずらした後（本来の上端 + 44px）。本来の上端 -1000・表の下端 100 なら 1060px で止める
    tableRect.mockReturnValue(rect({ bottom: 100 }));
    theadRect.mockReturnValue(rect({ top: -1000 + 44, height: 40 }));
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(thead.style.getPropertyValue("--x-head-shift")).toBe("1060px");
    expect(root.style.getPropertyValue("--x-head-shift")).toBe("");
  });

  it("見出し行が差し替わったら、新しい見出し行にずらし量を書く", async () => {
    const { probe, scroller, table } = renderContainer();
    vi.spyOn(probe, "getBoundingClientRect").mockReturnValue(rect({ height: 64 }));
    const nextHead = document.createElement("thead");
    nextHead.innerHTML = "<tr><th>新しい見出し</th></tr>";
    vi.spyOn(nextHead, "getBoundingClientRect").mockReturnValue(rect({ top: 0, height: 40 }));
    vi.spyOn(table, "getBoundingClientRect").mockReturnValue(rect({ bottom: 1000 }));
    table.replaceChild(nextHead, table.querySelector("thead")!);
    // MutationObserver はマイクロタスクで呼ばれる。観測先を付け直した後の測り直しは ResizeObserver から来る
    await act(() => Promise.resolve());
    remeasure();
    expect(scroller.querySelector("thead")).toBe(nextHead);
    expect(nextHead.style.getPropertyValue("--x-head-shift")).toBe("64px");
  });

  it("見出し行の高さと、左に固定した列の右端を外枠に書く（案内・影の位置に使う）", () => {
    const { root, scroller, thead } = renderContainer({ stickyFirstColumn: true });
    const firstCell = thead.querySelector("th")!;
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(rect({ left: 100 }));
    vi.spyOn(firstCell, "getBoundingClientRect").mockReturnValue(rect({ right: 260 }));
    vi.spyOn(thead, "getBoundingClientRect").mockReturnValue(rect({ height: 48 }));
    remeasure();
    expect(root.style.getPropertyValue("--x-head-height")).toBe("48px");
    expect(root.style.getPropertyValue("--x-sticky-left")).toBe("160px");
  });
});

describe("ScrollableTableContainer: 横のはみ出し", () => {
  it("はみ出していないときは下端のバーを出さず、枠も領域にしない（Tab で選べない）", () => {
    const { scroller, proxy } = renderContainer();
    setBox(scroller, { scrollWidth: 500, clientWidth: 500 });
    remeasure();
    expect(proxy.className).toMatch(HIDDEN_CLASS);
    expect(scroller.getAttribute("tabindex")).toBeNull();
    expect(scroller.getAttribute("role")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("はみ出すときは画面の下端に代わりのバーを出し、枠を名前つきの領域にして Tab で選べるようにする", () => {
    const { scroller, proxy } = renderContainer({ label: "経費の一覧" });
    setBox(scroller, { scrollWidth: 1500, clientWidth: 500 });
    remeasure();
    expect(screen.getByRole("region", { name: "経費の一覧" })).toBe(scroller);
    expect(scroller.getAttribute("tabindex")).toBe("0");
    expect(proxy.className).not.toMatch(HIDDEN_CLASS);
    expect(proxy.className).toContain("sticky");
    expect(proxy.className).toContain("bottom-0");
    expect(proxy.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.getAttribute("tabindex")).toBe("-1");
    // 代わりのバーの中身の幅は、枠の中身の幅にそろえる
    expect((proxy.firstElementChild as HTMLElement).style.width).toBe("1500px");
  });

  it("画面の幅が変わってはみ出さなくなったら、領域と代わりのバーを外す", () => {
    const { scroller, proxy } = renderContainer();
    setBox(scroller, { scrollWidth: 1500, clientWidth: 500 });
    remeasure();
    expect(screen.getByRole("region")).toBeTruthy();
    setBox(scroller, { scrollWidth: 500, clientWidth: 500 });
    remeasure();
    expect(screen.queryByRole("region")).toBeNull();
    expect(proxy.className).toMatch(HIDDEN_CLASS);
  });

  it("枠と下端のバーの横スクロール量を双方向にそろえる", () => {
    const { scroller, proxy } = renderContainer();
    scroller.scrollLeft = 120;
    fireEvent.scroll(scroller);
    expect(proxy.scrollLeft).toBe(120);
    proxy.scrollLeft = 40;
    fireEvent.scroll(proxy);
    expect(scroller.scrollLeft).toBe(40);
  });

  it("隠れている側の端にだけ影を出す。左の影は固定列の右から", () => {
    const { root, scroller } = renderContainer();
    const shadows = () =>
      Array.from(root.querySelectorAll("[data-scroll-shadow]")).map((el) => el.getAttribute("data-scroll-shadow"));
    setBox(scroller, { scrollWidth: 1500, clientWidth: 500 });
    remeasure();
    expect(shadows()).toEqual(["right"]);

    scroller.scrollLeft = 400;
    fireEvent.scroll(scroller);
    expect(shadows()).toEqual(["left", "right"]);
    expect(root.querySelector('[data-scroll-shadow="left"]')!.className).toContain("left-[var(--x-sticky-left,0px)]");

    scroller.scrollLeft = 1000;
    fireEvent.scroll(scroller);
    expect(shadows()).toEqual(["left"]);
  });
});

describe("ScrollableTableContainer: Shift＋マウスホイールの案内", () => {
  const hint = (root: HTMLElement) => root.querySelector("[data-scroll-hint]");
  const overflow = (scroller: HTMLElement) => {
    setBox(scroller, { scrollWidth: 1500, clientWidth: 500 });
    remeasure();
  };

  it("はみ出している間は出し続け、横に動かしても消さない。指で操作する端末では出さない", () => {
    const { root, scroller } = renderContainer();
    setBox(scroller, { scrollWidth: 500, clientWidth: 500 });
    remeasure();
    expect(hint(root)).toBeNull();

    overflow(scroller);
    expect(hint(root)?.textContent).toContain("Shift＋マウスホイールで横に移動");
    expect(hint(root)!.parentElement!.className).toContain("pointer-coarse:hidden");

    scroller.scrollLeft = 100;
    fireEvent.scroll(scroller);
    expect(hint(root)).not.toBeNull();
  });

  it("ホイールの線の動きは reduced-motion では止める", () => {
    const { root, scroller } = renderContainer();
    overflow(scroller);
    const line = hint(root)!.querySelector("path")!;
    expect(line.getAttribute("class")).toContain("animate-wheel-scroll");
    expect(line.getAttribute("class")).toContain("motion-reduce:animate-none");
  });

  it("× で閉じたら localStorage に覚え、そのブラウザでは以後出さない", () => {
    const first = renderContainer();
    overflow(first.scroller);
    fireEvent.click(first.root.querySelector(CLOSE_HINT)!);
    expect(hint(first.root)).toBeNull();
    expect(window.localStorage.getItem(X_SCROLL_HINT_DISMISSED_KEY)).not.toBeNull();
    cleanup();

    const second = renderContainer();
    overflow(second.scroller);
    expect(hint(second.root)).toBeNull();
  });

  it("同じ画面の表が 2 つあっても、片方で閉じたらもう片方の案内も消す", () => {
    const first = renderContainer();
    const second = renderContainer();
    overflow(first.scroller);
    overflow(second.scroller);
    expect(hint(second.root)).not.toBeNull();
    fireEvent.click(first.root.querySelector(CLOSE_HINT)!);
    expect(hint(second.root)).toBeNull();
  });

  it("別のタブで閉じたら（storage イベント）この画面でも消す", () => {
    const { root, scroller } = renderContainer();
    overflow(scroller);
    expect(hint(root)).not.toBeNull();
    window.localStorage.setItem(X_SCROLL_HINT_DISMISSED_KEY, "1");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: X_SCROLL_HINT_DISMISSED_KEY }));
    });
    expect(hint(root)).toBeNull();
  });

  it("localStorage が使えなくても閉じられる（開いている間だけ覚える）", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { root, scroller } = renderContainer();
    overflow(scroller);
    fireEvent.click(root.querySelector(CLOSE_HINT)!);
    expect(hint(root)).toBeNull();
  });
});
