import { describe, expect, it } from "vitest";
import { isExactMatch, matchRange, matchRangeNormalized, matchesOption, normalizeForMatch, normalizeQuery } from "./normalize.js";

describe("normalizeForMatch", () => {
  it("カタカナをひらがなにそろえる", () => {
    expect(normalizeForMatch("ヤマダ")).toBe("やまだ");
    expect(normalizeForMatch("ヴァ")).toBe("ゔぁ");
  });

  it("全角と半角をそろえる（NFKC）", () => {
    expect(normalizeForMatch("ＡＢＣ１２３")).toBe("abc123");
    expect(normalizeForMatch("ﾔﾏﾀﾞ")).toBe("やまだ");
  });

  it("大文字と小文字をそろえる", () => {
    expect(normalizeForMatch("Tokyo")).toBe("tokyo");
  });
});

describe("matchesOption", () => {
  const option = { value: "1", label: "山田 太郎", reading: "やまだ たろう" };

  it("空の入力はすべてに当たる", () => {
    expect(matchesOption(option, "")).toBe(true);
    expect(matchesOption(option, "   ")).toBe(true);
  });

  it("名前の部分一致で当たる", () => {
    expect(matchesOption(option, "太郎")).toBe(true);
    expect(matchesOption(option, "花子")).toBe(false);
  });

  it("読みでも当たる。カタカナ・半角で打っても当たる", () => {
    expect(matchesOption(option, "たろう")).toBe(true);
    expect(matchesOption(option, "タロウ")).toBe(true);
    expect(matchesOption(option, "ﾀﾛｳ")).toBe(true);
  });

  it("名前のひらがなとカタカナを同じ文字として扱う", () => {
    expect(matchesOption({ value: "2", label: "サクラ商店" }, "さくら")).toBe(true);
    expect(matchesOption({ value: "3", label: "ＡＢＣ商事" }, "abc")).toBe(true);
  });
});

describe("matchRange", () => {
  it("一致した部分の元の文字列での位置を返す", () => {
    expect(matchRange("山田 太郎", "太郎")).toEqual([3, 5]);
    expect(matchRange("サクラ商店", "さくら")).toEqual([0, 3]);
    expect(matchRange("ＡＢＣ商事", "bc")).toEqual([1, 3]);
  });

  it("半角の濁点のように 1 文字ずつでは対応が取れないときは null", () => {
    expect(matchRange("ﾔﾏﾀﾞ", "だ")).toBeNull();
  });

  it("当たらない・空の入力は null", () => {
    expect(matchRange("山田", "鈴木")).toBeNull();
    expect(matchRange("山田", "")).toBeNull();
  });
});

describe("isExactMatch", () => {
  it("表記ゆれをそろえて名前と完全一致するか", () => {
    expect(isExactMatch({ value: "1", label: "サクラ商店" }, " さくら商店 ")).toBe(true);
    expect(isExactMatch({ value: "1", label: "サクラ商店" }, "さくら")).toBe(false);
  });

  it("空の入力は一致しない", () => {
    expect(isExactMatch({ value: "1", label: "" }, "")).toBe(false);
  });
});

describe("matchRangeNormalized", () => {
  it("そろえ済みの入力で matchRange と同じ結果を返す", () => {
    expect(matchRangeNormalized("サクラ商店", normalizeQuery(" サクラ "))).toEqual([0, 3]);
  });
});
