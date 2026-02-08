# Deployment Guide

## Quick Start - Staging Server

Your staging server (cloud development server) is configured in `docker-compose.yml`.

### Start the Server

```bash
docker-compose up -d
```

This will:
- Run the Python Flask API on port 5000
- Run the React dev server on port 5173
- Use `.env.staging` for API configuration
- Connect to API at `http://137.184.124.65:5000`

### Access the App

**React App:** http://137.184.124.65:5173
**Flask API:** http://137.184.124.65:5000

### View Logs

```bash
# All services
docker-compose logs -f

# Just React
docker-compose logs -f react-app

# Just Python
docker-compose logs -f python
```

### Stop the Server

```bash
docker-compose down
```

### Restart After Code Changes

```bash
# React (hot reload usually works automatically)
docker-compose restart react-app

# Python
docker-compose restart python
```

---

## Environment Configuration

The staging server uses **`.env.staging`**:

```
VITE_API_URL=http://137.184.124.65:5000
```

This is loaded by Vite when running with `--mode staging` flag.

See [react-app/API_CONFIGURATION.md](react-app/API_CONFIGURATION.md) for full details.

---

## Files Overview

**Current Setup: Staging/Development Only**

- **`docker-compose.yml`** - Staging/cloud development server configuration
- **`react-app/.env.development`** - Local development environment (localhost:5000)
- **`react-app/.env.staging`** - Staging server environment (137.184.124.65:5000)

> **Note:** This setup is currently configured for development/staging only. Production deployment files are not yet created.

---

## Troubleshooting

### React app shows "No billing data available"
- Check if Flask API is running: `curl http://137.184.124.65:5000/api/billing-years`
- Check React logs: `docker-compose logs react-app`
- Verify API URL in browser network tab

### Port already in use
```bash
# Stop all containers
docker-compose down

# Check what's using the port
sudo lsof -i :5173
sudo lsof -i :5000

# Start again
docker-compose up -d
```

### Container keeps restarting
```bash
# Check logs for errors
docker-compose logs react-app
docker-compose logs python
```