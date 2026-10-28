#!/usr/bin/env bash
# Edit kit: change the dashboards from a Claude chat (code execution) or any computer with git and bash.
# Run from the repo root (see CLAUDE.md):
#   bash tools/edit/edit.sh start            start an edit from the latest main
#   bash tools/edit/edit.sh submit           commit the change and send it to GitHub for building and checking
#   bash tools/edit/edit.sh wait [seconds]   wait for the result (default 240 s; run again while it is still building)
#   bash tools/edit/edit.sh publish          put the checked edit live (only when the person says so)
#   bash tools/edit/edit.sh refresh          rebase the edit on the latest main (after a clash), then submit again
#   bash tools/edit/edit.sh discard          drop the edit; nothing is published
#   bash tools/edit/edit.sh undo [id]        undo the last published edit, or the one with this id
#   bash tools/edit/edit.sh list             recent published and undone edits
# The GitHub key comes from $GPC_KEY or a file named gpc-github-key.txt among the project files. It is passed to git
# as a request header on each call and is never printed or written to the repo's config. Without a key, git uses the
# computer's own sign-in. The checks themselves run on GitHub (.github/workflows/preview.yml), not here.
set -euo pipefail

FORBIDDEN='^(data\.js|market\.js|diligence\.js|ems/data\.js|index\.html|ems/index\.html|team\.js|qa\.ps1|CLAUDE\.md|docs/palette-report\.txt|\.gitattributes)$|^(\.github|tools|scripts)/'
BOT=(-c user.name=dashboard-edit-bot -c user.email=project4-gpc@users.noreply.github.com)
SITE="https://project4-gpc.github.io/listed-fs-dashboard/"

root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Run this inside the dashboard repo (see CLAUDE.md)." >&2; exit 1; }
cd "$root"
state="$root/.git/gpc-edit-id"

die(){ echo "STOPPED: $*" >&2; exit 1; }

find_key(){
  if [ -n "${GPC_KEY:-}" ]; then printf '%s' "$GPC_KEY"; return 0; fi
  local d f
  for d in /mnt /home /root "$root/.."; do
    [ -d "$d" ] || continue
    f="$(find "$d" -maxdepth 4 -type f -iname 'gpc-github-key*' 2>/dev/null | head -n1 || true)"
    if [ -n "$f" ]; then grep -oE '(github_pat_|ghp_)[A-Za-z0-9_]+' "$f" | head -n1 || true; return 0; fi
  done
}
KEY="$(find_key || true)"

g(){ # git, authenticated with the key when there is one
  if [ -n "$KEY" ]; then
    git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $(printf 'x-access-token:%s' "$KEY" | base64 | tr -d '\n')" "$@"
  else
    git "$@"
  fi
}

push(){ # git push without GitHub's chatter; shows git's output only when the push fails
  local out
  if out="$(g push -q "$@" 2>&1)"; then return 0; fi
  echo "$out" | grep -v '^remote: *$' >&2
  return 1
}

cur_id(){ [ -f "$state" ] || die "no edit in progress here; run: bash tools/edit/edit.sh start"; cat "$state"; }

result_of(){ # result.txt of preview/<id>, or nothing
  g fetch -q origin "+refs/heads/preview/$1:refs/remotes/origin/preview/$1" 2>/dev/null || return 0
  git show "origin/preview/$1:result.txt" 2>/dev/null || true
}

cmd_start(){
  [ -z "$(git status --porcelain)" ] || die "there are unsaved changes here; submit or discard them first"
  g fetch -q origin main
  local id
  id="$(date -u +%Y%m%d-%H%M)-$(od -An -N2 -tx1 /dev/urandom | tr -d ' \n')"
  git checkout -q -B "edit/$id" origin/main
  echo "$id" > "$state"
  grep -qx 'preview-out/' .git/info/exclude 2>/dev/null || echo 'preview-out/' >> .git/info/exclude
  echo "Edit $id started from the latest version. Make the change, then run: bash tools/edit/edit.sh submit"
}

cmd_submit(){
  local id base changed bad f
  id="$(cur_id)"
  [ "$(git branch --show-current)" = "edit/$id" ] || die "switch back to the edit first: git checkout edit/$id"
  git add -A
  base="$(git merge-base HEAD origin/main)"
  changed="$(git diff --cached --name-only "$base")"
  [ -n "$changed" ] || die "nothing has changed yet"
  bad="$(grep -E "$FORBIDDEN" <<<"$changed" || true)"
  if [ -n "$bad" ]; then git reset -q; die "these files must not be changed (see CLAUDE.md); undo your changes to them:
$bad"; fi
  if command -v node >/dev/null 2>&1; then
    for f in $(grep -E '\.js$' <<<"$changed" || true); do
      if [ -f "$f" ] && ! node --check "$f"; then die "$f has a syntax error (above); fix it and submit again"; fi
    done
  fi
  git diff --cached --quiet || git "${BOT[@]}" commit -q -m "Dashboard edit $id"
  push -f origin "edit/$id" || die "could not send the edit to GitHub (see above)"
  echo "Sent edit $id ($(git rev-parse --short HEAD)) to GitHub. Building and checking takes 4-8 minutes."
  echo "Next: bash tools/edit/edit.sh wait"
}

report(){
  local id="$1" res="$2" status changed out k file
  status="$(sed -n 's/^status=//p' <<<"$res")"
  changed="$(sed -n 's/^changed=//p' <<<"$res")"
  if [ "$status" != pass ]; then
    echo "FAILED the checks ($(sed -n 's/^failed=//p' <<<"$res")). Details below; fix the cause, then submit and wait again."
    sed -n '/^---$/,$p' <<<"$res" | sed 1d
    return 0
  fi
  out="$root/preview-out"; [ -d /mnt/user-data/outputs ] && out=/mnt/user-data/outputs
  mkdir -p "$out"
  for k in ${changed//,/ }; do
    case "$k" in fs) file=index.html ;; ems) file=ems/index.html ;; *) continue ;; esac
    git show "origin/preview/$id:$file" > "$out/preview-$k-$id.html"
    echo "Preview of the $(tr a-z A-Z <<<"$k") dashboard: $out/preview-$k-$id.html"
  done
  [ -n "$changed" ] || echo "No dashboard looks different (documentation only)."
  echo "PASSED every check. Share the preview file(s) above with the person and explain the change in plain words."
  echo "Publish only when they say so: bash tools/edit/edit.sh publish"
}

cmd_wait(){
  local id sha end res
  id="$(cur_id)"; sha="$(git rev-parse HEAD)"; end=$(( $(date +%s) + ${1:-240} ))
  while :; do
    res="$(result_of "$id")"
    if grep -qx "commit=$sha" <<<"$res"; then report "$id" "$res"; return 0; fi
    if [ "$(date +%s)" -ge "$end" ]; then echo "Still building and checking edit $id. Run again: bash tools/edit/edit.sh wait"; return 0; fi
    sleep 20
  done
}

cmd_publish(){
  local id sha res ok=""
  id="$(cur_id)"; sha="$(git rev-parse HEAD)"
  [ -z "$(git status --porcelain)" ] || die "there are changes that have not been checked yet; run submit, then wait"
  res="$(result_of "$id")"
  grep -qx "commit=$sha" <<<"$res" || die "this version has not been checked yet; run submit, then wait"
  grep -qx 'status=pass' <<<"$res" || die "this version failed the checks; fix it, then submit and wait again"
  for _ in 1 2 3; do
    g fetch -q origin main
    git checkout -q --detach origin/main
    if ! git "${BOT[@]}" merge -q --no-ff -m "Dashboard edit $id" "edit/$id"; then
      git merge --abort 2>/dev/null || true; git checkout -q "edit/$id"
      die "the edit clashes with newer changes. Run: bash tools/edit/edit.sh refresh, then submit and wait again"
    fi
    if push origin HEAD:main; then ok=1; break; fi
    sleep 5
  done
  git checkout -q "edit/$id"
  [ -n "$ok" ] || die "could not publish because the live version kept changing; run publish again"
  push origin --delete "edit/$id" "preview/$id" 2>/dev/null || true
  rm -f "$state"
  echo "Published edit $id. The live dashboards update in about 3-5 minutes (refresh the page): $SITE"
  echo "To undo it: bash tools/edit/edit.sh undo $id"
}

cmd_refresh(){
  local id; id="$(cur_id)"
  [ -z "$(git status --porcelain)" ] || die "submit or discard the current changes first"
  g fetch -q origin main
  if ! git rebase -q origin/main; then
    git rebase --abort 2>/dev/null || true
    die "the edit overlaps newer changes to the same lines; discard it, start again and redo the change"
  fi
  echo "Edit $id now builds on the latest version. Next: submit, then wait."
}

cmd_discard(){
  local id; id="$(cur_id)"
  push origin --delete "edit/$id" "preview/$id" 2>/dev/null || true
  g fetch -q origin main
  git checkout -q -f --detach origin/main
  git branch -q -D "edit/$id" 2>/dev/null || true
  rm -f "$state"
  echo "Discarded edit $id. Nothing was published."
}

cmd_undo(){
  local want="${1:-}" h id target="" tid="" ok=""
  g fetch -q origin main
  for h in $(git log origin/main --merges --format=%H --grep='^Dashboard edit ' -n 30); do
    id="$(git log -1 --format=%s "$h")"; id="${id#Dashboard edit }"
    if [ -n "$want" ] && [ "$id" != "$want" ]; then continue; fi
    if [ -n "$(git log origin/main --format=%H -n1 --grep="^Undo dashboard edit $id\$")" ]; then
      [ -z "$want" ] || die "edit $id has already been undone"
      continue
    fi
    target="$h"; tid="$id"; break
  done
  [ -n "$target" ] || die "found no published edit to undo${want:+ with id $want}"
  for _ in 1 2 3; do
    g fetch -q origin main
    git checkout -q -f --detach origin/main
    if ! git "${BOT[@]}" revert --no-edit -m 1 "$target" >/dev/null; then
      git revert --abort 2>/dev/null || true
      die "later edits build on edit $tid, so it can't be undone on its own; undo the later edits first"
    fi
    git "${BOT[@]}" commit -q --amend -m "Undo dashboard edit $tid"
    if push origin HEAD:main; then ok=1; break; fi
    sleep 5
  done
  [ -n "$ok" ] || die "could not undo because the live version kept changing; run undo again"
  echo "Undid edit $tid. The live dashboards update in about 3-5 minutes: $SITE"
}

cmd_list(){
  g fetch -q origin main
  TZ=UTC git log origin/main -n 20 --date=format-local:'%d %b %Y %H:%M' --format='%ad UTC  %s' --grep='^Dashboard edit ' --grep='^Undo dashboard edit '
}

case "${1:-}" in
  start) cmd_start ;;
  submit) cmd_submit ;;
  wait) cmd_wait "${2:-240}" ;;
  publish) cmd_publish ;;
  refresh) cmd_refresh ;;
  discard) cmd_discard ;;
  undo) cmd_undo "${2:-}" ;;
  list) cmd_list ;;
  *) sed -n '2,11p' "$0"; exit 1 ;;
esac
