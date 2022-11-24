const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

      // all categories product
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

      // specific category product
      app.get()

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
