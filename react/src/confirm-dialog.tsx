"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { cx, SPINNER_CLASS } from "./classes.js";
import { lockBodyScroll } from "./scroll-lock.js";

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

const BUTTON_BASE =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const CANCEL_BUTTON = `${BUTTON_BASE} border border-input bg-transparent text-foreground hover:bg-foreground/5`;
const PRIMARY_BUTTON = `${BUTTON_BASE} border-0 bg-primary text-primary-foreground hover:bg-primary/90`;
const DESTRUCTIVE_BUTTON = `${BUTTON_BASE} border-0 bg-destructive text-destructive-foreground hover:bg-destructive/90`;

/**
 * 確認のボタン行。並び（破壊的: 実行 → キャンセル、通常: キャンセル → 実行）と DOM の順を揃え、
 * 初期フォーカスをキャンセルに当てる。`ConfirmDialog` の中で使うほか、入力欄を持つ Modal（理由を入れて取り消すなど）の
 * フッターにも使う。幅に関係なく均等幅の 2 列（§2-3 のダイアログの扱い）
 */
export function ConfirmActions({
  confirmLabel,
  cancelLabel = "キャンセル",
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
  confirmDisabled = false,
  autoFocusCancel = true,
  cancelRef,
  className,
}: ConfirmActionsProps) {
  const cancel = (
    <button
      ref={cancelRef}
      type="button"
      className={CANCEL_BUTTON}
      onClick={onCancel}
      disabled={busy}
      autoFocus={autoFocusCancel}
    >
      {cancelLabel}
    </button>
  );
  const confirm = (
    <button
      type="button"
      className={destructive ? DESTRUCTIVE_BUTTON : PRIMARY_BUTTON}
      onClick={onConfirm}
      disabled={busy || confirmDisabled}
      aria-busy={busy || undefined}
    >
      {busy && <span className={SPINNER_CLASS} aria-hidden="true" />}
      {confirmLabel}
    </button>
  );
  return (
    <div className={cx("grid grid-cols-2 gap-2", className)}>
      {destructive ? confirm : cancel}
      {destructive ? cancel : confirm}
    </div>
  );
}

/**
 * 実行前の確認ダイアログ。`window.confirm()` の代わりに使う。
 * 振る舞い（開き方・閉じ方・Esc・入れ子）は README の「確認ダイアログ」
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return props.open ? <OpenConfirmDialog {...props} /> : null;
}

function OpenConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  nested = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    // showModal は先頭のボタンに当てるので、破壊的（実行が先頭）でもキャンセルに当て直す
    cancelRef.current?.focus();
    const unlock = lockBodyScroll();

    // Esc を外側のモーダルへ届けない（README の「確認ダイアログ」の Esc）
    const stopEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", stopEscape, true);
    return () => {
      window.removeEventListener("keydown", stopEscape, true);
      unlock();
      // 先に閉じて背面の inert を解いてから戻す（開いたままだと戻す先がまだ inert で、フォーカスが当たらない）
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // 暗幕は ::backdrop ではなく画面いっぱいの dialog 自身に塗る（::backdrop が CSS 変数を継ぐのは 2024 年以降のブラウザだけ）
      className={`m-0 size-full max-h-none max-w-none items-center justify-center p-4 backdrop:bg-transparent open:flex ${nested ? "bg-overlay/25" : "bg-overlay/50"}`}
      // Esc 以外の閉じ要求（Android の戻るなど）。preventDefault できないこともあるので、閉じたら下の onClose で開き直す
      onCancel={(e) => e.preventDefault()}
      onClose={() => {
        const dialog = dialogRef.current;
        if (dialog?.isConnected && !dialog.open) {
          dialog.showModal();
          cancelRef.current?.focus();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-lg bg-card p-6 text-card-foreground shadow-lg">
        <div className="space-y-2">
          <h2 id={titleId} className="text-lg font-semibold leading-normal">
            {title}
          </h2>
          {description && (
            <div id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        <ConfirmActions
          className="mt-6"
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onConfirm={() => void run()}
          onCancel={onCancel}
          destructive={destructive}
          busy={busy}
          autoFocusCancel={false}
          cancelRef={cancelRef}
        />
      </div>
    </dialog>
  );
}
