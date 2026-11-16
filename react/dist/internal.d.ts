import type { SVGProps } from "react";
/** クラスをつなぐ。偽の値は飛ばす */
export declare const cx: (...classes: (string | false | null | undefined)[]) => string;
/** 線のアイコンの外枠。装飾扱い（docs/components.md §1-4 の読み上げ） */
export declare function Icon({ children, ...props }: SVGProps<SVGSVGElement>): import("react").JSX.Element;
export declare const XIcon: ({ className }: {
    className: string;
}) => import("react").JSX.Element;
