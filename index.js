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
    const foodOrdersCollection = database.collection("food-orders");

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
    // get all food items from the db

    // GET request from AllFoodPage --> AllFoodItems component
    // filtering API format ----- { /api/v1/food-items?category=Salad }

    // sorting API format
    // /api/v1/food-items?sortField=price&sortOrder=asc
    // /api/v1/food-items?sortField=quantity&sortOrder=desc

    // searching API format ----- { /api/v1/food-items?search=bbq }

    // pagination format ----- { /api/v1/food-items?page=1&limit=10 }
    app.get("/api/v1/food-items", async (req, res) => {
      try {
        let filter = {};
        let sort = {};
        const category = req.query.category;
        const sortField = req.query.sortField;
        const sortOrder = req.query.sortOrder;
        const search = req.query.search;

        // pagination
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const skip = (page - 1) * limit;

        if (category) {
          filter = { food_category: category };
        }
        if (category === "All") {
          filter = {};
        }
        if (sortField && sortOrder) {
          sort[sortField] = sortOrder;
        }
        if (search) {
          filter.food_name = { $regex: search, $options: "i" };
        }

        const result = await foodItemsCollection
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .toArray();

        // count total data
        const totalDataCount = await foodItemsCollection.countDocuments();
        res.send({ totalDataCount, result });
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // get single food item by id
    app.get("/api/v1/food-item/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodItemsCollection.findOne(query);
        if (!result) {
          return res.send({ message: "No data found" });
        }
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

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

    // own added food items related API (foodItemsCollection)
    // get all own added food items from the db
    // GET request from MyAddedFoodPage
    // searching API format ----- { /api/v1/my-added-foods?email=admin@fusion.com }
    app.get("/api/v1/my-added-foods", async (req, res) => {
      try {
        const email = req.query.email;
        let filter = {};
        if (email) {
          filter = { added_by_email: email };
        }
        const result = await foodItemsCollection.find(filter).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // update own added food item to db from UpdateFoodPage
    app.patch("/api/v1/my-added-foods", async (req, res) => {
      try {
        const id = req.body.id;
        const filter = { _id: new ObjectId(id) };
        const query = await foodItemsCollection.findOne(filter);
        if (!query) {
          return res.send({ message: "No data found" });
        }
        const updateQuery = {
          $set: {
            food_name: req.body.food_name,
            food_image: req.body.food_image,
            food_category: req.body.food_category,
            quantity: req.body.quantity,
            price: req.body.price,
            origin: req.body.origin,
            ingredients: req.body.ingredients,
          },
        };
        const result = await foodItemsCollection.updateOne(filter, updateQuery);
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // delete own added food item from db using id
    app.delete("/api/v1/my-added-foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodItemsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // food orders related API (foodOrdersCollection)
    // add ordered food item to the db
    app.post("/api/v1/food-orders", async (req, res) => {
      try {
        const newOrder = req.body;
        const query = { _id: new ObjectId(newOrder.food_id) };
        const find = await foodItemsCollection.findOne(query);
        // requirements check
        if (
          find.added_by_name === newOrder.buyer_name &&
          find.added_by_email === newOrder.buyer_email
        ) {
          return res.send({ message: "Own food item" });
        }
        if (find.quantity === 0) {
          return res.send({ message: "Item is not available" });
        }
        if (newOrder.ordered > find.quantity) {
          return res.send({ message: "Less item available" });
        }
        // add order
        const updateQuery = {
          $set: {
            quantity: find.quantity - newOrder.ordered,
            order: find.order + newOrder.ordered,
          },
        };
        const orderResult = await foodOrdersCollection.insertOne(newOrder);
        const updateResult = await foodItemsCollection.updateOne(
          query,
          updateQuery
        );
        res.send({ orderResult, updateResult });
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // own ordered food items related API (foodOrdersCollection)
    // get all own ordered food items from the db
    // GET request from MyOrderedFoodPage
    // searching API format ----- { /api/v1/my-ordered-foods?email=admin@fusion.com }
    app.get("/api/v1/my-ordered-foods", async (req, res) => {
      try {
        const email = req.query.email;
        let filter = {};
        if (email) {
          filter = { buyer_email: email };
        }
        const result = await foodOrdersCollection.find(filter).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
        return res.send({ error: true, message: error.message });
      }
    });

    // delete own ordered food item from db using id
    app.delete("/api/v1/my-ordered-foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const deleteQuery = { _id: new ObjectId(id) };
        const findOrder = await foodOrdersCollection.findOne(deleteQuery);

        const foodId = { _id: new ObjectId(findOrder.food_id) };
        const foodItem = await foodItemsCollection.findOne(foodId);

        // update order
        const updateQuery = {
          $set: {
            quantity: foodItem.quantity + findOrder.ordered,
            order: foodItem.order - findOrder.ordered,
          },
        };

        const updateFoodResult = await foodItemsCollection.updateOne(
          foodId,
          updateQuery
        );
        const orderDeleteResult = await foodOrdersCollection.deleteOne(
          deleteQuery
        );
        res.send({ orderDeleteResult, updateFoodResult });
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
