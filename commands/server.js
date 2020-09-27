const express = require("express");

function runServer({host, port}) {
  const app = express();

  app.get("/", (req, res) => {
    res.send("hello, world!");
  });

  app.listen(port, host);
  console.log(`Listening on ${host}:${port}`);
}

module.exports = runServer;
