# Prerequisites
## Install prerequesites
todo
## Discord setup:
Go to https://discord.com/developers/applications and log in
Create an application 

Add redirects that match web endpoint for tgrgbace.  For example, if your tgrgbace
setup is at https://flinch.tgrgbace.tv, add a redirect for https://flinch.tgrgbace.tv/_oauth.  You'll need these secrets for later.

More info at: https://discord.com/developers/docs/topics/oauth2

## DNS Setup
You'll need to create a DNS record for your hostname as well as CNAMEs for:
1. wss.HOSTNAME
2. hls.HOSTNAME

Optionally you can create
1. whoami.HOSTNAME - useful test service to look at the auth response (enable in docker-compose.yml)
2. dashboard.HOSTNAME - traefik dashboard (enable in docker-compose.yml)

## Master List of secrets and information
1. OAuth client id and secret id from your discord app
2. AUTH_SECRET - a random string
3. OvenMediaEngine signing key - a random string.  Try to avoid xml metacharacters for your own sanity

In addition you need everything necessary to configure a DNS Challenge provider for an ACME certificate resolver in Traefik: https://doc.traefik.io/traefik/https/acme/#dnschallenge

# Installation

## Clone the git repo:
```git clone git@github.com:mboilen/tgrgbace-ome.git```

## Fill in .env files
Copy `stack/env.template` and `tgrgbace.tv/env.template` and fill in the appropriate secrets

## Configure OvenMediaEngine
Edit `stack/ovenmediaengine/origin_conf/Server.xml`.  Under `<VirtualHosts>`, set up the `<Names>` list to be the correct names for your hostnames (all three of them).

In `<SignedPolicy>` replace `[[secretkey]]` with your real secret key.

## Configure Traefik
Go into `stack/traefik/data` and execute:
```touch acme.json
chmod 600 acme.json``

This file must be mode 600 or it will be ignored by Traefik.

Then, edit `stack/traefik/config/traefik.yml`.  Configure `myresolver` for your scenario:
1. set your email address
2. in the dnsChallenge section, set up your dns challenge provider as described in: https://doc.traefik.io/traefik/https/acme/#dnschallenge.  You can use staging/traefik/secrets to store api keys if necessary
3. You may also need to add environment variables to the traefik section of `stack/docker-compose.yml`.
4. You can uncomment `caServer: "https://acme-staging-v02.api.letsencrypt.org/directory"` to use the CA staging server.  Let's Encrypt has a rate limit in the tens of certificates per week and the test server has no limit (the certificates don't validate but you can ensure it's providing a certificate.  This is a useful test to test out your end to end certificate signing story.

## Generate player page
``cd tgrgbace.tv
npm install``

This will generate the player page (complete with signed policy to view the stream) into `dist/`  Make note of the `rtmp streaming URL`.  Streamers will need this to stream.  When it finishes, run

```cp -r dist/* ../stack/html```

To copy the contents to the nginx root

## Run the docker stack

Before you start it up, I recommend uncommenting whoami and the traefik dashboard to help test/diagnose.  When you're ready, run
```docker-compose up -d```
from the stack directory

Traefik can take a minute or two to create the wildcard certificate.  Chrome has an annoying behavior where it will continue to report a site as insecure even when it has a certificate if you previously visited it when it didn't.  If you open up an incognito window you'll see the correct certificate.  You may run into that when initially testing everything.

## Test it out

Go to your hostname (i.e. https://flinch.tgrgbace.tv) and it should bring up the player page.  You can stream to it from OBS by using the URL produced by npm.  In your OBS configuration you'll need to split up the url:

```Server: rtmp://hostname:1936/tgrgbace
Stream Key: stream?policy=blah&signature=blahblah```
