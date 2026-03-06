#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "development" ]]; then
  # Don't build
  echo "🛑 - Build cancelled (development branch isolation)"
  exit 0;
else
  # Proceed with the build
  echo "✅ - Build can proceed (not development branch)"
  exit 1;
fi
