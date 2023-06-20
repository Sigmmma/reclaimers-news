# Reclaimers news publisher

![](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiVHFKR1lFaE5zYjZDZnJvaVFhMWFwM1pudzRoNlhKR1RQbkh0eU05aEVvbG9yS2l6UnJxQzBuc2dkVTc5K2RDQ3FQK0pSN21Pa1NSeWJVdGlrZy92TXZ3PSIsIml2UGFyYW1ldGVyU3BlYyI6IjU0eW5OQ3o4SllvWTJkRG4iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

This project implements an automated task which scans Halo modding-related RSS feeds and posts new items to the Reclaimers Discord server via webhook.

## Configuring
The bot is configured with `sources.yml`:

```yml
# Webhooks specify which channels can be published to
webhooks:
  default: KMS:ABC123
# A list of sources to scan
sources:
    # A unique key for this source used for message idempotency
  - id: openCarnageAssets
    # The RSS source URL to scan
    url: https://opencarnage.net/index.php?/forum/68-halo-ce-asset-releases.xml/
    # The emoji used in the published message
    icon: ":gear:"
    # A title to include in the message related to this source
    title: Asset released on OpenCarnage
    # An optional webhook to use, defaults to "default"
    webhook: default
```

Webhook values are generated within Discord and look like `https://discordapp.com/api/webhooks/<webhook id>/<webhook token>`. Howerver, these are secret values and we don't want just anyone to be able to post messages to our channel, we need to encrypt the webhook URL against a KMS key which only this app can decrypt. Use `./encrypt.sh <url>` to generate a new ciphertext.

## Development
In AWS, the service runs with a task role which has permission to access DynamoDB and KMS. Without authorization you will not be able to run it locally. The way we do this is to configure some AWS profiles:

In `~/.aws/config`:
```
[profile reclaimers-news-task]
region = us-east-1
role_arn = arn:aws:iam::413062193480:role/news-task
source_profile = reclaimers-dev-news
```

In `~/.aws/credentials`, put the credentials for the `dev-news` IAM user:
```
[reclaimers-dev-news]
aws_access_key_id = ...
aws_secret_access_key = ...
```

Finally, set these environment variables:
```sh
export AWS_REGION=us-east-1
export AWS_PROFILE=reclaimers-news-task
```

Next, we can install dependencies and run the scanner:
```sh
# Install dependencies
npm ci

# See usage and run commands
node news.js --help
# Run in full dryrun mode
node news.js --nosend --nosave
# Run in production mode
node news.js
```

## Building the Docker image
This project contains a Dockerfile which describes the system dependencies the application has (nodejs) and automates the creation of an image which can be run with Docker. This is well-suited for managed container hosting, but not necessary for local development. The build assumes you have a `sources.yml` in the project directory.

```sh
# Build the image
docker build -t reclaimers-news .
# Run the image with arguments
docker run --read-only --rm reclaimers-news:latest --help
# Run the image in production mode
docker run --read-only --rm reclaimers-news:latest
```

When run as an ECS task, its IAM role is granted permission to read and write from the idempotency table so environment variables do not need to be baked into the image.
