# New Server Setup

This guide explains how to rebuild the server from scratch and fully restore your project using only your GitHub repo.

---

# 1. Create a new server
Start with 1 vCPU, 1–2GB RAM server (~$5–6/month)
Pick Ubuntu 22.04 as your base OS

# 2. SSH into your new server
```bash
ssh root@your.server.ip
```

# 3. Install docker
```bash
sudo apt update && sudo apt upgrade -y
apt install docker.io -y
systemctl enable docker
apt install docker-compose -y
```

Don't overwrite any ssh files. Keep the ones on disk.
You might need to restart to do a kernal update.

# 4. Generate SSH Keys
```bash
ssh-keygen -t ed25519 -C "digitalocean-server"
```

# 5. Add them to Github and checkout the repo
```bash
cat ~/.ssh/id_ed25519.pub
```

Go to Settings > SSH and GPG keys
* Click New SSH key
* Title it DigitalOcean
* Paste your public key into the field

Checkout the repo on the server
```bash
mkdir  ~/web-projects
cd ~/web-projects
git clone git@github.com:kjlowe/energy-project.git
git config --global user.name "Kevin Lowe"
git config --global user.email "username@gmail.com"
ssh -T git@github.com
```

# 6. Allow Github to deploy to the server

``` bash
cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
```

```bash
cat ~/.ssh/id_ed25519
```

On GitHub, go to your repo → Settings > Secrets > Actions
Add these secrets:
* DO_HOST: the IP address of the server
* DO_USER: root
* DO_SSH_KEY: your private SSH key (contents of ~/.ssh/id_ed25519)

# 7. Deploy using Github Action

Re-run last action and everything shohul deploy!


 




















