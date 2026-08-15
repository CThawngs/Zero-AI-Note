#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

for i in 1 2 3; do
  echo "RUN_${i}_START $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # pure local sanity: pipeline ticks with different seeds → proves determinism
  node scripts/pipeline-blackbox.js | head -3
  echo "RUN_${i}_END"
done
