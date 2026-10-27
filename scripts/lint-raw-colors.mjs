#!/usr/bin/env node
/**
 * 生カラー（トークンを通らない色）の直書きを検出する lint。依存ゼロ（node: の組み込みだけ）。
 * ルールの正本は docs/color.md §3（生カラー禁止）と §7（16進カラー・インライン style）。
 * 使い方・検出するもの・例外の書き方・設定ファイルの形式は README「生カラーの lint」が正（ここに重複して書かない）。
 *
 *   npx design-system-lint src                # パッケージの bin から
 *   node scripts/lint-raw-colors.mjs src lib  # 直接（ディレクトリでもファイルでもよい）
 *
 * 終了コード: 0 = 違反なし / 1 = 違反あり / 2 = 使い方・設定の誤り
 */

import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const CONFIG_FILE = "design-system-lint.config.json";
const DEFAULT_EXTENSIONS = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".css", ".scss", ".vue", ".svelte", ".astro"];

// 画面に出ないもの・生成物。設定ファイルの ignore はこれに足される
const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.vercel/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/coverage/**",
  "**/__tests__/**",
  "**/*.test.*",
  "**/*.spec.*",
  "**/*.d.ts",
];

const RULE_IDS = ["palette", "hex", "color-func"];

const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
// white / black は名前だけで色になるので、色を取るユーティリティに限って拾う（mix-blend 等を誤検出しない）
const COLOR_UTILITY =
  "(?:text|bg|border(?:-[xytrblse])?|ring(?:-offset)?|outline|divide|fill|stroke|placeholder|caret|accent|decoration|shadow|from|via|to)";
// 不透明度の修飾: /50 /[0.35] /(--alpha)
const OPACITY = "(?:\\/(?:\\d+|\\[[^\\]\\s]+\\]|\\([^)\\s]+\\)))?";
// 前の文字が英数・ハイフンでない位置から（variant の `:` や important の `!` の後ろも拾う）
const BOUNDARY = "(?<![\\w-])";
const END = "(?![\\w-])";

const PALETTE_CLASS_RE = new RegExp(
  `${BOUNDARY}(?:[a-z]+(?:-[a-z]+)*)-${PALETTE}-(?:50|[1-9]00|950)${OPACITY}${END}`,
  "g",
);
const WHITE_BLACK_CLASS_RE = new RegExp(`${BOUNDARY}${COLOR_UTILITY}-(?:white|black)${OPACITY}${END}`, "g");
const PALETTE_VAR_RE = new RegExp(`--color-(?:${PALETTE}-(?:50|[1-9]00|950)|white|black)${END}`, "g");
const HEX_RE = /(?<![\w&#-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
/** 数字だけの候補のうち色とみなすもの（issue 番号の #891 / #1026 を拾わない） */
const isHexColor = (hex) => /[a-fA-F]/.test(hex) || hex.length > 5 || /^#(\d)\1\1$/.test(hex);
// 中身が数値で始まる色関数（= 値の直書き）。var( / 文字列 / 変数で始まるものは拾わない。
// 前が `.` のもの（d3.rgb( 等のライブラリ呼び出し）も拾わない
const COLOR_FUNC_RE = /(?<![\w.$-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[\d.+-]/g;

const IGNORE_LINE = "design-system-lint-ignore-line";
const IGNORE_NEXT_LINE = "design-system-lint-ignore-next-line";
const IGNORE_FILE = "design-system-lint-ignore-file";
// `<directive>: <理由>` の理由（コメントの閉じ記号を除いて 1 文字以上）
const REASON_RE = new Map(
  [IGNORE_LINE, IGNORE_NEXT_LINE, IGNORE_FILE].map((d) => [d, new RegExp(`${d}\\b(?::\\s*([^*}\\n]*))?`)]),
);
const reasonOf = (text, directive) => {
  if (!text.includes(directive)) return undefined;
  const m = REASON_RE.get(directive).exec(text);
  return m ? (m[1] ?? "").trim() : undefined;
};

const USAGE = `usage: design-system-lint [--config <file>] <path> [<path> ...]

  <path>             走査するディレクトリまたはファイル（複数可）
  --config <file>    設定ファイル（既定: カレントディレクトリの ${CONFIG_FILE}。無ければ既定値）
  -h, --help         この説明を出す

終了コード: 0 = 違反なし / 1 = 違反あり / 2 = 使い方・設定の誤り
例外の書き方と設定ファイルの形式は @tech-plate/design-system の README「生カラーの lint」を参照。`;

function fail(message) {
  console.error(`design-system-lint: ${message}\n\n${USAGE}`);
  process.exit(2);
}

function parseArgs(argv) {
  const paths = [];
  let configPath = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === "--config") {
      configPath = argv[++i];
      if (!configPath) fail("--config にファイルを指定してください");
    } else if (arg.startsWith("-")) {
      fail(`不明なオプション: ${arg}`);
    } else {
      paths.push(arg);
    }
  }
  if (paths.length === 0) fail("走査するパスを指定してください");
  return { paths, configPath };
}

function loadConfig(configPath) {
  const explicit = configPath !== null;
  const file = path.resolve(configPath ?? CONFIG_FILE);
  if (!existsSync(file)) {
    if (explicit) fail(`設定ファイルがありません: ${configPath}`);
    return { baseDir: process.cwd(), extensions: DEFAULT_EXTENSIONS, ignore: [], allow: new Set(), rules: new Set(RULE_IDS) };
  }
  let json;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`設定ファイルを JSON として読めません: ${file}\n${error.message}`);
  }
  const known = new Set(["extensions", "ignore", "allow", "rules"]);
  for (const key of Object.keys(json)) if (!known.has(key)) fail(`設定ファイルの不明なキー: ${key}`);
  const list = (key) => {
    const value = json[key] ?? [];
    if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) fail(`設定ファイルの ${key} は文字列の配列にしてください`);
    return value;
  };
  const rules = new Set(RULE_IDS);
  for (const [id, enabled] of Object.entries(json.rules ?? {})) {
    if (!RULE_IDS.includes(id)) fail(`設定ファイルの rules に不明なルール: ${id}（${RULE_IDS.join(" / ")}）`);
    if (enabled === false) rules.delete(id);
  }
  const extensions = list("extensions");
  return {
    baseDir: path.dirname(file),
    extensions: extensions.length > 0 ? extensions : DEFAULT_EXTENSIONS,
    ignore: list("ignore"),
    allow: new Set(list("allow")),
    rules,
  };
}

/** gitignore 風の glob を正規表現にする。`/` を含まないパターンはどの階層の名前にも当たる */
function globToRegExp(glob) {
  // 末尾の /** は「ディレクトリの中身ごと」。ディレクトリそのものに当てて、降りる前に枝ごと切る
  const trimmed = glob.replace(/^\.?\//, "").replace(/\/\*\*$/, "");
  const pattern = glob.includes("/") ? trimmed : `**/${trimmed}`;
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      const slash = pattern[i + 2] === "/";
      re += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (ch === "*") re += "[^/]*";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  // ディレクトリに当たったら中身ごと除外する
  return new RegExp(`^${re}(?:/.*)?$`);
}

function collectFiles(paths, config) {
  const defaultRes = DEFAULT_IGNORE.map(globToRegExp);
  const configRes = config.ignore.map(globToRegExp);
  const extensions = new Set(config.extensions);
  const toPosix = (p) => p.split(path.sep).join("/");
  // 既定の除外は走査の起点からの相対で見る（起点より上の階層の名前に当たらないように）。
  // 設定ファイルの除外は設定ファイルの場所からの相対で見る
  const ignored = (full, root) => {
    const fromRoot = toPosix(path.relative(root, full));
    const fromConfig = toPosix(path.relative(config.baseDir, full));
    return defaultRes.some((re) => re.test(fromRoot)) || configRes.some((re) => re.test(fromConfig));
  };

  const files = [];
  const visit = (full, root) => {
    if (full !== root && ignored(full, root)) return;
    // シンボリックリンクは辿らない（node_modules の外へのリンクや循環を避ける）
    const stat = lstatSync(full);
    if (stat.isDirectory()) {
      for (const name of readdirSync(full).sort()) visit(path.join(full, name), root);
    } else if (stat.isFile() && extensions.has(path.extname(full))) {
      files.push(full);
    }
  };
  for (const p of paths) {
    const full = path.resolve(p);
    if (!existsSync(full)) fail(`パスがありません: ${p}`);
    // 直接指定したファイルは除外・拡張子の判定をしない
    if (statSync(full).isFile()) files.push(full);
    else visit(full, full);
  }
  return [...new Set(files)];
}

/** 位置を保ったまま空白で潰す（改行は残す） */
const blank = (text) => text.replace(/[^\n]/g, " ");

/**
 * コメントと data: URI を、行と列を保ったまま空白で潰す。
 * 文字列リテラルの中の // や /* は潰さない（クラス名は文字列の中にあるため、文字列は残す）。
 * CSS には // のコメントが無い（url(//cdn…) を壊さない）ので、.css ではブロックコメントだけ見る。
 */
function maskNonCode(content, ext) {
  const lineComments = ext !== ".css";
  let out = "";
  let i = 0;
  let quote = null;
  while (i < content.length) {
    const ch = content[i];
    const next = content[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\" && i + 1 < content.length) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === quote || (ch === "\n" && quote !== "`")) quote = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = content.indexOf("*/", i + 2);
      const stop = end === -1 ? content.length : end + 2;
      out += blank(content.slice(i, stop));
      i = stop;
      continue;
    }
    // URL の // （https:// や url(//cdn…)）はコメントではない
    if (lineComments && ch === "/" && next === "/" && content[i - 1] !== ":" && content[i - 1] !== "(") {
      const end = content.indexOf("\n", i);
      const stop = end === -1 ? content.length : end;
      out += blank(content.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      // JSX のテキストに出る '（don't）は文字列の開始ではない。英数字の直後の ' は無視する
      if (ch === "'" && /\w/.test(content[i - 1] ?? "")) {
        out += ch;
        i++;
        continue;
      }
      // data: URI（base64 や埋め込み SVG）は文字列ごと潰す。中の 16 進や空白・引用符を拾わない
      if (content.startsWith("data:", i + 1)) {
        let end = content.indexOf(ch, i + 1);
        while (end !== -1 && content[end - 1] === "\\") end = content.indexOf(ch, end + 1);
        const stop = end === -1 ? content.length : end + 1;
        out += blank(content.slice(i, stop));
        i = stop;
        continue;
      }
      quote = ch;
    }
    out += ch;
    i++;
  }
  return out;
}

/** variant（hover: / dark: / md:）と important（!）と不透明度を外したクラス名（allow の照合用） */
function baseClass(token) {
  return token.replace(/^.*:/, "").replace(/^!|!$/g, "").replace(/\/.*$/, "");
}

const MESSAGES = {
  palette: (m) =>
    `生カラー "${m}" は使わない。トークンのクラスに置き換える（text-foreground / text-muted-foreground / bg-muted / border-border / text-success 等。docs/color.md §3 の置換表）`,
  hex: (m) =>
    `16進カラー "${m}" は使わない。トークンのクラスか hsl(var(--token)) を使う（docs/color.md §7）`,
  "color-func": (m) =>
    `色関数の値の直書き "${m.replace(/\(.*$/, "")}(…)" は使わない。hsl(var(--token)) / hsl(var(--token) / 0.5) でトークンを参照する（docs/color.md §7）`,
  "missing-reason": (directive) => `${directive} に理由が無い。\`${directive}: <理由>\` の形で書く`,
};

function lintFile(file, config) {
  const content = readFileSync(file, "utf8");
  const rawLines = content.split("\n");
  const violations = [];
  const report = (line, col, rule, message) => violations.push({ line, col, rule, message });

  const head = rawLines.slice(0, 5).join("\n");
  const fileReason = reasonOf(head, IGNORE_FILE);
  if (fileReason !== undefined) {
    if (fileReason === "") report(1, 1, "missing-reason", MESSAGES["missing-reason"](IGNORE_FILE));
    return violations;
  }

  const lines = maskNonCode(content, path.extname(file)).split("\n");
  const matchers = [
    ["palette", PALETTE_CLASS_RE],
    ["palette", WHITE_BLACK_CLASS_RE],
    ["palette", PALETTE_VAR_RE],
    ["hex", HEX_RE],
    ["color-func", COLOR_FUNC_RE],
  ].filter(([rule]) => config.rules.has(rule));

  lines.forEach((text, idx) => {
    const lineReason = reasonOf(rawLines[idx], IGNORE_LINE);
    const nextReason = idx > 0 ? reasonOf(rawLines[idx - 1], IGNORE_NEXT_LINE) : undefined;
    if (lineReason === "") report(idx + 1, 1, "missing-reason", MESSAGES["missing-reason"](IGNORE_LINE));
    if (nextReason === "") report(idx, 1, "missing-reason", MESSAGES["missing-reason"](IGNORE_NEXT_LINE));
    if (lineReason !== undefined || nextReason !== undefined) return;

    for (const [rule, re] of matchers) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (rule === "palette" && config.allow.has(baseClass(m[0]))) continue;
        if (rule === "hex" && !isHexColor(m[0])) continue;
        report(idx + 1, m.index + 1, rule, MESSAGES[rule](m[0]));
      }
    }
  });
  return violations.sort((a, b) => a.line - b.line || a.col - b.col);
}

function main() {
  const { paths, configPath } = parseArgs(process.argv.slice(2));
  const config = loadConfig(configPath);
  const files = collectFiles(paths, config);
  let total = 0;
  const byRule = new Map();
  for (const file of files) {
    const violations = lintFile(file, config);
    if (violations.length === 0) continue;
    const rel = path.relative(process.cwd(), file) || file;
    for (const v of violations) {
      total++;
      byRule.set(v.rule, (byRule.get(v.rule) ?? 0) + 1);
      console.error(`${rel}:${v.line}:${v.col}  [${v.rule}] ${v.message}`);
    }
  }
  if (total > 0) {
    const counts = [...byRule].map(([rule, n]) => `${rule} ${n}`).join(" / ");
    console.error(
      `\ndesign-system-lint: ${files.length} ファイル中 ${total} 件の違反（${counts}）。` +
        `\n例外にするときは理由を添えて ${IGNORE_LINE} / ${IGNORE_NEXT_LINE} / ${IGNORE_FILE} を書くか、${CONFIG_FILE} の ignore / allow に足す。`,
    );
    process.exit(1);
  }
  console.log(`design-system-lint: OK（${files.length} ファイル、違反 0 件）`);
}

main();
