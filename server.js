// server.js
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./api/routes");
const { IP_CONFIG } = require("./utils/constants");

const app = express();

app.use(bodyParser.json());
app.use("/api", routes);

const { ipAddress, port } = IP_CONFIG;

app.listen(port, ipAddress, () => {
  console.log(`Server started on http://${ipAddress}:${port}`);
});
