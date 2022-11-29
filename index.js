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
  // client.connect((err) => {
  //   if (err) {
  //     console.log("database not connected:", err);
  //   } else {
  //     console.log("database connected");

      // db collections
      // const productsCollection = client
      //   .db("alibris")
      //   .collection("productCategories");
      const usersCollection = client.db("alibris").collection("users");
      const bookingsCollection = client.db("alibris").collection("bookings");
      // const sellerProductsCollection = client
      //   .db("alibris")
      //   .collection("sellerProducts");
      const allProductsCollection = client.db("alibris").collection("products");
      const advertiseProductsCollection = client.db("alibris").collection("advertiseProducts");

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

      // send admin role
      app.get("/users/admin/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ isAdmin: user?.role === "admin" });
      });

      // send seller role
      app.get("/users/seller/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ isSeller: user?.role === "seller" });
      });

      // send buyer role
      app.get("/users/buyer/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ isBuyer: user?.role === "buyer" });
      });

      // send all sellers
      app.get("/sellers", async (req, res) => {
        const users = await usersCollection.find({}).toArray();
        const sellers = users.filter((user) => user?.role === "seller");
        res.send(sellers);
      });

      // delete seller
      app.delete("/sellers/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const deleteSeller = await usersCollection.deleteOne(query);
        res.send(deleteSeller);
      });

      // send all buyers
      app.get("/buyers", async (req, res) => {
        const users = await usersCollection.find({}).toArray();
        const buyers = users.filter((user) => user?.role === "buyer");
        res.send(buyers);
      });

      // delete buyer
      app.delete("/buyers/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const deleteBuyer = await usersCollection.deleteOne(query);
        res.send(deleteBuyer);
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
          };

          const options = { upsert: true };
          const updatedDoc = {
            $push: {
              products: product.products[0],
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
          const allproducts = await allProductsCollection.find({}).toArray();

          const myProd = allproducts.map((prod) =>
            prod.products.filter((myprod) => myprod.email === email)
          );

          if (myProd) {
            res.json({
              status: true,
              message: "product got successfully",
              data: myProd,
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

      // advertise products send
      app.get("/advertiseProducts", async(req, res) => {
        const advertiseProducts = await advertiseProductsCollection.find({}).toArray();
        res.send(advertiseProducts)
      })

      // advertise products save to db
      app.post("/advertiseProducts", async(req, res) => {
        const product = req.body;
        // console.log(product)
        const result = await advertiseProductsCollection.insertOne(product);
        res.send(result)
      })

      

      // delete products by sellers
      // app.put("/myproducts/:id", async (req, res) => {
      //   const deletedProduct = req.body;
      //   // console.log(deletedProduct)

      //   const id = req.params.id;
      //   const query = { _id: ObjectId(id) };

      //   const result = await allProductsCollection.findOne(query);

      //   const remaining = result.products.filter(
      //     (prod) => prod.bookName === deletedProduct.bookName
      //   );
      //   // console.log(result.products.includes(deletedProduct))
      //   // const deletedProd = db.allProductsCollection.updateOne(query, {$pull: {products: {bookName: remaining[0].bookName}}})

      //   const options = {upsert: false}

      //   const updatedDoc = {
      //     $pull: { products: { bookName: deletedProduct.bookName } }
      //   }

      //   const deletedResult = await allProductsCollection.updateOne(
      //     query,
      //     {
      //       $pull: { products: { bookName: deletedProduct.bookName } }
      //     }
      //   );
      //   res.send(deletedResult);
      // });



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
    // }
  // });
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
