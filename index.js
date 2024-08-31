// server.js
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./api/routes");

const app = express();

app.get("/", (req, res) => {
  res.send("Harmonized backend running...");
});

app.use(bodyParser.json());
app.use("/api", routes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
