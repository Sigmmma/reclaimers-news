const fs = require("fs");
const RssParser = require("rss-parser");
const fetch = require("node-fetch");
const AWS = require("aws-sdk");
const RateLimiter = require("limiter").RateLimiter;
const {ArgumentParser} = require("argparse");
const yaml = require("js-yaml");

const SENT_MESSAGES_TABLE_NAME = "news-sent-messages";
const SENT_MESSAGES_TABLE_PARTITION_KEY = "sourceId";
const SENT_MESSAGES_TABLE_SORT_KEY = "guid";

const dynamodb = new AWS.DynamoDB();
const discordLimiter = new RateLimiter(1, 500);

async function sendToDiscord(source, item, callback) {
  const requestOpts = {
    body: JSON.stringify({
      username: "Halo CE News",
      content: `${source.icon} | **${source.title}:** ${item.title} ${item.link}`
    }),
    method: "post",
    headers: {
      "Content-Type": "application/json"
    }
  };
  await new Promise((resolve, _reject) => {
    discordLimiter.removeTokens(1, resolve);
  });
  await fetch(source.webhookUrl, requestOpts);
}

function getSentMessagesForSource(sourceId) {
  const requestParams = {
    TableName: SENT_MESSAGES_TABLE_NAME,
    KeyConditionExpression: `${SENT_MESSAGES_TABLE_PARTITION_KEY} = :sourceId`,
    ExpressionAttributeValues: {
      ":sourceId": {S: sourceId}
    }
  };
  return new Promise((resolve, reject) => {
    dynamodb.query(requestParams, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Items.map(item => item.guid.S));
      }
    });
  });
}

function setMessageSent(sourceId, guid) {
  const requestParams = {
    TableName: SENT_MESSAGES_TABLE_NAME,
    Item: {
      [SENT_MESSAGES_TABLE_PARTITION_KEY]: {S: sourceId},
      [SENT_MESSAGES_TABLE_SORT_KEY]: {S: guid}
    }
  };
  return new Promise((resolve, reject) => {
    dynamodb.putItem(requestParams, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function handleFeed(source, feed, opts) {
  const sentGuids = await getSentMessagesForSource(source.id);
  for (const item of feed.items) {
    if (!item.guid || !item.title || !item.link) {
      console.error(`Malformed item found at ${feed.url}`);
      continue;
    }
    if (sentGuids.includes(item.guid)) {
      continue;
    }

    console.log(`Found news ${item.guid} from ${source.id}: ${item.title}`);
    try {
      if (!opts.nosend) {
        await sendToDiscord(source, item);
      }
      if (!opts.nosave) {
        await setMessageSent(source.id, item.guid);
      }
    } catch (err) {
      console.error(`Failed to handle ${item.guid} from ${source.id}. Skipping`, err);
    }
  }
}

async function checkNews(sources, opts) {
  console.log(`Checking for news (${Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(",")})`);

  const parser = new RssParser();
  await Promise.all(sources.map(async (source) => {
    try {
      console.log(`Checking source ${source.url}`);
      const feed = await parser.parseURL(source.url);
      await handleFeed(source, feed, opts);
    } catch (err) {
      console.error(`Failed to get feed from ${source.url}`, err);
    }
  }));
}

(async () => {
  const parser = new ArgumentParser({
    description: "Gather news via RSS and submit to Discord",
  });
  parser.add_argument("--nosend", {
    action: "store_true",
    help: "Prevents messages from being sent to Discord"
  });
  parser.add_argument("--nosave", {
    action: "store_true",
    help: "Prevents messages from being saved to the idempotency table"
  });
  parser.add_argument("--sources", {
    type: "str",
    default: "sources.yml",
    help: "Path to the news sources YAML file. Defaults to sources.yml"
  });
  const args = parser.parse_args();
  let sources;
  try {
    sources = yaml.safeLoad(fs.readFileSync(args.sources, "utf8"));
  } catch (e) {
    console.log(`Failed to load YAML file ${args.sources}: ${e.message}`);
    process.exit(1);
  }
  await checkNews(sources.sources, {nosend: args.nosend, nosave: args.nosave});
})();
