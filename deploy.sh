#!/bin/bash
# deploy.sh – triggar Vercel efter push
git push && curl -X POST "DIN_DEPLOY_HOOK_URL"