"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { cx, SPINNER_CLASS } from "./classes.js";
import { lockBodyScroll } from "./scroll-lock.js";
const BUTTON_BASE = "inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const CANCEL_BUTTON = `${BUTTON_BASE} border border-input bg-transparent text-foreground hover:bg-foreground/5`;
const PRIMARY_BUTTON = `${BUTTON_BASE} border-0 bg-primary text-primary-foreground hover:bg-primary/90`;
const DESTRUCTIVE_BUTTON = `${BUTTON_BASE} border-0 bg-destructive text-destructive-foreground hover:bg-destructive/90`;
/**
 * 確認のボタン行。並び（破壊的: 実行 → キャンセル、通常: キャンセル → 実行）と DOM の順を揃え、
 * 初期フォーカスをキャンセルに当てる。`ConfirmDialog` の中で使うほか、入力欄を持つ Modal（理由を入れて取り消すなど）の
 * フッターにも使う。幅に関係なく均等幅の 2 列（§2-3 のダイアログの扱い）
 */
export function ConfirmActions({ confirmLabel, cancelLabel = "キャンセル", onConfirm, onCancel, destructive = false, busy = false, confirmDisabled = false, autoFocusCancel = true, cancelRef, className, }) {
    const cancel = (_jsx("button", { ref: cancelRef, type: "button", className: CANCEL_BUTTON, onClick: onCancel, disabled: busy, autoFocus: autoFocusCancel, children: cancelLabel }));
    const confirm = (_jsxs("button", { type: "button", className: destructive ? DESTRUCTIVE_BUTTON : PRIMARY_BUTTON, onClick: onConfirm, disabled: busy || confirmDisabled, "aria-busy": busy || undefined, children: [busy && _jsx("span", { className: SPINNER_CLASS, "aria-hidden": "true" }), confirmLabel] }));
    return (_jsxs("div", { className: cx("grid grid-cols-2 gap-2", className), children: [destructive ? confirm : cancel, destructive ? cancel : confirm] }));
}
/**
 * 実行前の確認ダイアログ。`window.confirm()` の代わりに使う。
 * 振る舞い（開き方・閉じ方・Esc・入れ子）は README の「確認ダイアログ」
 */
export function ConfirmDialog(props) {
    return props.open ? _jsx(OpenConfirmDialog, { ...props }) : null;
}
function OpenConfirmDialog({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, destructive = false, nested = false, }) {
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const [busy, setBusy] = useState(false);
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog)
            return;
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        // showModal は先頭のボタンに当てるので、破壊的（実行が先頭）でもキャンセルに当て直す
        cancelRef.current?.focus();
        const unlock = lockBodyScroll();
        // Esc を外側のモーダルへ届けない（README の「確認ダイアログ」の Esc）
        const stopEscape = (e) => {
            if (e.key !== "Escape")
                return;
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("keydown", stopEscape, true);
        return () => {
            window.removeEventListener("keydown", stopEscape, true);
            unlock();
            // 先に閉じて背面の inert を解いてから戻す（開いたままだと戻す先がまだ inert で、フォーカスが当たらない）
            dialog.close();
            if (opener?.isConnected)
                opener.focus();
        };
    }, []);
    const run = async () => {
        setBusy(true);
        try {
            await onConfirm();
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("dialog", { ref: dialogRef, role: "alertdialog", "aria-labelledby": titleId, "aria-describedby": description ? descriptionId : undefined, 
        // 暗幕は ::backdrop ではなく画面いっぱいの dialog 自身に塗る（::backdrop が CSS 変数を継ぐのは 2024 年以降のブラウザだけ）
        className: `m-0 size-full max-h-none max-w-none items-center justify-center p-4 backdrop:bg-transparent open:flex ${nested ? "bg-overlay/25" : "bg-overlay/50"}`, 
        // Esc 以外の閉じ要求（Android の戻るなど）。preventDefault できないこともあるので、閉じたら下の onClose で開き直す
        onCancel: (e) => e.preventDefault(), onClose: () => {
            const dialog = dialogRef.current;
            if (dialog?.isConnected && !dialog.open) {
                dialog.showModal();
                cancelRef.current?.focus();
            }
        }, children: _jsxs("div", { className: "w-full max-w-sm rounded-lg bg-card p-6 text-card-foreground shadow-lg", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { id: titleId, className: "text-lg font-semibold leading-normal", children: title }), description && (_jsx("div", { id: descriptionId, className: "text-sm text-muted-foreground", children: description }))] }), _jsx(ConfirmActions, { className: "mt-6", confirmLabel: confirmLabel, cancelLabel: cancelLabel, onConfirm: () => void run(), onCancel: onCancel, destructive: destructive, busy: busy, autoFocusCancel: false, cancelRef: cancelRef })] }) }));
}
