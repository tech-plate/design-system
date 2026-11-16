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

const KATAKANA_START = 0x30a1; // ァ
const KATAKANA_END = 0x30f6; // ヶ
const KATAKANA_TO_HIRAGANA = 0x60;

/**
 * 照合用に文字をそろえる。全角と半角（NFKC）、大文字と小文字、カタカナとひらがなを同じ文字にする
 * （docs/forms.md §8-3 の絞り込み）。
 */
export function normalizeForMatch(text: string): string {
  let out = "";
  for (const char of text.normalize("NFKC").toLowerCase()) {
    const code = char.codePointAt(0)!;
    out +=
      code >= KATAKANA_START && code <= KATAKANA_END
        ? String.fromCodePoint(code - KATAKANA_TO_HIRAGANA)
        : char;
  }
  return out;
}

/** 入力をそろえる（前後の空白を除いてから normalizeForMatch）。照合を繰り返すときは 1 回だけ呼ぶ */
export function normalizeQuery(query: string): string {
  return normalizeForMatch(query.trim());
}

/** 部分一致で、名前か読みに当たるか。空の入力はすべてに当たる */
export function matchesOption(option: ComboboxOption, query: string): boolean {
  const q = normalizeQuery(query);
  if (q === "") return true;
  return (
    normalizeForMatch(option.label).includes(q) ||
    (option.reading !== undefined && normalizeForMatch(option.reading).includes(q))
  );
}

/** 名前が入力と完全一致するか（表記ゆれはそろえてから比べる）。空の入力は一致しない */
export function isExactMatch(option: ComboboxOption, query: string): boolean {
  const q = normalizeQuery(query);
  return q !== "" && normalizeForMatch(option.label) === q;
}

/**
 * 名前の中で入力に一致した部分の、元の文字列での [開始, 終了)（UTF-16 の位置）。
 * 1 文字ずつそろえた結果が全体をそろえた結果と食い違う名前（半角カナの濁点など）は位置の対応が取れないので null。
 */
export function matchRange(label: string, query: string): [number, number] | null {
  return matchRangeNormalized(label, normalizeQuery(query));
}

/** matchRange の、そろえ済みの入力（normalizeQuery の結果）を受け取る版 */
export function matchRangeNormalized(label: string, normalizedQuery: string): [number, number] | null {
  const q = normalizedQuery;
  if (q === "") return null;

  // そろえた文字列の各位置が、元の文字列のどこから来たか
  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of label) {
    const piece = normalizeForMatch(char);
    for (let i = 0; i < piece.length; i++) {
      starts.push(offset);
      ends.push(offset + char.length);
    }
    normalized += piece;
    offset += char.length;
  }
  if (normalized !== normalizeForMatch(label)) return null;

  const index = normalized.indexOf(q);
  if (index === -1) return null;
  return [starts[index]!, ends[index + q.length - 1]!];
}
