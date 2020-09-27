# Reclaimers API services
This project will host API services and automated jobs for the Reclaimers community.

Possible features
* RSS checker for posting new map/asset releases to the announcements Discord channel
* An API that can be used to get the status of a running Halo server

## Running with Node
To run locally with Node directly, which is recommended during development:

```sh
# install dependencies
npm ci

# see usage and run commands
node reclaimers.js --help
node reclaimers.js releases --dryrun
node reclaimers.js server --port 9001
```

## Running with Docker
This project contains a Dockerfile which describes the system dependencies the application has (nodejs) and automates the creation of an image which can be run with Docker. This is well-suited for managed container hosting where you don't want to maintain a full server.

```sh
# Build the image
docker build -t reclaimers-svc .

# Run the image and see usage
docker run --read-only --rm \
  reclaimers-svc:latest \
  --help

# Run the server mode, mapping container port 8080 to local port 8080
docker run --read-only --rm --name recsvc -d -p 8080:8080 \
  reclaimers-svc:latest \
  server

# Check that it's running
docker ps

# Kill the running container
docker kill recsvc
```
