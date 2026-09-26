#!/usr/bin/env bash
# Publishes each folder in dist/subdomains/ to its own GitHub repository and serves it with GitHub Pages
# on its custom domain. Creates the repository and turns on Pages the first time; afterwards it only pushes changes.
#
#   GH_TOKEN=<token> OWNER=shayanmohd bash scripts/publish-subdomains.sh [host ...]
#
# Needs the GitHub CLI (gh) and git. The token needs: create repositories, push contents, manage Pages.
# See SUBDOMAINS.md for the token and the DNS records.
set -euo pipefail

: "${GH_TOKEN:?Set GH_TOKEN to a token that can create repositories and manage Pages}"
OWNER="${OWNER:-shayanmohd}"
SOURCE="${GITHUB_REPOSITORY:-shayanmohd/mohdshayan}"
REV="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
export GH_TOKEN

hosts=("$@")
if [ ${#hosts[@]} -eq 0 ]; then
  for d in dist/subdomains/*/; do hosts+=("$(basename "$d")"); done
fi
[ ${#hosts[@]} -gt 0 ] || { echo "Nothing in dist/subdomains/. Run: npm run build:subdomains"; exit 1; }

for host in "${hosts[@]}"; do
  dir="dist/subdomains/$host"
  repo="$OWNER/$host"
  [ -d "$dir" ] || { echo "::error::$dir does not exist"; exit 1; }

  if ! gh repo view "$repo" >/dev/null 2>&1; then
    echo "$host: creating $repo"
    gh repo create "$repo" --public --homepage "https://$host/" \
      --description "$host, generated from $SOURCE (edit it there)" >/dev/null
  fi

  work="$(mktemp -d)"
  url="https://x-access-token:${GH_TOKEN}@github.com/${repo}.git"
  # Build on the published history; only a brand-new, empty repository starts from scratch.
  # If the clone failed for any other reason the push below is rejected rather than overwriting anything.
  if ! git clone --quiet --depth 1 --branch main "$url" "$work" 2>/dev/null; then
    rm -rf "$work" && mkdir -p "$work" && git init --quiet -b main "$work"
  fi
  # Mirror the built folder exactly: remove everything but .git, then copy (so deleted files disappear too)
  find "$work" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  cp -a "$dir/." "$work/"
  git -C "$work" add -A
  if git -C "$work" diff --cached --quiet; then
    echo "$host: already up to date"
  else
    git -C "$work" -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
      commit --quiet -m "Deploy from $SOURCE@$REV"
    git -C "$work" push --quiet "$url" HEAD:main
    echo "$host: pushed"
  fi
  rm -rf "$work"

  # Serve main / (root) with GitHub Pages on the custom domain
  if ! gh api "repos/$repo/pages" >/dev/null 2>&1; then
    gh api -X POST "repos/$repo/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null && echo "$host: Pages enabled"
  fi
  gh api -X PUT "repos/$repo/pages" -f cname="$host" >/dev/null \
    || echo "::warning::$host: could not set the custom domain; check the DNS record and the domain in the repository's Pages settings"
  # HTTPS can only be enforced once GitHub has issued the certificate, which follows the first successful DNS check
  gh api -X PUT "repos/$repo/pages" -F https_enforced=true >/dev/null 2>&1 \
    || echo "$host: HTTPS is not enforced yet (the certificate is still being issued); the next deploy retries"
done
