import { afterEach, describe, expect, it } from "vitest";
import { lockBodyScroll } from "./scroll-lock.js";

const overflows = () => [document.body.style.overflow, document.documentElement.style.overflow];

describe("lockBodyScroll", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  });

  it("html と body を止め、解くと元の値に戻す", () => {
    document.body.style.overflow = "auto";
    const unlock = lockBodyScroll();
    expect(overflows()).toEqual(["hidden", "hidden"]);
    unlock();
    expect(overflows()).toEqual(["auto", ""]);
  });

  it.each([
    ["開いた順に閉じる", [0, 1]],
    ["開いた逆順に閉じる", [1, 0]],
  ])("入れ子で開閉しても最後の 1 つを解くまで止め、解いたら元に戻す（%s）", (_, order) => {
    const unlocks = [lockBodyScroll(), lockBodyScroll()];
    unlocks[order[0]]();
    expect(overflows()).toEqual(["hidden", "hidden"]);
    unlocks[order[1]]();
    expect(overflows()).toEqual(["", ""]);
  });

  it("同じ解く関数を 2 回呼んでも 1 回分だけ解く", () => {
    const outer = lockBodyScroll();
    const inner = lockBodyScroll();
    inner();
    inner();
    expect(overflows()).toEqual(["hidden", "hidden"]);
    outer();
    expect(overflows()).toEqual(["", ""]);
  });
});
