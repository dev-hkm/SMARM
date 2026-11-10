<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Smarm

This project uses Vite + React.

## Run locally

Prerequisite: Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.dev.vars` and set the backend secrets.
3. Start the dev server:
   `npm run pages:dev`

## Deploy to Cloudflare Pages

1. Apply D1 schema once: `npm run db:migrate`
2. Add secrets once with Wrangler:
   `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `CLOUDFLARE_AI_API_KEY`, `FREEMODEL_API_KEY`, `NVIDIA_API_KEY`, `EXA_API_KEY`, `EXA_API_KEY_2`, `EXA_API_KEY_3`, and `AUTH_SECRET`
3. Deploy frontend and Pages Functions together: `npm run deploy`

AI fallback order:

- DeepSeek `deepseek-v4-flash`
- Mistral `mistral-small-latest`, then `mistral-medium-latest`
- FreeModel `gpt-5.4-mini`, `gpt-5.4`, then `gpt-5.5`
- NVIDIA `moonshotai/kimi-k2.6`, `z-ai/glm-5.1`, then `minimaxai/minimax-m2.7`
- Cloudflare Workers AI `@cf/openai/gpt-oss-120b`, `@cf/zai-org/glm-5.2`, then `@cf/moonshotai/kimi-k2.7-code`

Exa fallback order:

- `EXA_API_KEY`
- `EXA_API_KEY_2`
- `EXA_API_KEY_3`

Important:

- Do not deploy with dashboard drag-and-drop: it uploads only static files and omits Pages Functions.
- `functions/` stays in the repository root and is deployed automatically by Wrangler.

## Clean build output

To remove generated deploy folders:

`npm run clean`
