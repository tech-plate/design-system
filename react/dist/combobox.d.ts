import { type ComboboxOption } from "./normalize.js";
/** 検索つきの Combobox（1 つだけ選ぶ）。仕様は docs/forms.md §8-3 */
export type ComboboxProps = {
    /** 入力欄の id。見える `<label htmlFor>` は呼ぶ側で置き、この id と合わせる */
    id?: string;
    /** 項目のラベル（見える `<label>` と同じ文字）。一覧の名前とスマホのシートのタイトルに使う */
    label: string;
    /** フォームで送るときの名前。値を hidden の input に入れる */
    name?: string;
    /** 選ばれている候補の value。未選択は null */
    value: string | null;
    /** 候補を選んだ・× で解除したときに呼ぶ。解除は null */
    onValueChange: (value: string | null) => void;
    /**
     * 候補。`reading`（ふりがな）を持たせると読みでも当たる。
     * サーバで検索する（onSearch がある）ときは、選ばれている候補を入れて渡す
     * （入力欄に名前を出すため。一覧には onSearch の結果を出す）
     */
    options?: ComboboxOption[];
    placeholder?: string;
    /** 空の結果の文「「〇〇」に一致する{noun}がありません」に入れる名詞 */
    noun?: string;
    /** 必須。× の解除ボタンを出さない */
    required?: boolean;
    disabled?: boolean;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
    /** 外枠（入力欄をくるむ要素）に足すクラス。幅・余白の調整に使う */
    className?: string;
    /** サーバで検索する。打ち終わりを 300ms 待ってから呼ぶ。開いた直後は空文字で呼ぶ（最近使ったものを返すなど） */
    onSearch?: (query: string) => Promise<ComboboxOption[]>;
    /**
     * 名前だけで作れて、作る権限があるときだけ渡す。作った候補を返す。
     * 一覧の末尾に「「〇〇」を追加する」を出し、作った候補を選んだ状態にする
     */
    onCreate?: (name: string) => Promise<ComboboxOption>;
};
/**
 * 検索つきの Combobox。文字を打って候補を絞り、1 つを選ぶ（docs/forms.md §8-3）。
 * フォーカスは入力欄に置いたまま、指している候補を aria-activedescendant で示す。
 * md 未満では入力欄の下に一覧を出さず、全画面のシートで開く。
 */
export declare function Combobox({ id, label, name, value, onValueChange, options, placeholder, noun, required, disabled, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, className, onSearch, onCreate, }: ComboboxProps): import("react").JSX.Element;
