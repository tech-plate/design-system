import { type ReactNode, type Ref } from "react";
/** 確認ダイアログのボタン行（実行 + キャンセル）。仕様は docs/components.md §2-3「ダイアログの扱い」・§7-4 */
export type ConfirmActionsProps = {
    /** 実行のボタンの文言。押した結果を動詞で書く（「削除する」など。「OK」「はい」にしない） */
    confirmLabel: string;
    /** キャンセルのボタンの文言 */
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    /** 削除・取り消しなど元に戻せない操作。実行のボタンを destructive の塗りにして左に置く */
    destructive?: boolean;
    /** 実行中。実行のボタンにスピナーを出し、両方のボタンを押せなくする */
    busy?: boolean;
    /** 実行のボタンだけを押せなくする（必須の入力が済んでいないなど） */
    confirmDisabled?: boolean;
    /**
     * 描いたときにキャンセルへフォーカスを当てる（既定 true。§7-4 の初期フォーカス）。
     * 入力欄を持つダイアログで、入力欄に初期フォーカスを当てるときだけ false にする
     */
    autoFocusCancel?: boolean;
    /** キャンセルのボタンの要素 */
    cancelRef?: Ref<HTMLButtonElement>;
    /** 行（外枠）に足すクラス。本文との間の `mt-6` など */
    className?: string;
};
/** 確認ダイアログ。仕様は docs/components.md §7-1・§7-4 */
export type ConfirmDialogProps = Pick<ConfirmActionsProps, "confirmLabel" | "cancelLabel" | "destructive"> & {
    open: boolean;
    /** 問いの形で書く（「〜を削除しますか？」） */
    title: string;
    /** 何が起きるか・元に戻せるかどうか */
    description?: ReactNode;
    /**
     * 実行のボタン。返した Promise が終わるまで実行中になる（実行のボタンにスピナー、両方のボタンを押せない）。
     * 閉じるのは呼ぶ側（終わったら open を false にする）。失敗は中で扱う（投げると開いたまま実行中が解ける）
     */
    onConfirm: () => Promise<void> | void;
    /** キャンセルのボタン。呼ぶ側で open を false にする。Esc・背景のクリックでは呼ばない */
    onCancel: () => void;
    /** 別のモーダルの中から開く。暗幕を `bg-overlay/25` にして外側の暗幕と重ねる */
    nested?: boolean;
};
/**
 * 確認のボタン行。並び（破壊的: 実行 → キャンセル、通常: キャンセル → 実行）と DOM の順を揃え、
 * 初期フォーカスをキャンセルに当てる。`ConfirmDialog` の中で使うほか、入力欄を持つ Modal（理由を入れて取り消すなど）の
 * フッターにも使う。幅に関係なく均等幅の 2 列（§2-3 のダイアログの扱い）
 */
export declare function ConfirmActions({ confirmLabel, cancelLabel, onConfirm, onCancel, destructive, busy, confirmDisabled, autoFocusCancel, cancelRef, className, }: ConfirmActionsProps): import("react").JSX.Element;
/**
 * 実行前の確認ダイアログ。`window.confirm()` の代わりに使う。
 * 振る舞い（開き方・閉じ方・Esc・入れ子）は README の「確認ダイアログ」
 */
export declare function ConfirmDialog(props: ConfirmDialogProps): import("react").JSX.Element | null;
