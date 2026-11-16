import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Combobox, ComboboxPortalContainer, type ComboboxProps } from "./combobox.js";
import type { ComboboxOption } from "./normalize.js";

const OPTIONS: ComboboxOption[] = [
  { value: "1", label: "山田 太郎", reading: "やまだ たろう" },
  { value: "2", label: "佐藤 花子", reading: "さとう はなこ" },
  { value: "3", label: "サクラ商店" },
  { value: "4", label: "ＡＢＣ商事" },
  { value: "5", label: "停止中の取引先", disabled: true },
];

type HarnessProps = Partial<ComboboxProps> & { initial?: string | null; onSubmit?: () => void };

function Harness({ initial = null, onSubmit, onValueChange, ...rest }: HarnessProps) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor="assignee">担当者</label>
      <Combobox
        id="assignee"
        label="担当者"
        noun="担当者"
        options={OPTIONS}
        {...rest}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onValueChange?.(v);
        }}
      />
      <input aria-label="次の項目" />
      <div data-testid="value">{value ?? ""}</div>
    </form>
  );
}

const input = () => screen.getByRole("combobox") as HTMLInputElement;
const listbox = () => screen.getByRole("listbox");
const optionLabels = () => screen.queryAllByRole("option").map((o) => o.textContent);
const currentValue = () => screen.getByTestId("value").textContent;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Combobox: 入力欄と読み上げ", () => {
  it("combobox のロールと属性を持ち、閉じている", () => {
    render(<Harness />);
    const el = input();
    expect(el).toHaveProperty("id", "assignee");
    expect(el.getAttribute("aria-autocomplete")).toBe("list");
    expect(el.getAttribute("aria-expanded")).toBe("false");
    expect(el.hasAttribute("aria-activedescendant")).toBe(false);
    expect(el.className).toContain("text-base");
    expect(el.className).toContain("min-h-11");
    // 右端の chevron（装飾）
    const svgs = el.parentElement!.querySelectorAll("svg[aria-hidden='true']");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("aria-invalid・aria-describedby・disabled をそのまま渡す", () => {
    render(<Harness aria-invalid aria-describedby="err" disabled />);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().getAttribute("aria-describedby")).toBe("err");
    expect(input().disabled).toBe(true);
  });

  it("一覧は listbox で、名前は label。入力欄の aria-controls が一覧を指す。呼ぶ側の <label> は書き換えない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    expect(screen.getByRole("listbox", { name: "担当者" })).toBe(listbox());
    expect(listbox().hasAttribute("aria-label")).toBe(false);
    const name = document.getElementById(listbox().getAttribute("aria-labelledby")!)!;
    expect(name.className).toContain("sr-only");
    expect(screen.getByText("担当者", { selector: "label" }).id).toBe("");
    expect(input().getAttribute("aria-controls")).toBe(listbox().id);
    expect(input().getAttribute("aria-expanded")).toBe("true");
  });

  it("name を渡すと hidden の input で値を送る", () => {
    const { container } = render(<Harness name="assigneeId" initial="2" />);
    const hidden = container.querySelector("input[type='hidden'][name='assigneeId']") as HTMLInputElement;
    expect(hidden.value).toBe("2");
  });
});

describe("Combobox: 開く", () => {
  it("押したら開き、未入力なら全候補を出す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    expect(optionLabels()).toEqual(OPTIONS.map((o) => o.label));
  });

  it("フォーカスしただけ（スクリプト・Tab）では開かない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    act(() => input().focus());
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input().getAttribute("aria-expanded")).toBe("false");
    act(() => input().blur());
    await user.tab();
    expect(document.activeElement).toBe(input());
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("フォーカスした後、打つか ↓ で開く", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    act(() => input().focus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.keyboard("{Escape}");
    await user.keyboard("佐");
    expect(optionLabels()).toEqual(["佐藤 花子"]);
  });

  it("閉じている間は候補を照合用にそろえない", async () => {
    let reads = 0;
    const counted = OPTIONS.map((o) => ({
      ...o,
      get reading() {
        reads++;
        return o.reading;
      },
    }));
    const user = userEvent.setup();
    const { rerender } = render(<Harness options={counted} initial="1" />);
    rerender(<Harness options={counted} initial="1" />);
    act(() => input().focus());
    expect(reads).toBe(0);
    await user.click(input());
    expect(reads).toBeGreaterThan(0);
  });

  it("閉じた後に入力欄（chevron の上）を押すと開く", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.click(input());
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("閉じているときに打ち始めると開いて絞る", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{Escape}");
    await user.keyboard("佐藤");
    expect(optionLabels()).toEqual(["佐藤 花子"]);
  });

  it("一覧は portal で body 直下に出し、入力欄の 4px 下に置く", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    vi.spyOn(input(), "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 144, left: 20, right: 320, width: 300, height: 44, x: 20, y: 100, toJSON: () => ({}),
    });
    await user.click(input());
    expect(container.contains(listbox())).toBe(false);
    const box = listbox().closest(".fixed") as HTMLElement;
    expect(box.parentElement).toBe(document.body);
    expect(box.style.top).toBe("148px");
    expect(box.style.left).toBe("20px");
    expect(box.style.width).toBe("300px");
    expect(box.className).toContain("max-h-72");
    expect(box.className).toContain("overflow-y-auto");
    expect(box.className).toContain("bg-popover");
    expect(box.className).toContain("border-border");
    for (const option of screen.getAllByRole("option")) expect(option.className).toContain("min-h-11");
  });

  it("スクロールで位置を追い直す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const rect = vi.spyOn(input(), "getBoundingClientRect");
    rect.mockReturnValue({ top: 100, bottom: 144, left: 20, right: 320, width: 300, height: 44, x: 20, y: 100, toJSON: () => ({}) });
    await user.click(input());
    rect.mockReturnValue({ top: 50, bottom: 94, left: 20, right: 320, width: 300, height: 44, x: 20, y: 50, toJSON: () => ({}) });
    fireEvent.scroll(window);
    await waitFor(() => expect((listbox().closest(".fixed") as HTMLElement).style.top).toBe("98px"));
  });

  it("一覧の中のスクロールでは位置を測り直さない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const rect = vi.spyOn(input(), "getBoundingClientRect");
    await user.click(input());
    const calls = rect.mock.calls.length;
    fireEvent.scroll(listbox().closest(".fixed") as HTMLElement);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(rect.mock.calls.length).toBe(calls);
  });
});

describe("Combobox: 絞り込み", () => {
  it("部分一致で絞る", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "商");
    expect(optionLabels()).toEqual(["サクラ商店", "ＡＢＣ商事"]);
  });

  it("ひらがなとカタカナを同じ文字として扱う", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "さくら");
    expect(optionLabels()).toEqual(["サクラ商店"]);
  });

  it("全角と半角を同じ文字として扱う", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "abc");
    expect(optionLabels()).toEqual(["ＡＢＣ商事"]);
  });

  it("読みでも当てる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "ハナコ");
    expect(optionLabels()).toEqual(["佐藤 花子"]);
  });

  it("一致した部分を font-semibold にする", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "太郎");
    const strong = within(screen.getByRole("option")).getByText("太郎");
    expect(strong.className).toContain("font-semibold");
  });

  it("選ばれている状態で開くと、入力欄は名前のままで全候補を出す", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    await user.click(input());
    expect(input().value).toBe("山田 太郎");
    expect(optionLabels()).toHaveLength(OPTIONS.length);
  });

  it("絞り込みが止まってから件数を role=status で読む（一覧の外）", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    const status = screen.getByRole("status");
    expect(status.className).toContain("sr-only");
    await user.type(input(), "商");
    expect(listbox().contains(status)).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(status.textContent).toBe("2 件");
    await user.type(input(), "xyz");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(status.textContent).toBe("一致なし");
  });
});

describe("Combobox: 候補と選択", () => {
  it("選ばれている候補は aria-selected=true で、右端に Check を出す", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2" />);
    await user.click(input());
    const selected = screen.getByRole("option", { name: "佐藤 花子" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    const check = selected.querySelector("svg") as SVGElement;
    expect(check.getAttribute("class")).toContain("size-4");
    const other = screen.getByRole("option", { name: "山田 太郎" });
    expect(other.getAttribute("aria-selected")).toBe("false");
    expect(other.querySelector("svg")).toBeNull();
  });

  it("候補を押すと値が決まり、入力欄に名前を出して閉じる", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await user.type(input(), "さとう");
    await user.click(screen.getByRole("option", { name: "佐藤 花子" }));
    expect(onValueChange).toHaveBeenCalledWith("2");
    expect(input().value).toBe("佐藤 花子");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(input());
  });

  it("選べない候補は押しても値にならない", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(input());
    const disabled = screen.getByRole("option", { name: "停止中の取引先" });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    await user.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("打った文字のまま離れたら値にせず、選ばれている候補の名前に戻す", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="1" onValueChange={onValueChange} />);
    await user.clear(input());
    await user.type(input(), "佐藤");
    await user.click(screen.getByLabelText("次の項目"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input().value).toBe("山田 太郎");
    expect(currentValue()).toBe("1");
  });

  it("何も選ばれていなければ、離れたら空に戻す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "佐藤");
    await user.click(screen.getByLabelText("次の項目"));
    expect(input().value).toBe("");
    expect(currentValue()).toBe("");
  });
});

describe("Combobox: 選択の解除", () => {
  it("必須でなく選ばれているとき、× で解除できる", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    const clear = screen.getByRole("button", { name: "選択を解除" });
    await user.click(clear);
    expect(currentValue()).toBe("");
    expect(input().value).toBe("");
    expect(screen.queryByRole("button", { name: "選択を解除" })).toBeNull();
  });

  it("必須の項目には × を出さない", () => {
    render(<Harness initial="1" required />);
    expect(screen.queryByRole("button", { name: "選択を解除" })).toBeNull();
    expect(input().required).toBe(true);
  });

  it("選ばれていなければ × を出さない", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "選択を解除" })).toBeNull();
  });
});

describe("Combobox: 空の結果と新規作成", () => {
  it("一致しないときは「「入力した文字」に一致する〇〇がありません」を一覧の中に出す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "鈴木");
    const message = screen.getByText("「鈴木」に一致する担当者がありません");
    expect(message.className).toContain("text-sm");
    expect(message.className).toContain("text-muted-foreground");
    expect(message.getAttribute("role")).toBeNull();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("作れるときは区切り線のあとに「「入力した文字」を追加する」を出し、押したら作って選ぶ", async () => {
    const onCreate = vi.fn(async (name: string) => ({ value: "9", label: name }));
    const user = userEvent.setup();
    render(<Harness onCreate={onCreate} />);
    await user.type(input(), "鈴木 一郎");
    const message = screen.getByText("「鈴木 一郎」に一致する担当者がありません");
    const create = screen.getByRole("option", { name: "「鈴木 一郎」を追加する" });
    // 空の結果の文の下に出す
    expect(message.compareDocumentPosition(create) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect((create.previousElementSibling as HTMLElement).className).toContain("border-t");
    await user.click(create);
    expect(onCreate).toHaveBeenCalledWith("鈴木 一郎");
    expect(currentValue()).toBe("9");
    expect(input().value).toBe("鈴木 一郎");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("一覧の末尾に置く（候補があるときも出す）", async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={async (name) => ({ value: "9", label: name })} />);
    await user.type(input(), "山田");
    expect(optionLabels()).toEqual(["山田 太郎", "「山田」を追加する"]);
  });

  it("既存の候補と完全一致するときは出さない（表記ゆれも同じとみなす）", async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={async (name) => ({ value: "9", label: name })} />);
    await user.type(input(), "さくら商店");
    expect(optionLabels()).toEqual(["サクラ商店"]);
  });

  it("onCreate が無ければ出さない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "鈴木");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("作れなかったら選ばずに、失敗を一覧の中に出す", async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={async () => Promise.reject(new Error("x"))} />);
    await user.type(input(), "鈴木");
    await user.click(screen.getByRole("option", { name: "「鈴木」を追加する" }));
    expect(screen.getByText("追加できませんでした。時間をおいてもう一度押してください")).toBeTruthy();
    expect(currentValue()).toBe("");
  });

  it("キーボードでも新規作成の行を選べる", async () => {
    const onCreate = vi.fn(async (name: string) => ({ value: "9", label: name }));
    const user = userEvent.setup();
    render(<Harness onCreate={onCreate} />);
    await user.type(input(), "鈴木");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onCreate).toHaveBeenCalledWith("鈴木");
  });
});

describe("Combobox: キーボード", () => {
  it("↓ は閉じているとき一覧を開くだけ。開いているときは候補を移り、端で止まる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowDown}");
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);

    await user.keyboard("{ArrowDown}");
    const options = screen.getAllByRole("option");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[0]!.id);
    expect(document.activeElement).toBe(input());

    // 選べない候補（末尾）は飛ばし、端で止まる
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[3]!.id);
  });

  it("↑ は閉じているとき一覧を開く。開いているときは上へ移り、先頭で止まる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{Escape}{ArrowUp}");
    expect(input().getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}");
    const options = screen.getAllByRole("option");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[0]!.id);
  });

  it("指している候補を data-active で見せる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[0]!.getAttribute("data-active")).toBe("true");
  });

  it("Enter で指している候補を選んで閉じ、フォームは送信しない", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(input(), "商");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(currentValue()).toBe("4");
    expect(input().value).toBe("ＡＢＣ商事");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("指している候補が無いときの Enter も送信しない", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(input(), "商{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(currentValue()).toBe("");
  });

  it("IME の変換中の Enter では選ばない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{ArrowDown}");
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
    expect(currentValue()).toBe("");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("Esc で閉じて、入力欄の文字を開く前に戻す", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    await user.click(input());
    await user.clear(input());
    await user.type(input(), "佐藤");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input().value).toBe("山田 太郎");
    expect(currentValue()).toBe("1");
    expect(document.activeElement).toBe(input());
  });

  it("開いているときの Esc は外（モーダル等）へ伝えない。閉じているときは何もしない", async () => {
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    await user.click(input());
    await user.keyboard("{Escape}");
    expect(outer).not.toHaveBeenCalled();

    const notPrevented = fireEvent.keyDown(input(), { key: "Escape" });
    expect(notPrevented).toBe(true);
    expect(outer).toHaveBeenCalledTimes(1);
    expect(input().value).toBe("山田 太郎");
    expect(currentValue()).toBe("1");
    expect(screen.queryByRole("listbox")).toBeNull();
    document.removeEventListener("keydown", outer);
  });

  it("Tab は指していた候補を選ばずに閉じ、次の項目へ移る", async () => {
    const user = userEvent.setup();
    render(<Harness required />);
    await user.type(input(), "商");
    await user.keyboard("{ArrowDown}{Tab}");
    expect(currentValue()).toBe("");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText("次の項目"));
    expect(input().value).toBe("");
  });

  it("Home / End は入力欄の中の移動で、一覧の端へは飛ばない", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "商");
    await user.keyboard("{ArrowDown}");
    const active = input().getAttribute("aria-activedescendant");
    expect(fireEvent.keyDown(input(), { key: "Home" })).toBe(true);
    expect(fireEvent.keyDown(input(), { key: "End" })).toBe(true);
    expect(input().getAttribute("aria-activedescendant")).toBe(active);
  });

  it("文字を打つと指していた候補を外す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("{ArrowDown}");
    await user.keyboard("山");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  });
});

describe("Combobox: サーバで検索する", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  function deferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  }

  it("開いたら空の検索を問い合わせ、打ち終わりを 300ms 待ってから問い合わせる。その間は先頭に Spinner を出す", async () => {
    const onSearch = vi.fn(async (q: string) => OPTIONS.filter((o) => o.label.includes(q)));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness options={[]} onSearch={onSearch} />);
    await user.click(input());
    expect(onSearch).toHaveBeenCalledWith("");
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(optionLabels()).toHaveLength(OPTIONS.length);

    onSearch.mockClear();
    // 打っている間（50ms おき）は問い合わせない。最後の 1 文字から 300ms 後に 1 回だけ
    await user.type(input(), "山田", { delay: 50 });
    expect(onSearch).not.toHaveBeenCalled();
    const box = listbox().closest(".fixed") as HTMLElement;
    const spinner = box.querySelector(".animate-spin") as HTMLElement;
    expect(spinner.getAttribute("class")).toContain("size-4");
    // 先頭は一覧の名前（sr-only）。見える要素の先頭が Spinner
    expect(box.children[0]!.className).toContain("sr-only");
    expect(box.children[1]!.contains(spinner)).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(onSearch).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("山田");
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(optionLabels()).toEqual(["山田 太郎"]);
    expect(box.querySelector(".animate-spin")).toBeNull();
  });

  it("古い問い合わせの結果で上書きしない", async () => {
    const first = deferred<ComboboxOption[]>();
    const second = deferred<ComboboxOption[]>();
    const onSearch = vi.fn().mockResolvedValueOnce([]).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness options={[]} onSearch={onSearch} />);
    await user.click(input());
    await user.type(input(), "a");
    await act(() => vi.advanceTimersByTimeAsync(300));
    await user.type(input(), "b");
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(async () => second.resolve([{ value: "2", label: "ab の結果" }]));
    await act(async () => first.resolve([{ value: "1", label: "a の結果" }]));
    expect(optionLabels()).toEqual(["ab の結果"]);
  });

  it("選んだ候補の名前は、options に無くても検索結果から出す", async () => {
    const onSearch = vi.fn(async () => [{ value: "7", label: "遠くの候補" }]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness options={[]} onSearch={onSearch} />);
    await user.click(input());
    await act(() => vi.advanceTimersByTimeAsync(0));
    await user.click(screen.getByRole("option", { name: "遠くの候補" }));
    expect(input().value).toBe("遠くの候補");
  });

  it("問い合わせに失敗したら一覧の中に出す", async () => {
    const onSearch = vi.fn(async () => Promise.reject(new Error("x")));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness options={[]} onSearch={onSearch} />);
    await user.click(input());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText("候補を読み込めませんでした。時間をおいてもう一度入力してください")).toBeTruthy();
  });
});

describe("Combobox: ComboboxPortalContainer", () => {
  function InModal() {
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    return (
      <div role="dialog" ref={setBox} data-testid="modal">
        <ComboboxPortalContainer container={box}>
          <Harness />
        </ComboboxPortalContainer>
      </div>
    );
  }

  it("渡した要素の中に一覧を出す（モーダルの箱の外に出さない）", async () => {
    const user = userEvent.setup();
    render(<InModal />);
    await user.click(screen.getByRole("combobox"));
    const box = listbox().closest(".fixed") as HTMLElement;
    expect(box.parentElement).toBe(screen.getByTestId("modal"));
    await user.click(screen.getByRole("option", { name: "佐藤 花子" }));
    expect(currentValue()).toBe("2");
  });

  it("null なら document.body に出す", async () => {
    const user = userEvent.setup();
    render(
      <ComboboxPortalContainer container={null}>
        <Harness />
      </ComboboxPortalContainer>,
    );
    await user.click(input());
    expect((listbox().closest(".fixed") as HTMLElement).parentElement).toBe(document.body);
  });
});

describe("Combobox: スマホ（md 未満）は全画面のシートで開く", () => {
  // vitest.setup.mjs の matchMedia は同じ query に同じオブジェクトを返す
  const md = () => window.matchMedia("(min-width: 48rem)") as { matches: boolean };
  beforeEach(() => {
    md().matches = false;
  });
  afterEach(() => {
    md().matches = true;
  });

  it("入力欄を押すと、項目のラベルをタイトルにしたシートを開き、検索の入力欄にフォーカスする", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    await user.click(input());
    const dialog = screen.getByRole("dialog", { name: "担当者" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.className).toContain("inset-0");
    const search = within(dialog).getByRole("combobox");
    expect(document.activeElement).toBe(search);
    expect((search as HTMLInputElement).value).toBe("");
    expect(search.className).toContain("text-base");
    expect(within(dialog).getAllByRole("option")).toHaveLength(OPTIONS.length);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("フォーカスしただけではシートを開かない", () => {
    render(<Harness />);
    act(() => input().focus());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ComboboxPortalContainer の中ではシートもその中に出す", async () => {
    function InModal() {
      const [box, setBox] = useState<HTMLDivElement | null>(null);
      return (
        <div ref={setBox} data-testid="modal">
          <ComboboxPortalContainer container={box}>
            <Harness />
          </ComboboxPortalContainer>
        </div>
      );
    }
    const user = userEvent.setup();
    render(<InModal />);
    await user.click(input());
    expect(screen.getByRole("dialog").parentElement).toBe(screen.getByTestId("modal"));
  });

  it("シートの中で絞って選ぶと閉じ、元の入力欄にフォーカスを戻す", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("はなこ");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("option").map((o) => o.textContent)).toEqual(["佐藤 花子"]);
    await user.click(within(dialog).getByRole("option"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(currentValue()).toBe("2");
    expect(document.activeElement).toBe(input());
    expect(input().value).toBe("佐藤 花子");
    expect(document.body.style.overflow).toBe("");
  });

  it("× で閉じたら値を変えない", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    await user.click(input());
    await user.keyboard("さとう");
    await user.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(currentValue()).toBe("1");
    expect(document.activeElement).toBe(input());
  });

  it("シートの中でもキーボードで選べる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.keyboard("商{ArrowDown}{Enter}");
    expect(currentValue()).toBe("3");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("空の結果と新規作成はシートでも同じ", async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={async (name) => ({ value: "9", label: name })} />);
    await user.click(input());
    await user.keyboard("鈴木");
    expect(screen.getByText("「鈴木」に一致する担当者がありません")).toBeTruthy();
    expect(screen.getByRole("option", { name: "「鈴木」を追加する" })).toBeTruthy();
  });
});
