/** 候補の 1 件。Combobox と照合の両方で使う */
export type ComboboxOption = {
    /** 値。onValueChange に渡る */
    value: string;
    /** 一覧と入力欄に出す名前 */
    label: string;
    /** 読み（ふりがな）。名前に加えて読みでも当てる */
    reading?: string;
    /** 選べない候補 */
    disabled?: boolean;
};
/**
 * 照合用に文字をそろえる。全角と半角（NFKC）、大文字と小文字、カタカナとひらがなを同じ文字にする
 * （docs/forms.md §8-3 の絞り込み）。
 */
export declare function normalizeForMatch(text: string): string;
/** 入力をそろえる（前後の空白を除いてから normalizeForMatch）。照合を繰り返すときは 1 回だけ呼ぶ */
export declare function normalizeQuery(query: string): string;
/** 部分一致で、名前か読みに当たるか。空の入力はすべてに当たる */
export declare function matchesOption(option: ComboboxOption, query: string): boolean;
/** 名前が入力と完全一致するか（表記ゆれはそろえてから比べる）。空の入力は一致しない */
export declare function isExactMatch(option: ComboboxOption, query: string): boolean;
/**
 * 名前の中で入力に一致した部分の、元の文字列での [開始, 終了)（UTF-16 の位置）。
 * 1 文字ずつそろえた結果が全体をそろえた結果と食い違う名前（半角カナの濁点など）は位置の対応が取れないので null。
 */
export declare function matchRange(label: string, query: string): [number, number] | null;
/** matchRange の、そろえ済みの入力（normalizeQuery の結果）を受け取る版 */
export declare function matchRangeNormalized(label: string, normalizedQuery: string): [number, number] | null;
