const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5001
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("GearUp server is running ✅");
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dxoja8w.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const cartCollection = client.db('GearUp').collection('cart');
        const userCollection=client.db('GearUp').collection('user');
        await cartCollection.createIndex({ itemName: 1 }, { unique: true });

        // cart related API
        app.get('/cart', async (req, res) => {
            const cursor = cartCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/cart', async (req, res) => {
            const newItem = req.body;
            try {
                const result = await cartCollection.insertOne(newItem);
                res.status(201).send({ success: true, message: "Item added successfully!", result });
            }
            catch (error) {
                if (error.code === 11000) {
                    // Duplicate key error
                    res.status(400).send({ success: false, message: "Item already exists in cart!" });
                } else {
                    res.status(500).send({ success: false, message: "Internal server error", error });
                }
            }
        });

        app.delete('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })


        // user related API

        app.get('/user/:email',async(req,res)=>{
            const email=req.params.email;
            const query={email:email};
            const result=await userCollection.findOne(query);
            res.send(result);
        })

        app.get('/user', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/user',async(req,res)=>{
            const newUser=req.body;
            const result=await userCollection.insertOne(newUser);
            res.send(newUser);
        })

        app.patch('/user',async(req,res)=>{
            const email=req.body.email;
            const filter={email};
            const updatedDoc={
                $set:{
                    photo:req.body.photo,            
                    name:req.body.name,
                }
            }
            const result=await userCollection.updateOne(filter,updatedDoc);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
    } finally { }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Broh... server is running on port ${port}`);
});
