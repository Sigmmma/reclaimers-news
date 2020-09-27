
function checkReleases({dryrun}) {
  console.log(`Checking for new releases (dryrun=${dryrun})`);
  if (!dryrun) {
    console.log("Posting releases to Discord webhook endpoint");
  }
}

module.exports = checkReleases;
