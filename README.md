# New Server Setup

This guide outlines the steps to rebuild a server from scratch and restore a project using a GitHub repository.

## 1. Create a New Server
- Provision a server with 1 vCPU and 1–2 GB RAM (approximately $5–6/month).
- Select Ubuntu 22.04 as the base operating system.

## 2. SSH into the Server
```bash
ssh root@<your-server-ip>
```

## 3. Install docker
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install docker.io -y
sudo systemctl enable docker
sudo apt install docker-compose -y
```

* Don't overwrite any ssh files. Keep the ones on disk.
* You might need to restart to do a kernal update.

## 4. Generate SSH Keys
* Display the public SSH key:
```bash
ssh-keygen -t ed25519 -C "digitalocean-server"
```

## 5. Add SSH Keys to GitHub and Clone the Repository

```bash
cat ~/.ssh/id_ed25519.pub
```
* In GitHub, navigate to Settings > SSH and GPG Keys:
  * Click New SSH key
  * Title it DigitalOcean
  * Paste your public key into the field

Clone the repository on the server:
```bash
mkdir  ~/web-projects
cd ~/web-projects
git clone git@github.com:kjlowe/energy-project.git
git config --global user.name "Kevin Lowe"
git config --global user.email "username@gmail.com"
ssh -T git@github.com
cd ~/web-projects/energy-project
```
* Fix permissions to ensure Jupyterlab can access everything it needs to.
```bash
chown -R 1000:100 .
```

## 6. Start Web Services

```bash
docker-compose up -d
```

* Check that the following work:
  * http://kevinlowe.net
  * http://kevinlowe.net:5000
  * http://kevinlowe.net:8080

## 7. Allow Github to deploy to the server
* Add the public SSH key to authorized keys:
``` bash
cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
```

* Display the private SSH key
```bash
cat ~/.ssh/id_ed25519
```

* In GitHub, go to the repository → Settings > Secrets > Actions:
  * Add these secrets:
    * DO_HOST: the IP address of the server
    * DO_USER: root
    * DO_SSH_KEY: your private SSH key (contents of ~/.ssh/id_ed25519)

## 8. Deploy using Github Action

* Re-run the latest GitHub Action to deploy the project.


 




















