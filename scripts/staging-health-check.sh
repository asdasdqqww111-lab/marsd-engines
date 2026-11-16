#!/usr/bin/env bash
# HUDHUD G-02 — فحص عقود الصحة عبر كل التطبيقات (staging acceptance).
#
# الاستخدام:
#   HUDHUD_BASE_URLS="verify=https://stg.example.com,identity=https://..." \
#     bash scripts/staging-health-check.sh
#
# أو بدون متغير: يقرأ HUDHUD_APP_*_URL من البيئة مباشرة (نظام العناوين المركزي H-01).
#
# المخرجات: جدول لكل تطبيق: PASS / FAIL / NOT RUN (عنوان غير مضبوط) — صادق دائمًا.
# كود الخروج: 0 إذا لم يكن هناك FAIL، 1 إذا فشل أي عقد مضبوط.
# هذا فحص شبكي فقط — لا يفحص منطق التطبيقات (انظر STAGING-ACCEPTANCE.md §3).

set -euo pipefail

declare -a APP_KEYS=(portal identity verify connect community maps news analytics)
declare -A URL_VARS=(
  [portal]="HUDHUD_CONTROL_URL"
  [identity]="HUDHUD_APP_ZEXA_URL"
  [verify]="HUDHUD_APP_LOKI_URL"
  [connect]="HUDHUD_APP_NCHAT_URL"
  [community]="HUDHUD_APP_RHEX_URL"
  [maps]="HUDHUD_APP_OSIRIS_URL"
  [news]="HUDHUD_APP_NEUREED_URL"
  [analytics]="HUDHUD_APP_UMAMI_URL"
)
declare -A PATHS=(
  [portal]="/api/health"
  [identity]="/api/health"
  [verify]="/api/health"
  [connect]="/api/health"
  [community]="/api/health"
  [maps]="/api/health"
  [news]="/api/health"
  [analytics]="/api/heartbeat"
)

# عنوان خاص إن ضُبط: HUDHUD_BASE_URLS="key=https://...,key2=https://..."
declare -A BASE_URLS
if [[ -n "${HUDHUD_BASE_URLS:-}" ]]; then
  IFS=',' read -ra PAIRS <<< "$HUDHUD_BASE_URLS"
  for pair in "${PAIRS[@]}"; do
    key="${pair%%=*}"; val="${pair#*=}"
    BASE_URLS["$key"]="$val"
  done
fi

failures=0
notrun=0
printf "%-12s %-10s %-8s %s\n" "APP" "STATUS" "HTTP" "DETAIL"
printf -- "---------------------------------------------------------------\n"

for app in "${APP_KEYS[@]}"; do
  base="${BASE_URLS[$app]:-}"
  if [[ -z "$base" ]]; then
    var="${URL_VARS[$app]}"
    base="${!var:-}"
  fi
  if [[ -z "$base" ]]; then
    printf "%-12s %-10s %-8s %s\n" "$app" "NOT RUN" "—" "عنوان غير مضبوط (${var})"
    notrun=$((notrun+1))
    continue
  fi

  url="${base%/}${PATHS[$app]}"
  body="$(curl -sS --max-time 10 -w '\n%{http_code}' "$url" 2>/dev/null || echo -e "\n000")"
  code="${body##*$'\n'}"
  payload="${body%$'\n'*}"

  if [[ "$code" == "200" ]]; then
    # loki: تحقق readiness الفعلي إن وُجد في الجسم
    level=""
    if command -v python3 >/dev/null 2>&1; then
      level="$(printf '%s' "$payload" | python3 -c \
        'import json,sys
try:
  d=json.load(sys.stdin)
  r=d.get("readiness") or {}
  print(r.get("level","") or "")
except Exception:
  print("")' 2>/dev/null || true)"
    fi
    if [[ "$app" == "verify" && -n "$level" && "$level" != "ready" ]]; then
      printf "%-12s %-10s %-8s %s\n" "$app" "FAIL" "$code" "readiness=$level (المتطلب: ready)"
      failures=$((failures+1))
    else
      printf "%-12s %-10s %-8s %s\n" "$app" "PASS" "$code" "${level:+readiness=$level}"
    fi
  else
    printf "%-12s %-10s %-8s %s\n" "$app" "FAIL" "$code" "$url"
    failures=$((failures+1))
  fi
done

printf -- "---------------------------------------------------------------\n"
printf "الخلاصة: FAIL=%d · NOT RUN=%d · PASS=%d\n" "$failures" "$notrun" \
  $(( ${#APP_KEYS[@]} - failures - notrun ))
if [[ "$failures" -gt 0 ]]; then exit 1; fi
exit 0
