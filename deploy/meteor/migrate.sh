#!/bin/sh
# One-shot, run on meteor: moves Caddy out of Aetherstream's stack into corkedfever's own.
#
# Before running, copy this folder to /opt/corkedfever, and Aetherstream's new compose file
# (the one without Caddy) to /opt/aetherstream/docker-compose.yml.new.
#
# Every site is down for the seconds between the old Caddy leaving and the new one starting.
# Certificates are carried over, so nothing waits on Let's Encrypt.
#
# To roll back:
#   cd /opt/corkedfever && docker compose down
#   cd /opt/aetherstream && mv docker-compose.yml.pre-corkedfever docker-compose.yml
#   mv Caddyfile.retired Caddyfile && docker compose up -d
set -eu

A=/opt/aetherstream
C=/opt/corkedfever

if [ ! -f "$A/docker-compose.yml.new" ]; then
  echo "Missing $A/docker-compose.yml.new — copy Aetherstream's new compose file there first."
  exit 1
fi

echo "== Checking the new Caddyfile"
docker run --rm -v "$C/caddy:/etc/caddy:ro" caddy:2 caddy validate --config /etc/caddy/Caddyfile

echo "== Creating the corkedfever stack: network, volumes, container, nothing started"
cd "$C"
docker compose create

echo "== Carrying the certificates over"
docker run --rm -v aetherstream_caddy-data:/from:ro -v corkedfever_caddy-data:/to alpine cp -a /from/. /to/

echo "== Cutover: Aetherstream drops its Caddy and joins the corkedfever network"
cd "$A"
cp -p docker-compose.yml docker-compose.yml.pre-corkedfever
mv docker-compose.yml.new docker-compose.yml
docker compose up -d --remove-orphans

cd "$C"
docker compose up -d

if [ -f "$A/Caddyfile" ]; then
  mv "$A/Caddyfile" "$A/Caddyfile.retired"
fi

echo "== Done"
docker ps --format '{{.Names}}  {{.Status}}'
