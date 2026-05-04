# Web Tax Estimator

Tax estimator with W-2 and 1099 upload support.

## Local development

1. Copy `.env.example` to `.env`
2. Add your `OPENAI_API_KEY`
3. Install dependencies
4. Run:

```bash
npm install
npm run dev
```

The frontend runs on Vite and proxies `/api/*` requests to the local Express server on port `3001`.

## Production deployment

This repo now includes a Vercel serverless function at `api/extract-tax-doc.ts`, so the deployed frontend can post to `/api/extract-tax-doc` without depending on `localhost`.

Set this environment variable in Vercel:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Notes

- The upload form field is `document`
- You can optionally set `VITE_API_BASE_URL` if you want the frontend to call a separate backend
