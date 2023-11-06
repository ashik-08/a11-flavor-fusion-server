const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FlavorFusion server is running!");
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});