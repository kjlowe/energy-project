# 🚀 Server Recovery & GitHub-Based Redeployment Guide

This guide explains how to rebuild your server from scratch and fully restore your project using only your GitHub repo.

---

## 📦 Prerequisites

- A fresh Ubuntu server (e.g. DigitalOcean Droplet)
- Your GitHub SSH deploy key added to the server
- Root access to the machine
- Your GitHub repo contains:
  - `docker-compose.yml`
  - `nginx/` configs
  - `jupyter/`, `php-app/`, `python-app/`, etc.
  - `.env` and/or secrets stored securely (manually or restored later)

---

## ✅ Step-by-Step Recovery

### 1. SSH into your new server

```bash
ssh root@your.server.ip# energy-project
```




