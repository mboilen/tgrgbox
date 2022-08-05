# Prerequisites
## Discord setup:
Go to https://discord.com/developers/applications and log in
Create an application 

Add redirects that match web endpoint for tgrgbace.  For example, if your tgrgbace
setup is at https://flinch.tgrgbace.tv, add a redirect for https://flinch.tgrgbace.tv/vouch/auth.  Save the OAuth2 secrets; you'll need these secrets for later.

More info at: https://discord.com/developers/docs/topics/oauth2

## DNS Setup
You'll need to create a DNS record for your hostname as well as CNAMEs for:
1. wss.HOSTNAME
2. hls.HOSTNAME

## Master List of secrets and information
1. OAuth client id and secret id from your discord app
2. OvenMediaEngine signing key - a random string.  Try to avoid xml metacharacters for your own sanity
3. A list of discord user names addresses that are allowed to access the platform


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

### Install npm
```
sudo apt install npm
```

### Install ansible ###
```
sudo apt install ansible
```

# Installation

## Clone the git repo:
```git clone git@github.com:mboilen/tgrgbox.git```

## Fill in config.yml files
Copy `ansible/config.template` to `ansible/config.yml` and fill in the information.

| Config Key | Value |
|------------|-------|
|auth_whitelist | A comma separated list of Discord user names (without discriminator) that are allowed to access the player|
|discord_client_id | The client id from the Discord OAuth2 app|
|discord_secret_id | The client secret from the Discord OAuth2 app|
|tgrgbox_hostname| The base hostname for your tgrgbox instance (the player is at https://tgrgbox_hostname)|
|tgrgbox_dest_dir | The target directory for your tgrgbox instance.  Ansible will place all its files here |
|ome_secret_key| A random string that is used as the HMAC key to sign the Oven Media Engine security policies.  Avoid xml metacharacters in this string|
|letsencrypt_email| The email address that you'll use to get your certificates from LetsEncrypt|
|tgrgbace_tv_log| A path to a log file that will contain the streamer secrets for the player|

## Run ansible to generate your install

```
cd ansible
ansible-playbook tgrgbox.yml
```

## Run the docker stack
cd into the tgrgbox_dest_dir and run
```docker compose up -d``` 
(or `docker-compose` if you're on an older version of docker compose)

It will take a little while to start up on the first time as tgrgbox_nginx generates a Diffie-Helman key and gets certificates with certbot.  You can monitor progress with
```docker logs tgrgbox_nginx```

Once that's done you should be able to navigate to https://tgrgbox_hostname

## Test it out

Go to your hostname (i.e. https://flinch.tgrgbace.tv) and it should bring up the player page.  You can stream to it from OBS by using the URL produced by npm.  In your OBS configuration you'll need to split up the url:

```
Server: rtmp://hostname:1935/tgrgbace
Stream Key: stream?policy=blah&signature=blahblah
```

# Appendix

## Port Forwarding
If you need to forward ports, forward
|Service        | Port           |
|:--------------|---------------:|
|http           | 80             |
|https          | 443            |
|rtmp           | 1935           |
|webrtc relay   | 3478           |
|ICE candidates | 10000-10005/udp|

## Azure DNS
Rather than messing with Azure DNS, you can give you VM a host name.  Follow the steps in:

https://docs.microsoft.com/en-us/azure/virtual-machines/create-fqdn

To give your VM a hostname.  Then create an ALIAS record in your DNS provider that points to that name.  Create the CNAME records as described above and you can use your DNS provider's API to handle ACME through Traefik.
