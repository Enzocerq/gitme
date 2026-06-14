#!/usr/bin/env bash
set -euo pipefail

echo "==> Build de produção..."
npm run build

echo "==> Deploy para Cloudflare Workers..."
npx wrangler deploy

echo "==> Deploy concluído: https://gitme.enzocerq.workers.dev"
