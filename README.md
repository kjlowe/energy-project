# New Server Setup

This guide outlines the steps to rebuild a server from scratch and restore a project using a GitHub repository.

## 1. Create a New Server
- Provision a server with 1 vCPU and 1–2 GB RAM (approximately $5–6/month).
- Select Ubuntu 22.04 as the base operating system.
- Check "add improved metrics monitoring and alerting free"

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
```bash
ssh-keygen -t ed25519 -C "digitalocean-server"
```

## 5. Add SSH Keys to GitHub and Clone the Repository
* Display the public SSH key:
```bash
cat ~/.ssh/id_ed25519.pub
```
* In GitHub, navigate to Settings > SSH and GPG Keys:
  * Click New SSH key
  * Title it DigitalOcean
  * Paste your public key into the field

* Clone the repository on the server:
```bash
mkdir  ~/web-projects
cd ~/web-projects
git clone git@github.com:kjlowe/energy-project.git
git config --global user.name "Kevin Lowe"
git config --global user.email "username@gmail.com"
ssh -T git@github.com
cd ~/web-projects/energy-project
```

## 6. Start Web Services

```bash
docker-compose up -d --build
```

Note: everytime the docker compose file is changed this will need to be run manually. 

Use the following command to watch the terminal as the docker containers come online.

```bash
docker-compose logs -f
```

* Check that the following work:
  * http://<ip-address>:5000

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


# New Laptop Setup

Things I woud want to do are:
- If it's a mac install colima. Be sure to start with with lots of memeory (2GB by default is too little for copilot) 
  - colima start --memory 24
- If it's windows install docker desktop (is there a free lightweight version like colima?)
- install docker and docker compose.
- Install VSCode.
- Check out the repo onto the base operating system.
- Set up git on the computer so that you can push to the repo. The github CLI is helpful for that.
- Install the DevContainers extension.
- Ctrl + Shift + P to and find the "something with Dev Containers" option.
- After installation follow the instructions to remove the Python extensions that conlict with Co-Pilot


# Workflows

## Running. Python on the server 

After getting onto the command line of the already setup server.

```bash
docker exec -it python /bin/bash
python data-explore.py
```

const I love you
you let me sleep on you
and u made the stewardess turn the ac for me 


# Next Steps

- I have a proof of concept of using proto to define a python data structure and load information into a DB. 

- NOW: start defining the billing data structures in proto. 

- THEN: See if you can load the jupyter notebook data into that Python/Proto structure instead and have it automatically store in sqlite.

- The awesome result will be the full set of data being returned from the Flash API in a format defined by the proto.