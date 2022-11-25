const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || "5000";

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.g9drewa.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function run() {
  client.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("database connected");

      // db collections
      const productsCollection = client
        .db("alibris")
        .collection("productCategories");
      const usersCollection = client.db("alibris").collection("users");
      const bookingsCollection = client.db("alibris").collection("bookings");

      // post users
      app.post("/users", async (req, res) => {
        try {
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          if (result) {
            res.json({
              status: true,
              message: "user added successfully",
            });
          } else {
            res.json({
              status: true,
              message: "user added failed",
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });

      // send all categories product
      app.get("/categories", async (req, res) => {
        try {
          const products = await productsCollection.find({}).toArray();
          if (products) {
            res.json({
              status: true,
              message: "data got successfully",
              data: products,
            });
          } else {
            res.json({
              status: false,
              message: "data got failed",
              data: [],
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });

      // send specific category product
      app.get("/category/:id", async (req, res) => {
        try {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const category = await productsCollection.findOne(query);
          if (category) {
            res.json({
              status: true,
              message: "data got successfully",
              data: category,
            });
          } else {
            res.json({
              status: false,
              message: "data got failed",
              data: {},
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });

      // post booking product
      app.post("/bookings", async (req, res) => {
        try {
          const bookingProduct = req.body;
          const result = await bookingsCollection.insertOne(bookingProduct);
          if (result) {
            res.json({
              status: true,
              message: "successfully booked",
            });
          } else {
            res.json({
              status: true,
              message: "booking failed",
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });
    }
  });
}
run();

// test server endpoint
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "alibris server is ready to use",
  });
});

app.listen(port, () => {
  console.log(`alibris server is running on: ${port}`);
});
