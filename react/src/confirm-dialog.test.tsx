import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmActions, ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog.js";

afterEach(cleanup);

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onCancel={onCancel}
      title="レコード「A」を削除しますか？"
      description="90 日以内なら戻せます。"
      confirmLabel="削除する"
      onConfirm={onConfirm}
      {...props}
    />,
  );
  const dialog = screen.getByRole("alertdialog", { name: "レコード「A」を削除しますか？" }) as HTMLDialogElement;
  const labels = within(dialog)
    .getAllByRole("button")
    .map((b) => b.textContent);
  return { dialog, labels, onCancel, onConfirm };
}

const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("ConfirmDialog（components.md §7-4）", () => {
  it("dialog 要素を showModal で開く。説明をダイアログの説明として紐づける", () => {
    const { dialog } = renderDialog();
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.open).toBe(true);
    const description = document.getElementById(dialog.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toBe("90 日以内なら戻せます。");
  });

  it("破壊的: 実行（destructive）が左・キャンセルが右。初期フォーカスはキャンセル", () => {
    const { labels } = renderDialog({ destructive: true });
    expect(labels).toEqual(["削除する", "キャンセル"]);
    expect(button("削除する").className).toContain("bg-destructive");
    expect(document.activeElement).toBe(button("キャンセル"));
  });

  it("通常: キャンセルが左・実行（primary）が右。初期フォーカスはキャンセル", () => {
    const { labels } = renderDialog({ confirmLabel: "送信する" });
    expect(labels).toEqual(["キャンセル", "送信する"]);
    expect(button("送信する").className).toContain("bg-primary");
    expect(document.activeElement).toBe(button("キャンセル"));
  });

  it("キャンセルの文言を変えられる", () => {
    const { labels } = renderDialog({ cancelLabel: "戻る" });
    expect(labels).toEqual(["戻る", "削除する"]);
  });

  it("実行・キャンセルのボタンでそれぞれ呼ぶ", () => {
    const { onConfirm, onCancel } = renderDialog({ destructive: true });
    fireEvent.click(button("キャンセル"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(button("削除する"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Esc では閉じない。外側のモーダル（document の capture・window の bubble）にも届かない", () => {
    const outerCapture = vi.fn();
    const outerBubble = vi.fn();
    document.addEventListener("keydown", outerCapture, true);
    window.addEventListener("keydown", outerBubble);
    const { dialog, onCancel } = renderDialog();
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    act(() => {
      document.activeElement?.dispatchEvent(event);
    });
    document.removeEventListener("keydown", outerCapture, true);
    window.removeEventListener("keydown", outerBubble);
    expect(event.defaultPrevented).toBe(true);
    expect(outerCapture).not.toHaveBeenCalled();
    expect(outerBubble).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
  });

  it("閉じ要求（dialog の cancel イベント）を止める", () => {
    const { dialog, onCancel } = renderDialog();
    const event = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("止められずにブラウザが閉じたら開き直し、キャンセルにフォーカスを当てる", async () => {
    const { dialog, onCancel } = renderDialog({ destructive: true });
    act(() => dialog.close());
    expect(dialog.open).toBe(false);
    await waitFor(() => expect(dialog.open).toBe(true));
    expect(document.activeElement).toBe(button("キャンセル"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("背景（箱の外）のクリックで閉じない", () => {
    const { dialog, onCancel } = renderDialog();
    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog);
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
  });

  it("onConfirm の Promise の間は実行のボタンを処理中にし、両方を押せなくする", async () => {
    let finish = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderDialog({ onConfirm });
    fireEvent.click(button("削除する"));
    expect(button("削除する").disabled).toBe(true);
    expect(button("削除する").getAttribute("aria-busy")).toBe("true");
    expect(button("削除する").querySelector(".animate-spin")).not.toBeNull();
    expect(button("キャンセル").disabled).toBe(true);
    fireEvent.click(button("削除する"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(button("削除する").disabled).toBe(false);
    expect(button("削除する").hasAttribute("aria-busy")).toBe(false);
    expect(button("キャンセル").disabled).toBe(false);
  });

  it("閉じていれば何も出さない", () => {
    render(<ConfirmDialog open={false} onCancel={() => {}} title="t" confirmLabel="削除する" onConfirm={() => {}} />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("別のモーダルの中から開くときは暗幕を薄くする", () => {
    expect(renderDialog().dialog.className).toContain("bg-overlay/50");
    cleanup();
    expect(renderDialog({ nested: true }).dialog.className).toContain("bg-overlay/25");
  });

  function Host({ onCancel }: { onCancel?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          開く
        </button>
        <ConfirmDialog
          open={open}
          onCancel={() => {
            onCancel?.();
            setOpen(false);
          }}
          title="t"
          confirmLabel="削除する"
          onConfirm={async () => setOpen(false)}
          destructive
        />
      </>
    );
  }

  it("キャンセルで閉じたら開く前の要素にフォーカスを戻し、body のスクロール停止を解く", () => {
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} />);
    const opener = button("開く");
    opener.focus();
    fireEvent.click(opener);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(button("キャンセル"));
    fireEvent.click(button("キャンセル"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("");
  });

  it("実行して閉じたときもフォーカスを戻す", async () => {
    render(<Host />);
    const opener = button("開く");
    opener.focus();
    fireEvent.click(opener);
    await act(async () => fireEvent.click(button("削除する")));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("StrictMode（effect の二度走り）でも、開く前の要素を覚え違えない", () => {
    render(
      <StrictMode>
        <Host />
      </StrictMode>,
    );
    const opener = button("開く");
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(button("キャンセル"));
    fireEvent.click(button("キャンセル"));
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("ConfirmActions（components.md §2-3 ダイアログの扱い）", () => {
  it("並びと初期フォーカスを決め、均等幅の 2 列にする", () => {
    render(<ConfirmActions destructive confirmLabel="非承認にする" onConfirm={() => {}} onCancel={() => {}} className="mt-6" />);
    const row = button("キャンセル").parentElement!;
    expect(row.className).toBe("grid grid-cols-2 gap-2 mt-6");
    expect(within(row).getAllByRole("button").map((b) => b.textContent)).toEqual(["非承認にする", "キャンセル"]);
    expect(document.activeElement).toBe(button("キャンセル"));
  });

  it("入力欄を持つダイアログでは autoFocusCancel={false} でフォーカスを奪わない", () => {
    render(
      <>
        <input aria-label="理由" autoFocus />
        <ConfirmActions confirmLabel="送信する" onConfirm={() => {}} onCancel={() => {}} autoFocusCancel={false} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "理由" }));
  });

  it("confirmDisabled は実行だけ、busy は両方を押せなくする", () => {
    const { rerender } = render(
      <ConfirmActions confirmLabel="送信する" onConfirm={() => {}} onCancel={() => {}} confirmDisabled />,
    );
    expect(button("送信する").disabled).toBe(true);
    expect(button("キャンセル").disabled).toBe(false);
    rerender(<ConfirmActions confirmLabel="送信する" onConfirm={() => {}} onCancel={() => {}} busy />);
    expect(button("送信する").disabled).toBe(true);
    expect(button("キャンセル").disabled).toBe(true);
  });
});
