const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5001;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ya8cack.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // connect to the database & access it's collections
    const database = client.db("flavor-fusion");
    const usersCollection = database.collection("users");
    const foodItemsCollection = database.collection("food-items");

    // user related API (usersCollection)
    // add new user credentials to the db
    app.post("/api/v1/users", async (req, res) => {
      try {
        const user = req.body;
        // query to find all users in the collection
        const query = await usersCollection.find().toArray();
        // check if there already exist an user
        const found = query.find(
          (search) => search.name === user.name && search.email === user.email
        );
        if (found) {
          return res.send({ message: "Already exists" });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // food items related API (foodItemsCollection)
    // add new food item to the db
    app.post("/api/v1/food-items", async (req, res) => {
      try {
        const newFoodItem = req.body;
        // query to find all food items in the collection
        const query = await foodItemsCollection.find().toArray();
        // check if the food item already exists
        const found = query.find(
          (search) =>
            search.food_name === newFoodItem.food_name &&
            search.food_category === newFoodItem.food_category
        );
        if (found) {
          return res.send({ message: "Already exists" });
        }
        const result = await foodItemsCollection.insertOne(newFoodItem);
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FlavorFusion server is running!");
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});
