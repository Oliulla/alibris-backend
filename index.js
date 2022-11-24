const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();

const port = process.env.PORT || '5000';

// middlewares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.g9drewa.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  console.log('database connected')
});


// test server endpoint
app.get('/', (req, res) => {
    res.send('alibris server is ready to use')
})

app.listen(port, () => {
    console.log(`alibris server is running on: ${port}`)
})