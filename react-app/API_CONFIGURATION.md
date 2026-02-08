# API Configuration

The React app uses environment variables to determine which API endpoint to use.

## Environment Files

### `.env.development`
Used when running `npm run dev` (local development server)
```
VITE_API_URL=http://localhost:5000
```

### `.env.production`
Used when running `npm run build` (production build)
```
VITE_API_URL=http://137.184.124.65:5000
```

### `.env.local` (optional, gitignored)
Override for local development. Copy from `.env.local.example`:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` to use a custom API URL:
```
VITE_API_URL=http://localhost:3000  # Different port
# or
VITE_API_URL=http://192.168.1.100:5000  # Different host
```

## Usage in Code

The API URL is accessed via `import.meta.env.VITE_API_URL`:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
fetch(`${apiUrl}/api/data`);
```

## How It Works

1. **Local development** (`npm run dev`):
   - Vite loads `.env.development`
   - API calls go to `http://localhost:5000`
   - You can run the Flask API locally

2. **Production build** (`npm run build`):
   - Vite loads `.env.production`
   - API calls go to `http://137.184.124.65:5000`
   - The built app connects to the remote server

3. **Local override** (optional):
   - Create `.env.local` to override for your machine
   - This file is gitignored and won't be committed
   - Useful if you need a different port or host

## Testing

The test environment uses mock data (MSW), so the API URL doesn't affect tests.

## Deployment

When deploying to production:
1. Build the app: `npm run build`
2. The built files in `dist/` will have the production API URL baked in
3. Serve the `dist/` folder with a web server (nginx, etc.)
