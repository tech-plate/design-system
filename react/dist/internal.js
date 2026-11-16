import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** クラスをつなぐ。偽の値は飛ばす */
export const cx = (...classes) => classes.filter(Boolean).join(" ");
/** 線のアイコンの外枠。装飾扱い（docs/components.md §1-4 の読み上げ） */
export function Icon({ children, ...props }) {
    return (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", ...props, children: children }));
}
export const XIcon = ({ className }) => (_jsxs(Icon, { className: className, children: [_jsx("path", { d: "M18 6 6 18" }), _jsx("path", { d: "m6 6 12 12" })] }));
