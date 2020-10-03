# Reclaimers news publisher

![](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiVHFKR1lFaE5zYjZDZnJvaVFhMWFwM1pudzRoNlhKR1RQbkh0eU05aEVvbG9yS2l6UnJxQzBuc2dkVTc5K2RDQ3FQK0pSN21Pa1NSeWJVdGlrZy92TXZ3PSIsIml2UGFyYW1ldGVyU3BlYyI6IjU0eW5OQ3o4SllvWTJkRG4iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

This project implements an automated task which scans Halo CE-related RSS feeds and posts new items to the Reclaimers Discord server via webhook.

## Running with Node
To run locally with Node directly, which is recommended during development, you will need a `sources.yml` file in the working directory with the following structure:

```yml
# A list of sources
sources:
    # A unique key for this source used for message idempotency
  - id: openCarnageAssets
    # The RSS source URL to scan
    url: https://opencarnage.net/index.php?/forum/68-halo-ce-asset-releases.xml/
    # The emoji used in the published message
    icon: ":gear:"
    # A title to include in the message related to this source
    title: Asset released on OpenCarnage
    # Generated within Discord for a certain channel
    webhookUrl: https://discordapp.com/api/webhooks/<webhook id>/<webhook token>
```

You will also need to configure [environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) to authenticate with the AWS account containing the Dynamo idempotency table. Any user with read and write permissions to the table will do.

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
