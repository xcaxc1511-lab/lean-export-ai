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

## GitHub Pages

Every push to `main` builds a static, prerendered copy of the site and deploys it to
GitHub Pages (see `.github/workflows/deploy-pages.yml`). To build it locally:

```sh
GITHUB_PAGES_BASE=/lean-export-ai npx vite build   # output: dist/client
```
