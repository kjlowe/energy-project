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


# Workflows

# API: Running Tests + App Locally

cd /workspace/python-app
source .venv-app/bin/activate
pytest tests/ -v
python app.py

## UI: Running Tests + App Locally

cd /workspace/react-app
npm install
npm test
npm run dev
http://localhost:5173/

# Storybook UI For exploring components

npm run storybook
http://localhost:6006/

# Next Steps

1. (DONE) UI: Overlay the metadata on top of the month view and table view.

2. (DONE) UI: update the per month view to show costs as well. 

3. (DONE) Got the calculated values to be actually calculated at runtime. 

4. (DONE) Need the app to have more information about allocation percentage. The cummulative allocation percentage for example. 

5. (DONE) Make sure totals row is accurate. net_energy_usage_after_credits are wrong for September 2024. Need to repull from billing_year_2024_complete.json. Need to check all the total rows to make sure they match what is in excel.

6. (DONE) Got the PG&E rates loaded into the app. Use the PG&E rates from the excel files. First step is going to be to have Claude Code go through the spreadsheets and extract to TOU-C information for each period. Decide on a format for this. Maybe should be in the proto as well?

6. Calculate what the 303 and 303A bills would have been with their current consumption without solar. Make it a new tab! Table to be Billing by Month, Billing by Year, Hypothetical Bill by Year <-- make this.
- Example: PG&E Rates without using CCA for April 2024 are in the excel files. For the usage of 303A Humboldt the costs would have been $198.44 + $19.98 + (-$33.93) + (-$55.17) = $129.32

5. Need to understand more about how the total bill it calculated. Like the delivery charges that come in at the end of the year. This is needed to back calculate what the delivery charges would be for energy use.
- 3849 Fairfax Way - March 2026 Bill - PG&E total costs per kWh = $0.301/kWH for PG&E delivery changes (note slight difference because the new base charge was just implimented on the last day of the billing cycle. March 1st)

6. UI: then make the per month view show what I have on the paper to make it really clear how allocation is being done. 

7. UI: Make a tool to show how much the ADU would pay if they did not have solar.

8. Jupyter Notebook: See if you can pull the data from the sqlite database into Jupyter notebook to make the data explorable and create custom anlytics. 

Some things to understand about the bills:
- Go to Tara & Pirouz house to look at September 2025 to see why the numbers on the Detail of Bill and Main Unit bill don't line up.
- print out information on subcomponent kWh values. Make sure the function is clearly importing the subcomponents and is not double counting the total
- See if we have enough equations to solve for the unknown subcomponent kWh ADU allocated export kWhs. (red cells)