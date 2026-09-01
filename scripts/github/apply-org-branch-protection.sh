#!/usr/bin/env bash
# Aplica protección de rama en repos de la org shellaquiles.
#
# Uso:
#   gh auth refresh -h github.com -s admin:org,repo
#   ./scripts/github/apply-org-branch-protection.sh              # base (PR obligatorio)
#   ./scripts/github/apply-org-branch-protection.sh --with-ci    # incluye checks por repo (manifest)
#
# Plan Free: no hay Organization Rulesets; este script es el equivalente manual.
# Plan Team: preferir Rulesets en Settings → Rules → Rulesets (org-wide).

set -euo pipefail

ORG="${ORG:-shellaquiles}"
WITH_CI=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --with-ci) WITH_CI=true ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

# Repo → rama default → checks CI (solo si --with-ci). Vacío = solo PR obligatorio.
declare -A REPO_BRANCH=(
  [shellaquiles-org]=main
  [frases-chingonas]=main
  [cron-quiles]=main
  [KARNITAS]=main
  [pandocquiles]=main
  [tribuTACOS]=main
  [stats]=dev
)

declare -A REPO_CHECKS=(
  [tribuTACOS]="backend-test,frontend-lint-build,standalone-build,docker-build"
  [cron-quiles]="tests"
  # Añade más repos cuando tengas los nombres exactos de los jobs en GitHub Actions.
)

base_payload() {
  local checks_json="null"
  if [[ "$WITH_CI" == true && -n "${REPO_CHECKS[$1]:-}" ]]; then
    local IFS=,
    local contexts=(${REPO_CHECKS[$1]})
    local arr=""
    for c in "${contexts[@]}"; do
      arr+="\"$c\","
    done
    arr="${arr%,}"
    checks_json="{\"strict\":true,\"contexts\":[$arr]}"
  fi

  cat <<EOF
{
  "required_status_checks": $checks_json,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": false
}
EOF
}

for repo in "${!REPO_BRANCH[@]}"; do
  branch="${REPO_BRANCH[$repo]}"
  echo "→ $ORG/$repo ($branch)"

  if [[ "$DRY_RUN" == true ]]; then
    base_payload "$repo"
    echo "---"
    continue
  fi

  if [[ "$repo" == "tribuTACOS" && "$WITH_CI" != true ]]; then
    echo "  ↷ omitido (usar --with-ci para tribuTACOS; tiene checks específicos)"
    continue
  fi

  if ! gh api "repos/$ORG/$repo/branches/$branch" &>/dev/null; then
    echo "  ⚠ rama $branch no existe, omitido"
    continue
  fi

  tmp=$(mktemp)
  base_payload "$repo" > "$tmp"
  if gh api --method PUT "repos/$ORG/$repo/branches/$branch/protection" --input "$tmp" &>/dev/null; then
    echo "  ✓ protección aplicada"
  else
    echo "  ✗ error (¿permisos admin:org?)"
  fi
  rm -f "$tmp"
done

echo "Listo."
