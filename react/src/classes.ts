/** 偽の値を除いてクラスをつなぐ */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/** ボタン・一覧の中の小さなスピナー（size-4） */
export const SPINNER_CLASS =
  "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none";
