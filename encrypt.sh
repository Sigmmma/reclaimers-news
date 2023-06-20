#!/bin/sh
echo "KMS:$(aws --profile reclaimers-news-task kms encrypt --key-id "alias/news-secrets" --plaintext "$1" --output text --query CiphertextBlob --cli-binary-format raw-in-base64-out)"