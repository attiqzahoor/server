require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require('moment');
require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


const uri = (process.env.MONGO_URL);
    
// Connect to MongoDB Atlas
mongoose
    .connect(uri)
    .then(() => {
        console.log("Connected to MongoDB Atlas");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB Atlas", err);
    });

const providerSchema = new mongoose.Schema({
    providerAddress: { type: String, unique: true },
    amountWBTC: String,
    amountRUNE: String,
    lpTokenKey: { type: String, unique: true },
    timestamp: String,
});

const Provider = mongoose.model("Provider", providerSchema);

app.use(express.json());

app.post("/api/provider", async (req, res) => {
    const { providerAddress, amountWBTC, amountRUNE, lpTokenKey } = req.body;

    if (!providerAddress || !amountWBTC || !amountRUNE || !lpTokenKey) {
        return res.status(400).send({ message: "Missing required fields" });
    }

    try {
        const timestamp = moment().tz('Asia/Karachi').format();

        const existingProvider = await Provider.findOne({ providerAddress });

        if (existingProvider) {
            // Update existing provider
            existingProvider.amountWBTC = amountWBTC;
            existingProvider.amountRUNE = amountRUNE;
            existingProvider.lpTokenKey = lpTokenKey;
            existingProvider.timestamp = timestamp;

            await existingProvider.save();
            return res.status(200).send(existingProvider);
        } else {
            // Create new provider
            const provider = new Provider({
                providerAddress,
                amountWBTC,
                amountRUNE,
                lpTokenKey,
                timestamp,
            });

            await provider.save();
            return res.status(201).send(provider);
        }
    } catch (error) {
        console.error("Error saving provider:", error);
        res.status(400).send({ message: "Failed to store provider info", error });
    }
});

app.get("/api/providers", async (req, res) => {
    try {
        const providers = await Provider.find();
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Define schema and model for poolInfos collection
const poolInfoSchema = new mongoose.Schema({
    RuneChart: {
        type: Number,
        required: true,
    },
    WbtcChart: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const PoolInfo = mongoose.model("PoolInfo", poolInfoSchema);

// Route to insert data into poolInfos collection
// app.post("/api/poolinfo", async (req, res) => {
//     try {
//         const { RuneChart, WbtcChart } = req.body;

//         // Check if a document with the same RuneChart and WbtcChart already exists
//         const existingPoolInfo = await PoolInfo.findOne({ RuneChart, WbtcChart });

//         if (existingPoolInfo) {
//             // If a matching document is found, return a message indicating that the data already exists
//             return res.status(200).json({ message: "Data already exists" });
//         }

//         // Create a new PoolInfo document with the provided data
//         const newPoolInfo = new PoolInfo({
//             RuneChart,
//             WbtcChart,
//         });

//         // Save the new document to MongoDB
//         const savedPoolInfo = await newPoolInfo.save();

//         // Respond with the ID of the newly created document
//         res.status(201).json({ id: savedPoolInfo._id });
//     } catch (error) {
//         // Log the error and respond with a 500 status code and error message
//         console.error("Error inserting data into MongoDB:", error);
//         res.status(500).json({ error: "Error inserting data into MongoDB" });
//     }
// });

// Route to insert data into poolInfos collection
app.post("/api/poolinfo", async (req, res) => {
    try {
        const { RuneChart, WbtcChart } = req.body;

        // Create a new PoolInfo document with the provided data
        const newPoolInfo = new PoolInfo({
            RuneChart,
            WbtcChart,
        });

        // Save the new document to MongoDB
        const savedPoolInfo = await newPoolInfo.save();

        // Respond with the newly created document
        res.status(201).json(savedPoolInfo);
    } catch (error) {
        // Log the error and respond with a 500 status code and error message
        console.error("Error inserting data into MongoDB:", error);
        res.status(500).json({ error: "Error inserting data into MongoDB" });
    }
});


// Route to fetch data from poolInfos collection
app.get("/api/poolinfos", async (req, res) => {
    try {
        const poolInfos = await PoolInfo.find();
        res.json(poolInfos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route to insert data into poolInfos collection
app.post("/api/poolinfo", async (req, res) => {
    try {
        const { RuneChart, WbtcChart } = req.body;

        // Check if a document with the same RuneChart and WbtcChart already exists
        const existingPoolInfo = await PoolInfo.findOne({ RuneChart, WbtcChart });

        if (existingPoolInfo) {
            // If a matching document is found, return the existing document
            return res.status(200).json(existingPoolInfo);
        }

        // Create a new PoolInfo document with the provided data
        const newPoolInfo = new PoolInfo({
            RuneChart,
            WbtcChart,
        });

        // Save the new document to MongoDB
        const savedPoolInfo = await newPoolInfo.save();

        // Respond with the newly created document
        res.status(201).json(savedPoolInfo);
    } catch (error) {
        // Log the error and respond with a 500 status code and error message
        console.error("Error inserting data into MongoDB:", error);
        res.status(500).json({ error: "Error inserting data into MongoDB" });
    }
});



// Define schema and model for swapData collection
const swapDataSchema = new mongoose.Schema({
    direction: String,
    amount: Number,
    rate: Number,
    address: String,
    estimatedAmount: Number,
    transactionFee: Number,
    timestamp: { type: Date, default: Date.now },
});

const SwapData = mongoose.model("SwapData", swapDataSchema);

// Route to insert swap data into the swapData collection
app.post("/api/storeSwapData", async (req, res) => {
    try {
        const { direction, amount, rate, address, estimatedAmount, transactionFee, timestamp } = req.body;

        const swapData = new SwapData({
            direction,
            amount,
            rate,
            address,
            estimatedAmount,
            transactionFee,
            timestamp,
        });

        await swapData.save();
        res.status(201).json({ message: "Swap data stored successfully", id: swapData._id });
    } catch (error) {
        console.error("Error storing swap data:", error);
        res.status(500).json({ error: "Error storing swap data" });
    }
});
app.get("/api/swapData", async (req, res) => {
    try {
        const swapData = await SwapData.find();
        res.json(swapData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
