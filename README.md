# Prerequisites
## Discord setup:
Go to https://discord.com/developers/applications and log in  
Create an application 

Add redirects that match web endpoint for tgrgbace.  For example, if your tgrgbace
setup is at https://tgrgbox.example.com, add a redirect for https://tgrgbox.example.com/login/\_oauth.  Save the OAuth2 secrets; you'll need these secrets for later.

More info at: https://discord.com/developers/docs/topics/oauth2

## DNS Setup
You'll need to create a DNS record for your hostname (say tgrgbox.com)

## Master List of secrets and information
1. OAuth client id and secret id from your discord app
2. OvenMediaEngine api key - a random string.  Try to avoid xml metacharacters for your own sanity
3. A list of discord user names that are allowed to access the platform and stream


## Install prerequesites
### Install Docker
(Following directions from https://docs.docker.com/engine/install/ubuntu/)

Prereqs:

```sudo apt-get install ca-certificates curl gnupg lsb-release```

Install Key and source
 ```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

```
  
Update apt and install docker
```
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose
```
 
 Add current user to docker group:
 
 ```sudo usermod -aG docker $USER```
 
Log out and back in again to pick up the new group

# Installation

## Clone the git repo:
```git clone git@github.com:mboilen/tgrgbox.git```

## Fill in .env ##
Copy `env.template` to env and fill in the information

| Environment Variable | Value |
|---|---|
| TGRGBOX_HOST | The base hostname for your tgrgbox instance (the player is at https://TGRGBOX_HOST)|
| TGRGBOX_DISCORD_CLIENT_ID | The client id from the Discord OAuth2 app|
| TGRGBOX_DISCORD_CLIENT_SECRET | The client secret from the Discord OAuth2 app|
| TGRGBOX_WEB_API_KEY | A random string used as an api key for OME's Admission Webhooks|
| LETSENCRYPT_EMAIL | The email address used to obtain certificates from Let's Encrypt|
| COMPOSE_PROFILES |Leave this alone unless you're using an external reverse proxy|

## Configure tgrgbox-web
Copy `tgrgbox/config/default.yml.template` to `tgrgbox/config/default.yml` and fill in the information.  This
includes all users as well as all streams and streamers.  The easiest way to get the descriminator is from the web version of discord.

## Run the docker stack
cd into the root directory and run
```docker create network tgrgbox-network
docker compose up -d``` 
(or `docker-compose` if you're on an older version of docker compose)

Once that's done you should be able to navigate to https://TGRGBOX_HOST.  
It seems that traefik creates acme.json with the wrong permissions.  Check docker logs traefik on first execution.  You may have to `chmod 600 traefik/acme.json` and then `docker restart traefik`.

## Test it out

Go to your hostname (i.e. https://tgrgbox.example.com) and it should bring up the player page.  Go to "Your Stream Keys" from the dropdown in the upper right hand corner for the stream details.  Plug them into OBS and test it out.

# Appendix

## Port Forwarding
If you need to forward ports, forward
|Service        | Port           |
|---------------|----------------|
|http           | 80             |
|https          | 443            |
|rtmp           | 1935           |
|webrtc relay   | 3478           |
|srt            | 9999           |
|ICE candidates | 10000-10005/udp|

## Azure DNS
Rather than messing with Azure DNS, you can give you VM a host name.  Follow the steps in:

https://docs.microsoft.com/en-us/azure/virtual-machines/create-fqdn

To give your VM a hostname.  Then create an ALIAS record in your DNS provider that points to that name.  NGinx can then create the correct certificate

## Docker cheat sheet
```
docker compose pull
docker compose up -d --remove-orphans (add --force-recreate to force creation of containers so you don't have to worry about restarting containers)
docker system prune -a --volumes
```
