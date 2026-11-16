"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, Fragment, memo, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, } from "react";
import { createPortal } from "react-dom";
import { cx, SPINNER_CLASS } from "./classes.js";
import { matchRangeNormalized, normalizeForMatch, normalizeQuery } from "./normalize.js";
import { lockBodyScroll } from "./scroll-lock.js";
const SEARCH_DEBOUNCE_MS = 300;
/** 件数の読み上げは絞り込みが止まってから */
const STATUS_DELAY_MS = 500;
const MD_QUERY = "(min-width: 48rem)";
const EMPTY_OPTIONS = [];
const INPUT_CLASS = "min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive";
const OPTION_CLASS = "flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-foreground/5 data-[active=true]:bg-foreground/5 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-transparent";
const MUTED_NOTE_CLASS = "flex min-h-11 items-center px-3 py-2 text-sm text-muted-foreground";
const ERROR_NOTE_CLASS = "flex min-h-11 items-center px-3 py-2 text-sm text-destructive-text";
const SEARCH_FAILED_MESSAGE = "候補を読み込めませんでした。時間をおいてもう一度入力してください";
const CREATE_FAILED_MESSAGE = "追加できませんでした。時間をおいてもう一度押してください";
const EMPTY_INDEXED = [];
const indexOptions = (options) => options.map((option) => ({
    option,
    label: normalizeForMatch(option.label),
    reading: option.reading === undefined ? undefined : normalizeForMatch(option.reading),
}));
// md 以上か。MediaQueryList は 1 つを使い回す。サーバ描画では md 以上とみなす
let mediaQuery;
const getMediaQuery = () => (mediaQuery ??= window.matchMedia(MD_QUERY));
function useIsDesktop() {
    return useSyncExternalStore((onChange) => {
        const media = getMediaQuery();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, () => getMediaQuery().matches, () => true);
}
/** Esc（IME の変換中を除く）なら外へ伝えずに close して true */
function handleEscape(event, close) {
    if (event.key !== "Escape" || event.nativeEvent.isComposing)
        return false;
    event.preventDefault();
    event.stopPropagation();
    close();
    return true;
}
function Icon({ children, ...props }) {
    return (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", ...props, children: children }));
}
const ChevronDownIcon = ({ className }) => (_jsx(Icon, { className: className, children: _jsx("path", { d: "m6 9 6 6 6-6" }) }));
const CheckIcon = ({ className }) => (_jsx(Icon, { className: className, children: _jsx("path", { d: "M20 6 9 17l-5-5" }) }));
const XIcon = ({ className }) => (_jsxs(Icon, { className: className, children: [_jsx("path", { d: "M18 6 6 18" }), _jsx("path", { d: "m6 6 12 12" })] }));
/** 一致した部分を font-semibold にする。query はそろえ済みのもの */
const Highlighted = memo(function Highlighted({ label, query }) {
    const range = matchRangeNormalized(label, query);
    if (!range)
        return _jsx(_Fragment, { children: label });
    return (_jsxs(_Fragment, { children: [label.slice(0, range[0]), _jsx("span", { className: "font-semibold", children: label.slice(range[0], range[1]) }), label.slice(range[1])] }));
});
function OptionRow({ id, active, selected, disabled, onActivate, children, }) {
    return (_jsx("div", { role: "option", id: id, "aria-selected": selected, "aria-disabled": disabled || undefined, "data-active": active || undefined, className: OPTION_CLASS, onClick: onActivate, children: children }));
}
const PortalContainerContext = createContext(null);
/**
 * Combobox の一覧（md 以上）とシート（md 未満）を出す先を変える。既定は document.body。
 * フォーカスを閉じ込めるモーダル（Radix の Dialog など）の中では、その箱を渡す
 * （箱の外に出すと、モーダルが外側とみなして押す・打つ・スクロールを止める）。
 * 一覧は position: fixed で置くので、渡す要素とその祖先に transform を付けない。
 */
export function ComboboxPortalContainer({ container, children, }) {
    return _jsx(PortalContainerContext.Provider, { value: container, children: children });
}
/**
 * 検索つきの Combobox。文字を打って候補を絞り、1 つを選ぶ（docs/forms.md §8-3）。
 * フォーカスは入力欄に置いたまま、指している候補を aria-activedescendant で示す。
 * md 未満では入力欄の下に一覧を出さず、全画面のシートで開く。
 */
export function Combobox({ id, label, name, value, onValueChange, options = EMPTY_OPTIONS, placeholder, noun = "候補", required = false, disabled = false, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, className, onSearch, onCreate, }) {
    const baseId = useId();
    const inputId = id ?? `${baseId}input`;
    const listboxId = `${baseId}listbox`;
    const titleId = `${baseId}title`;
    const labelId = `${baseId}label`;
    const optionId = (index) => `${baseId}option-${index}`;
    const isDesktop = useIsDesktop();
    const portalContainer = useContext(PortalContainerContext);
    const inputRef = useRef(null);
    const sheetInputRef = useRef(null);
    const popupRef = useRef(null);
    /** 最後に選んだ・作った候補。親が options を更新するまでの間、入力欄に名前を出すため */
    const lastChosenRef = useRef(null);
    const [open, setOpen] = useState(false);
    /** 開いてから打った文字。打つまでは null で、全候補を出す */
    const [typed, setTyped] = useState(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [status, setStatus] = useState("");
    const [results, setResults] = useState(EMPTY_OPTIONS);
    const [loading, setLoading] = useState(false);
    const [searchFailed, setSearchFailed] = useState(false);
    const requestRef = useRef(0);
    const searchTimerRef = useRef(undefined);
    const [creating, setCreating] = useState(false);
    const [createFailed, setCreateFailed] = useState(false);
    const [position, setPosition] = useState();
    const lastChosen = lastChosenRef.current;
    const selectedOption = value === null
        ? undefined
        : (options.find((o) => o.value === value) ?? (lastChosen?.value === value ? lastChosen : undefined));
    const selectedLabel = selectedOption?.label ?? "";
    const query = typed ?? "";
    const trimmed = query.trim();
    const normalizedQuery = useMemo(() => normalizeQuery(query), [query]);
    // 照合用にそろえるのは開いている間だけ（閉じている間の再描画で全候補をそろえ直さない）
    const indexed = useMemo(() => (open ? indexOptions(onSearch ? results : options) : EMPTY_INDEXED), [open, onSearch, results, options]);
    // サーバで検索するときは結果をそのまま出す
    const visible = useMemo(() => onSearch || normalizedQuery === ""
        ? indexed
        : indexed.filter(({ label: l, reading }) => l.includes(normalizedQuery) || (reading?.includes(normalizedQuery) ?? false)), [onSearch, normalizedQuery, indexed]);
    const exactExists = normalizedQuery !== "" && visible.some(({ label: l }) => l === normalizedQuery);
    const showCreate = onCreate !== undefined && trimmed !== "" && !exactExists && !loading;
    const entries = visible.map(({ option }) => ({ kind: "option", option }));
    if (showCreate)
        entries.push({ kind: "create" });
    const isEnabled = (entry) => entry !== undefined && (entry.kind === "create" ? !creating : !entry.option.disabled);
    const activeId = open && isEnabled(entries[activeIndex]) ? optionId(activeIndex) : undefined;
    const cancelSearch = () => {
        clearTimeout(searchTimerRef.current);
        requestRef.current++;
        setLoading(false);
    };
    const search = (q, delay) => {
        if (!onSearch)
            return;
        clearTimeout(searchTimerRef.current);
        const request = ++requestRef.current;
        setLoading(true);
        setSearchFailed(false);
        const run = async () => {
            try {
                const found = await onSearch(q);
                if (request !== requestRef.current)
                    return;
                setResults(found);
                setActiveIndex(-1);
            }
            catch {
                if (request !== requestRef.current)
                    return;
                setResults(EMPTY_OPTIONS);
                setSearchFailed(true);
            }
            finally {
                if (request === requestRef.current)
                    setLoading(false);
            }
        };
        if (delay === 0)
            void run();
        else
            searchTimerRef.current = setTimeout(run, delay);
    };
    const openList = () => {
        if (disabled || open)
            return;
        setTyped(null);
        setActiveIndex(-1);
        setCreateFailed(false);
        setOpen(true);
        search("", 0);
        // 入力欄には選ばれている候補の名前が出ている。全体を選んでおき、打った文字で置き換える（名前の後ろに足さない）
        if (isDesktop)
            inputRef.current?.select();
    };
    const closeList = () => {
        setOpen(false);
        setTyped(null);
        setActiveIndex(-1);
        cancelSearch();
    };
    /** 元の入力欄にフォーカスを戻す（フォーカスだけでは開かない） */
    const focusInput = () => inputRef.current?.focus();
    const choose = (option) => {
        lastChosenRef.current = option;
        onValueChange(option.value);
        closeList();
        if (!isDesktop)
            focusInput();
    };
    const create = async () => {
        if (!onCreate)
            return;
        setCreating(true);
        setCreateFailed(false);
        try {
            choose(await onCreate(trimmed));
        }
        catch {
            setCreateFailed(true);
        }
        finally {
            setCreating(false);
        }
    };
    const activate = (entry) => {
        if (!isEnabled(entry))
            return;
        if (entry.kind === "create")
            void create();
        else
            choose(entry.option);
    };
    /** 有効な候補へ移る。端で止まる */
    const move = (direction) => {
        const from = activeIndex === -1 ? (direction === 1 ? -1 : entries.length) : activeIndex;
        for (let index = from + direction; index >= 0 && index < entries.length; index += direction) {
            if (isEnabled(entries[index])) {
                setActiveIndex(index);
                return;
            }
        }
    };
    const handleTextChange = (event) => {
        const next = event.target.value;
        setTyped(next);
        setActiveIndex(-1);
        setCreateFailed(false);
        if (!open) {
            setOpen(true);
            if (onSearch)
                setResults(EMPTY_OPTIONS);
        }
        search(next, SEARCH_DEBOUNCE_MS);
    };
    /** ↑↓・Enter。入力欄（md 以上）とシートの検索欄で共通 */
    const handleListKeys = (event) => {
        if (event.nativeEvent.isComposing)
            return;
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
                event.preventDefault();
                if (!open)
                    openList();
                else
                    move(event.key === "ArrowDown" ? 1 : -1);
                return;
            case "Enter":
                if (!open)
                    return;
                event.preventDefault();
                activate(entries[activeIndex]);
                return;
        }
    };
    const handleInputKeyDown = (event) => {
        if (!isDesktop) {
            // シートを閉じている元の入力欄。↓↑ と Enter で開く
            if (event.key === "ArrowDown" || event.key === "ArrowUp" || (event.key === "Enter" && !open)) {
                event.preventDefault();
                openList();
            }
            return;
        }
        if (open && handleEscape(event, closeList))
            return;
        if (event.key === "Tab") {
            if (open)
                closeList();
            return;
        }
        handleListKeys(event);
    };
    const clear = () => {
        onValueChange(null);
        closeList();
        focusInput();
    };
    // 一覧の位置。入力欄の 4px 下に fixed で置き、スクロール・リサイズで追う（一覧の中のスクロールは無視）
    useLayoutEffect(() => {
        if (!open || !isDesktop)
            return;
        let frame = 0;
        const updatePosition = () => {
            frame = 0;
            const rect = inputRef.current?.getBoundingClientRect();
            if (!rect)
                return;
            const next = { top: rect.bottom + 4, left: rect.left, width: rect.width };
            setPosition((prev) => prev && prev.top === next.top && prev.left === next.left && prev.width === next.width ? prev : next);
        };
        const schedule = (event) => {
            if (event.target instanceof Node && popupRef.current?.contains(event.target))
                return;
            if (frame === 0)
                frame = requestAnimationFrame(updatePosition);
        };
        updatePosition();
        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
        };
    }, [open, isDesktop]);
    // 指している候補を見える位置へ
    useEffect(() => {
        if (activeId)
            document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }, [activeId]);
    // 件数の読み上げ。打つたびに読ませないよう、止まってから更新する
    const count = visible.length;
    useEffect(() => {
        if (!open) {
            setStatus("");
            return;
        }
        if (loading || searchFailed)
            return;
        const timer = setTimeout(() => setStatus(count > 0 ? `${count} 件` : "一致なし"), STATUS_DELAY_MS);
        return () => clearTimeout(timer);
    }, [open, loading, searchFailed, count, query]);
    // 外したら、待っている・問い合わせ中の検索の結果を捨てる
    useEffect(() => () => {
        clearTimeout(searchTimerRef.current);
        requestRef.current++;
    }, []);
    const sheetOpen = open && !isDesktop;
    useEffect(() => {
        if (!sheetOpen)
            return;
        sheetInputRef.current?.focus();
        return lockBodyScroll();
    }, [sheetOpen]);
    const showClear = !required && !disabled && value !== null;
    const emptyMessage = () => {
        if (searchFailed)
            return SEARCH_FAILED_MESSAGE;
        if (loading || visible.length > 0)
            return undefined;
        if (trimmed === "")
            return `選べる${noun}がありません`;
        return `「${trimmed}」に一致する${noun}がありません`;
    };
    const message = emptyMessage();
    const listContent = (labelledBy) => (_jsxs(_Fragment, { children: [loading && (_jsx("div", { className: "flex min-h-11 items-center px-3 text-muted-foreground", children: _jsx("span", { className: SPINNER_CLASS, "aria-hidden": "true" }) })), message && _jsx("p", { className: searchFailed ? ERROR_NOTE_CLASS : MUTED_NOTE_CLASS, children: message }), _jsx("div", { role: "listbox", id: listboxId, "aria-labelledby": labelledBy, children: entries.map((entry, index) => entry.kind === "option" ? (_jsxs(OptionRow, { id: optionId(index), active: index === activeIndex, selected: entry.option.value === value, disabled: entry.option.disabled ?? false, onActivate: () => activate(entry), children: [_jsx("span", { className: "min-w-0 flex-1 break-words", children: _jsx(Highlighted, { label: entry.option.label, query: normalizedQuery }) }), entry.option.value === value && _jsx(CheckIcon, { className: "size-4 shrink-0" })] }, entry.option.value)) : (_jsxs(Fragment, { children: [_jsx("div", { "aria-hidden": "true", className: "my-1 border-t border-border" }), _jsxs(OptionRow, { id: optionId(index), active: index === activeIndex, selected: false, disabled: creating, onActivate: () => activate(entry), children: [creating && _jsx("span", { className: SPINNER_CLASS, "aria-hidden": "true" }), _jsxs("span", { className: "min-w-0 flex-1 break-words", children: ["\u300C", trimmed, "\u300D\u3092\u8FFD\u52A0\u3059\u308B"] })] })] }, "create"))) }), createFailed && _jsx("p", { className: ERROR_NOTE_CLASS, children: CREATE_FAILED_MESSAGE })] }));
    /** md 以上の入力欄とシートの検索欄で共通の属性 */
    const comboboxInputProps = {
        type: "text",
        role: "combobox",
        "aria-controls": listboxId,
        "aria-autocomplete": "list",
        autoComplete: "off",
        spellCheck: false,
        placeholder,
        onChange: handleTextChange,
    };
    return (_jsxs("div", { className: cx("relative", className), children: [_jsx("input", { ...comboboxInputProps, ref: inputRef, id: inputId, "aria-expanded": open, "aria-haspopup": isDesktop ? undefined : "dialog", "aria-activedescendant": isDesktop ? activeId : undefined, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, readOnly: !isDesktop, required: required, disabled: disabled, value: open && isDesktop ? (typed ?? selectedLabel) : selectedLabel, className: cx(INPUT_CLASS, showClear ? "pr-20" : "pr-10"), 
                // フォーカスだけでは開かない（モーダルが最初の項目にフォーカスしたときに一覧を出さない）。
                // 押したとき（chevron は pointer-events-none なので入力欄が受ける）・打ったとき・↓↑ で開く
                onClick: openList, onBlur: () => {
                    if (open && isDesktop)
                        closeList();
                }, onKeyDown: handleInputKeyDown }), name !== undefined && _jsx("input", { type: "hidden", name: name, value: value ?? "" }), showClear && (_jsx("button", { type: "button", "aria-label": "\u9078\u629E\u3092\u89E3\u9664", className: "absolute right-8 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-icon hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", onClick: clear, children: _jsx(XIcon, { className: "size-5" }) })), _jsx(ChevronDownIcon, { className: "pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-icon" }), _jsx("span", { role: "status", className: "sr-only", children: status }), open &&
                isDesktop &&
                position &&
                createPortal(_jsxs("div", { ref: popupRef, className: "fixed z-250 max-h-72 overflow-y-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md", style: { top: position.top, left: position.left, width: position.width }, 
                    // 押してもフォーカスを入力欄から動かさない（離れたとみなして閉じないように）
                    onMouseDown: (e) => e.preventDefault(), children: [_jsx("span", { id: labelId, className: "sr-only", children: label }), listContent(labelId)] }), portalContainer ?? document.body), sheetOpen &&
                createPortal(_jsxs(Sheet, { titleId: titleId, title: label, onClose: () => {
                        closeList();
                        focusInput();
                    }, children: [_jsx("div", { className: "shrink-0 border-b border-border p-4", children: _jsx("input", { ...comboboxInputProps, ref: sheetInputRef, "aria-expanded": "true", "aria-labelledby": titleId, "aria-activedescendant": activeId, value: query, className: INPUT_CLASS, onKeyDown: handleListKeys }) }), _jsx("div", { className: "flex-1 overflow-y-auto pt-1 pb-[env(safe-area-inset-bottom)]", children: listContent(titleId) })] }), portalContainer ?? document.body)] }));
}
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** md 未満の全画面のシート（docs/components.md §7-3 の箱と、下層ヘッダーと同じ形のヘッダー） */
function Sheet({ titleId, title, onClose, children, }) {
    const ref = useRef(null);
    const handleKeyDown = (event) => {
        if (handleEscape(event, onClose))
            return;
        if (event.key !== "Tab" || !ref.current)
            return;
        // フォーカスをシートの中に閉じ込める
        const focusable = Array.from(ref.current.querySelectorAll(FOCUSABLE));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last)
            return;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    return (_jsxs("div", { ref: ref, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, className: "fixed inset-0 z-200 flex flex-col bg-card text-card-foreground", onKeyDown: handleKeyDown, children: [_jsxs("div", { className: "relative box-content flex h-16 shrink-0 items-center border-b border-border px-2 pt-[env(safe-area-inset-top)]", children: [_jsx("button", { type: "button", "aria-label": "\u9589\u3058\u308B", className: "flex size-11 items-center justify-center rounded-md text-foreground hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", onClick: onClose, children: _jsx(XIcon, { className: "size-6" }) }), _jsx("h2", { id: titleId, className: "pointer-events-none absolute inset-x-0 truncate px-14 text-center text-base font-bold text-foreground", children: title })] }), children] }));
}
