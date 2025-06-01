# 🚀 GitHub-Based Redeployment Guide

This guide explains how to rebuild the server from scratch and fully restore your project using only your GitHub repo.

---

## 📦 Prerequisites

- A fresh Ubuntu server (e.g. DigitalOcean Droplet)
- Root access to the machine.

---

## ✅ Step-by-Step Recovery

### 1. SSH into your new server

ssh in
```bash
ssh root@your.server.ip
```

generate ssh keys
```bash
ssh-keygen -t ed25519 -C "digitalocean-server"
```

```bash
cat ~/.ssh/id_ed25519.pub
```

Go to Settings > SSH and GPG keys
	•	Click New SSH key
	•	Title it DigitalOcean
	•	Paste your public key into the field

checkout the repo
```bash
mkdir  ~/web-projects
git clone git@github.com:kjlowe/energy-project.git
git config --global user.name "Kevin Lowe"
git config --global user.email "username@gmail.com"
ssh -T git@github.com
```


Setup github actions secrets

```bash
cat ~/.ssh/id_ed25519
```

On GitHub, go to your repo → Settings > Secrets > Actions
	2.	Add these secrets:
	•	DO_HOST: the IP address of the server
	•	DO_USER: root
	•	DO_SSH_KEY: your private SSH key (contents of ~/.ssh/id_ed25519)

Re-run last action and everything shohul deploy!


 




















