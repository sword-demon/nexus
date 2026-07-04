#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$ROOT_DIR/node_modules/.bin:$PATH"

npm run electron:build
electron-builder install-app-deps
electron-builder --mac
