# Welcome to your AI Studio project

This project was built with AI Studio.

## Development

Prefer working locally? You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deployment

Live site (frontend + backend + D1): https://lean-export.daotaoleandigi.workers.dev

Every push to `main` builds and deploys to Cloudflare Workers via
`.github/workflows/deploy-cloudflare.yml` (needs the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets). Manual deploy:

```sh
npm run build:cf
npm run deploy:cf
```

See `DEPLOY.md` (Vietnamese) for first-time setup, secrets and backups.

A static, backend-less preview can still be built with
`GITHUB_PAGES_BASE=/<repo> npx vite build` (output: `dist/client`), but it is no longer published.
