#!/usr/bin/env bash
# Quick end-to-end check: walks a demo user (Aina) through the main API flow and prints key results.
# Values are not asserted; compare the output with the "expect ..." hints by eye.
# Usage: start the server (`npm start`), then run `bash scripts/smoke.sh` from backend/.
# Set BASE=http://host:port/api if the server is not on localhost:8787.
# Run it after a deploy, a database reset or a big change, alongside `npm test`, not instead of it.
set -euo pipefail

BASE="${BASE:-http://localhost:8787/api}"

command -v jq >/dev/null 2>&1 || { echo "jq is required for the smoke test."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required for the smoke test."; exit 1; }

echo "==> Demo session (Aina)"
SESSION=$(curl -sS -X POST "$BASE/demo/session" -H 'content-type: application/json' -d '{"personaKey":"aina"}')
TOKEN=$(echo "$SESSION" | jq -r '.data.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to create a demo session:"
  echo "$SESSION" | jq
  exit 1
fi
echo "token: ${TOKEN:0:12}..."

echo "==> /me (expect started false, no target)"
curl -sS "$BASE/me" -H "authorization: Bearer $TOKEN" | jq '{name: .data.profile.name, started: .data.journey.started, target: .data.journey.target, skills: (.data.profile.scores | length)}'

echo "==> Onboarding"
curl -sS -X PUT "$BASE/me/onboarding" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Aina Rahman","hours":5,"mode":"Online","interests":["data","technology"]}' \
  | jq '{started: .data.journey.started, preferences: .data.journey.preferences}'

echo "==> Ranked careers"
curl -sS "$BASE/careers?sort=match" -H "authorization: Bearer $TOKEN" | jq '.data | map({id, fit})'

echo "==> Junior Data Analyst compatibility (expect fit 61, skills 54)"
curl -sS "$BASE/careers/junior-data-analyst" -H "authorization: Bearer $TOKEN" | jq '.data.compatibility'

echo "==> Choose target"
curl -sS -X PUT "$BASE/me/target" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"target":"junior-data-analyst"}' | jq '{target: .data.journey.target, invalidated: .data.invalidated}'

echo "==> Suggested training"
curl -sS "$BASE/training?view=suggested" -H "authorization: Bearer $TOKEN" | jq '.data | map({id, provider, relevance})'

echo "==> Generate roadmap at 5 hours/week (expect 11 tasks)"
curl -sS -X POST "$BASE/me/roadmap" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"hours":5,"start-date":"2026-11-20"}' \
  | jq '{weeks: [.data.phases[].weeks], skills: .data.roadmap.skillIds, courses: .data.roadmap.courseIds, total: .data.progress.total, next: .data.progress.next.title}'

echo "==> Complete skill-sql"
curl -sS -X PATCH "$BASE/me/roadmap/tasks/skill-sql" -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"completed":true}' | jq '.data'

echo "==> AI assessment"
curl -sS -X POST "$BASE/ai/assessment" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"narrative":"I used Excel to track stock and wrote SQL queries for a class project."}' \
  | jq '.data.detectedSkills | map({skillId, confidence, suggestedLevel})'

echo "Smoke test complete."
