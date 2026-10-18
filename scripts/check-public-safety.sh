#!/usr/bin/env bash
#
# 公開リポジトリに個人のメールアドレスを載せないための検査。理由と運用は README「公開リポジトリとしての注意」。
#
# 使い方: bash scripts/check-public-safety.sh   (全履歴を見るので clone は fetch-depth 0 で)
# PR の本文も見るときは環境変数 PR_TEXT にタイトルと本文を入れる。
#
set -euo pipefail

# 作者欄に許すのは GitHub の代用アドレスだけ(Settings → Emails の noreply)
ALLOWED_AUTHOR='(@users\.noreply\.github\.com|^noreply@github\.com)$'
# 本文に出てよいもの: README の `git@github.com` / `$GITHUB_TOKEN@github.com`、例示用ドメイン、
# Co-Authored-By などに入るサービスの noreply
ALLOWED_TEXT='(@((users\.noreply\.)?github\.com|example\.(com|org|net|jp))|^noreply@[A-Za-z0-9.-]+)$'
EMAIL='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'

failed=0

report() {
  [[ -n "$2" ]] || return 0
  echo "::error::$1"
  echo "$2"
  failed=1
}

report "コミット・タグの作者欄に noreply 以外のアドレスがある(push 済みなら履歴の書き換えが要る):" "$(
  {
    git log --all --format='%ae%n%ce'
    git for-each-ref refs/tags --format='%(taggeremail)' | tr -d '<>'
  } | grep -vE "^$|${ALLOWED_AUTHOR}" | sort -u || true
)"

# Co-Authored-By のトレーラーは作者欄の検査に掛からない
report "コミットメッセージにメールアドレスがある:" "$(
  git log --all --format=%B | grep -oE "${EMAIL}" | grep -vE "${ALLOWED_TEXT}" | sort -u || true
)"

report "ファイルにメールアドレスがある(例示なら example.com を使う):" "$(
  git grep -nIoE "${EMAIL}" -- . ':!scripts/check-public-safety.sh' | grep -vE "${ALLOWED_TEXT}" || true
)"

report "PR のタイトル・本文にメールアドレスがある(投稿した時点で公開済み。消して GitHub の編集履歴も削除する):" "$(
  grep -oE "${EMAIL}" <<<"${PR_TEXT:-}" | grep -vE "${ALLOWED_TEXT}" || true
)"

exit "${failed}"
