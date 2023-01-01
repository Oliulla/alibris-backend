const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  // console.log("inside verifyjwt", authHeader);
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      // console.log(err)
      return res.status(403).send({ message: "forbidden access" });
    }

    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    // db collections
    const productCategories = client
      .db("alibris")
      .collection("productCategories");
    const usersCollection = client.db("alibris").collection("users");
    const bookingsCollection = client.db("alibris").collection("bookings");
    const wishlistProductCollections = client
      .db("alibris")
      .collection("wishlists");
    const allProductsCollection = client.db("alibris").collection("products");
    const advertiseProductsCollection = client
      .db("alibris")
      .collection("advertiseProducts");
    const paymentsCollection = client
      .db("alibris")
      .collection("payments");

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

    // authorization with jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      // console.log(result);
      res.status(403).send({ accessToken: "" });
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
      // console.log(email)
      const query = { email };
      const user = await usersCollection.findOne(query);
      // console.log(user);
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
        // res.send(result)
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

    app.post("/categories", async (req, res) => {
      try {
        const product = req.body;
        // console.log(product);
        const result = await allProductsCollection.insertOne(product);
        // console.log(result);
        if (result) {
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

    // send data based on user search
    app.get("/categories/products/:searchWord", async (req, res) => {
      try {
        const searchText = req.params?.searchWord;
        // const query = {
        //   categoryName: searchText
        // }
        // const query2 = {
        //   bookName: searchText
        // }
        const allProducts = await allProductsCollection.find({}).toArray();
        // const allProducts1 = await allProductsCollection.find(query2).toArray();

        console.log("allproducts", allProducts);
        const products = allProducts.filter(
          (prod) =>
            prod.categoryName.toLowerCase() === searchText.toLowerCase() ||
            prod.bookName.toLowerCase() === searchText.toLowerCase()
        );

        // console.log(products);

        if (products) {
          res.json({
            status: true,
            message: "products got successfully",
            data: products,
          });
        } else {
          res.json({ status: false, message: "data got failed", data: [] });
        }
      } catch (error) {
        res.json({ status: false, message: error.message });
      }
    });

    // send all categories of product
    app.get("/categories", async (req, res) => {
      try {
        const categories = await productCategories.find({}).toArray();
        if (categories) {
          res.json({
            status: true,
            message: "data got successfully",
            data: categories,
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

    // temorary endpoint to add category
    // app.post("/categories", async (req, res) => {
    //   try {
    //     const categories = await productCategories.insertOne(req.body);
    //     res.send(categories);
    //   } catch (error) {
    //     res.json({
    //       status: false,
    //       message: error.message,
    //     });
    //   }
    // });

    // temporary to update verify status of sellers
    app.put("/sellerVerified/:email", async (req, res) => {
      const sellerEmail = req.params.email;
      const filter = { email: sellerEmail };
      const options = { upsert: false };
      const updatedDoc = {
        $set: {
          status: "Verified",
        },
      };
      const result = await allProductsCollection.updateMany(
        filter,
        updatedDoc,
        options
      );
      const result2 = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // send specific category product
    app.get("/category/:categoryName", async (req, res) => {
      try {
        const productCategory = req.params.categoryName;
        const products = await allProductsCollection.find({}).toArray();
        // console.log(products)
        const categoryProducts = products.filter(
          (product) => product.categoryName === productCategory
        );
        // console.log(categoryProducts)
        if (categoryProducts) {
          res.json({
            status: true,
            message: "data got successfully",
            data: categoryProducts,
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

    // send specific seller products
    app.get("/myproducts", verifyJWT, async (req, res) => {
      try {
        const email = req.query?.email;
        // console.log(email);

        // console.log(req.headers.authorization);
        const decodedEmail = req.decoded.email;
        // console.log(decodedEmail, email)

        if (email !== decodedEmail) {
          return res.status(403).json({ message: "forbidden access" });
        }
        const query = {
          email: email,
        };

        const myProd = await allProductsCollection.find(query).toArray();
        // console.log(allproducts);
        // const myProd = allproducts.filter((prod) => prod.email === email);
        // console.log(myProd);

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

    app.delete("/myproducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await allProductsCollection.deleteOne(query);
      if (result.deletedCount) {
        res.send(result);
      }
    });

    // advertise products send
    app.get("/advertiseProducts", async (req, res) => {
      const advertiseProducts = await advertiseProductsCollection
        .find({})
        .toArray();
      res.send(advertiseProducts);
    });

    // advertise products save to db
    app.post("/advertiseProducts", async (req, res) => {
      const product = req.body;
      // console.log(product)
      const filter = {_id: ObjectId(product._id)};
      const options = {upsert: false};
      const updatedDoc = {
        $set: {
          advertised: true
        }
      }
      const result = await advertiseProductsCollection.insertOne(product);
      const result2 = await allProductsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

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
    app.get("/bookings", verifyJWT, async (req, res) => {
      try {
        const email = req.query.email;
        // console.log(req.headers.authorization);
        const decodedEmail = req.decoded.email;
        // console.log(decodedEmail, email)

        if (email !== decodedEmail) {
          return res.status(403).json({ message: "forbidden access" });
        }
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

    // send single booking by id for payment
    app.get("/bookings/payment/:id", async (req, res) => {
      try {
        const id = req.params?.id;
        const query = { _id: ObjectId(id) };
        const booking = await bookingsCollection.findOne(query);
        res.send(booking);
      } catch (error) {
        console.log(error.message);
        res.send(error.message);
      }
    });

    // payment intent with stripe
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = parseInt(price) * 100 * 80;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        "payment_method_types": [
          "card"
        ],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // save payment info to db
    app.post("/payments", async(req, res) => {
      try {
        const payment = req.body;
        // console.log(payment);
        const id = payment.bookingId;
        // console.log(id);
        const filter = {_id: ObjectId(id)};
        // const options = {upsert: true};
        const filter2 = {_id: ObjectId(payment.productId)};
        const updatedDoc = {
          $set: {
            paid: true,
            transactionId: payment.transactionId
          }
        }
        const updatedDoc2 = {
          $set: {
            isAvailable: false,
          }
        }
        const result = await paymentsCollection.insertOne(payment);
        const bookingUpdate = await bookingsCollection.updateOne(filter, updatedDoc);
        // const updateWishlist = await wishlistProductCollections.updateOne(filter2, updatedDoc, {upsert: false});
        const updateProductsCollection = await allProductsCollection.updateOne(filter2, updatedDoc2);
        // console.log(filter2, updateProductsCollection);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.send(error)
      }

    })

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

    // post wishlist products
    app.post("/mywishlist", async (req, res) => {
      try {
        const wishlistProduct = req.body;
        const result = await wishlistProductCollections.insertOne(
          wishlistProduct
        );
        if (result) {
          res.json({
            status: true,
            message: "successfully added in wishlist",
          });
        } else {
          res.json({
            status: true,
            message: "Failed to add in wishlist",
          });
        }
      } catch (error) {
        res.json({
          status: false,
          message: error.message,
        });
      }
    });

    app.get("/myWishlists/:currentEmail", verifyJWT, async (req, res) => {
      try {
        const email = req.params?.currentEmail;
        const decodedEmail = req.decoded.email;
        // console.log(decodedEmail, email)

        if (email !== decodedEmail) {
          return res.status(403).json({ message: "forbidden access" });
        }
        const myWishlists = await wishlistProductCollections
          .find({ email })
          .toArray();
        // console.log(myWishlists);
        if (myWishlists) {
          res.json({
            status: true,
            message: "My Wishlists got successfully",
            data: myWishlists,
          });
        } else {
          res.json({ status: false, message: "data got failed", data: [] });
        }
      } catch (error) {
        res.json({ status: false, message: error.message });
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
  } finally {
  }
}
run().catch((err) => console.log(err));

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
