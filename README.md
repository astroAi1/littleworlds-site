# Little Worlds

An art-first digital home for Little Worlds and Pepori, built with React and Vite.

## Run locally

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:4173/` in the current development setup.

Live collection artwork, metadata and sales are loaded through the OpenSea v2 API. Keep the API key on the server by either setting `OPENSEA_API_KEY` or saving an instant development key response as `.opensea-key.json`:

```bash
curl -sS -X POST https://api.opensea.io/api/v2/auth/keys -o .opensea-key.json
```

Instant keys expire after seven days. Use a long-lived OpenSea developer key in the deployment environment.

## Production build

```bash
npm run build
npm run preview
```

Collection: `0x3dfeb685ec0857f9595197044412a2f4ba636fe0`
