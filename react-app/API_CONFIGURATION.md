# API Configuration

The React app uses environment variables to determine which API endpoint to use.

## Environment Files

### `.env.development`
Used when running `npm run dev` (local development server)
```
VITE_API_URL=http://localhost:5000
```

### `.env.staging`
Used when running `npm run dev -- --mode staging` (staging/cloud server)
```
VITE_API_URL=http://137.184.124.65:5000
```

## Usage in Code

The API URL is accessed via `import.meta.env.VITE_API_URL`:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
fetch(`${apiUrl}/api/billing-years`);
```

## How It Works

1. **Local development** (`npm run dev`):
   - Vite loads `.env.development`
   - API calls go to `http://localhost:5000`
   - You can run the Flask API locally

2. **Staging server** (`npm run dev -- --mode staging`):
   - Vite loads `.env.staging`
   - API calls go to `http://137.184.124.65:5000`
   - Used by `docker-compose.yml` for cloud development server

## Testing

The test environment uses mock data (MSW), so the API URL doesn't affect tests.

## Deployment

### Staging/Cloud Development Server
Used by `docker-compose.yml`:
```bash
docker-compose up -d
# Runs: npm run dev -- --mode staging
# Loads: .env.staging
```
