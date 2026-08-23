#!/usr/bin/env bash
# Retries a command on failure with exponential backoff. Cloudflare's API
# occasionally returns a transient 503 ("upstream connect error") on deploy
# calls that succeed on a second attempt seconds later — this exists so CI
# doesn't need a human to click "re-run failed jobs" for that.
set -euo pipefail

max_attempts="${RETRY_MAX_ATTEMPTS:-3}"
base_delay="${RETRY_BASE_DELAY_SECONDS:-10}"

attempt=1
until "$@"; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "::error::'$*' failed after $attempt attempts" >&2
    exit 1
  fi
  delay=$((base_delay * attempt))
  echo "'$*' failed (attempt $attempt/$max_attempts), retrying in ${delay}s..." >&2
  sleep "$delay"
  attempt=$((attempt + 1))
done
