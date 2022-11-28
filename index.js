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
      console.log("database not connected:", err);
    } else {
      console.log("database connected");

      // db collections
      const productsCollection = client
        .db("alibris")
        .collection("productCategories");
      const usersCollection = client.db("alibris").collection("users");
      const bookingsCollection = client.db("alibris").collection("bookings");
      const sellerProductsCollection = client
        .db("alibris")
        .collection("sellerProducts");
        const allProductsCollection = client.db('alibris').collection('products');

      
      

      // send all users for admin
      app.get("/users", async (req, res) => {
        try {
          const users = await usersCollection.find({}).toArray();
          if (users) {
            res.json({
              status: true,
              message: "users got successfully",
              data: users,
            });
          } else {
            res.json({
              status: false,
              message: "users got failed",
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

      // send user role based by email params
      app.get("/user/:email", async (req, res) => {
        try {
          const email = req.params?.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          const userRole = user?.role;

          if (user) {
            res.json({
              status: true,
              message: "user got successfully",
              data: userRole,
            });
          } else {
            res.json({
              status: false,
              message: "user got failed",
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });

      // post users
      app.put("/users", async (req, res) => {
        try {
          const user = req.body;
          const filter = { email: user.email };
          const options = { upsert: true };
          const updatedDoc = {
            $set: {
              name: user?.name,
              role: user?.role,
            },
          };
          const result = await usersCollection.updateOne(
            filter,
            updatedDoc,
            options
          );
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

      // seller product save to db
      app.put("/categories", async (req, res) => {
        try {
          const product = req.body;
          const filter = {
            categoryName: product.categoryName,
            email: product.email
          };

          const options = { upsert: true };
          const updatedDoc = {
            $push: {
              products: product.products[0]
            },
          };

          const result = await allProductsCollection.updateOne(
            filter,
            updatedDoc,
            options
          );

          if (result.acknowledged) {
            res.json({
              status: true,
              message: "added product successfully",
              data: result,
            });
          } else {
            res.json({
              status: false,
              message: "product added failed",
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
          const products = await allProductsCollection.find({}).toArray();
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
          const category = await allProductsCollection.findOne(query);
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

      // send specific seller products
      app.get("/myproducts", async (req, res) => {
        try {
          const email = req.query?.email;
          const query = { email };
          const myProducts = await allProductsCollection
            .find(query)
            .toArray();
          if (myProducts) {
            res.json({
              status: true,
              message: "product got successfully",
              data: myProducts,
            });
          } else {
            res.json({
              status: false,
              message: "product got failed",
            });
          }
        } catch (error) {
          res.json({
            status: false,
            message: error.message,
          });
        }
      });

      // send bookings based on user
      app.get("/bookings", async (req, res) => {
        try {
          const email = req.query.email;
          const query = {
            buyerEmail: email,
          };
          const bookings = await bookingsCollection.find(query).toArray();
          if (bookings) {
            res.json({
              status: true,
              message: "data got successfully",
              data: bookings,
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

      // // seller product save to db
      // app.put("/categories", async (req, res) => {
      //   try {
      //     const product = req.body;
      //     const filter = {
      //       categoryName: product.categoryName,
      //     };
      //     const options = { upsert: true };
      //     const updatedDoc = {
      //       $push: {
      //         products: product.products[0],
      //         // modified
      //         email: product?.email[0],
      //       },
      //     };

      //     const result = await allProductsCollection.updateOne(
      //       filter,
      //       updatedDoc,
      //       options
      //     );

      //     if (result.acknowledged) {
      //       res.json({
      //         status: true,
      //         message: "added product successfully",
      //         data: result,
      //       });
      //     } else {
      //       res.json({
      //         status: false,
      //         message: "product added failed",
      //       });
      //     }
      //   } catch (error) {
      //     res.json({
      //       status: false,
      //       message: error.message,
      //     });
      //   }
      // });

      // send specific seller products
      // app.get("/sellerProduct", async (req, res) => {
      //   try {
      //     const email = req.query?.email;
      //     const query = { email };
      //     const myProducts = await sellerProductsCollection
      //       .find(query)
      //       .toArray();
      //     if (myProducts) {
      //       res.json({
      //         status: true,
      //         message: "product got successfully",
      //         data: myProducts,
      //       });
      //     } else {
      //       res.json({
      //         status: false,
      //         message: "product got failed",
      //       });
      //     }
      //   } catch (error) {
      //     res.json({
      //       status: false,
      //       message: error.message,
      //     });
      //   }
      // });

      // end
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
