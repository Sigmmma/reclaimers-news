const runServer = require("./commands/server");
const checkReleases = require("./commands/check-releases");
const yargs = require("yargs");

yargs.scriptName("reclaimers.js")
  .usage("$0 <cmd> [args]")
  .command("server", "Run the API server", (yargs) => {
    yargs.option("port", {
      type: "number",
      default: 8080,
      describe: "The port to listen on"
    });
    yargs.option("host", {
      type: "string",
      default: "0.0.0.0",
      describe: "The host IP to bind to"
    });
  }, runServer)
  .command("releases", "Check for new releases and post then to Discord", (yargs) => {
    yargs.option("dryrun", {
      type: "boolean",
      default: false,
      describe: "Check releases only; do not post to Discord"
    });
  }, checkReleases)
  .demandCommand()
  .help()
  .argv;
