import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import { MONGODB_URI } from "./config.js";

let client;
let database;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    database = client.db("myDatabase");
    console.log("Connected to MongoDB");
  }
  return database;
}

export async function getCollection(collectionName) {
  const db = await connectToDatabase();
  return db.collection(collectionName);
}

// Create
export async function insertOne(collectionName, data) {
  const collection = await getCollection(collectionName);
  const result = await collection.insertOne(data);
  console.log(`Inserted document with _id: ${result.insertedId}`);
  return result.insertedId;
}

export async function insertMany(collectionName, dataArray) {
  const collection = await getCollection(collectionName);
  const result = await collection.insertMany(dataArray);
  console.log(`Inserted ${result.insertedCount} documents`);
  return result.insertedIds;
}

// Read
export async function findOne(collectionName, query) {
  const collection = await getCollection(collectionName);
  return await collection.findOne(query);
}

export async function find(collectionName, query = {}, options = {}) {
  const collection = await getCollection(collectionName);
  return await collection.find(query, options).toArray();
}

// Update
export async function updateOne(collectionName, filter, update) {
  const collection = await getCollection(collectionName);
  const result = await collection.updateOne(filter, { $set: update });
  console.log(`Updated ${result.modifiedCount} document`);
  return result;
}

export async function updateMany(collectionName, filter, update) {
  const collection = await getCollection(collectionName);
  const result = await collection.updateMany(filter, { $set: update });
  console.log(`Updated ${result.modifiedCount} documents`);
  return result;
}

// Delete
export async function deleteOne(collectionName, filter) {
  const collection = await getCollection(collectionName);
  const result = await collection.deleteOne(filter);
  console.log(`Deleted ${result.deletedCount} document`);
  return result;
}

export async function deleteMany(collectionName, filter) {
  const collection = await getCollection(collectionName);
  const result = await collection.deleteMany(filter);
  console.log(`Deleted ${result.deletedCount} documents`);
  return result;
}

// Utility function to convert string to ObjectId
export function toObjectId(id) {
  return new ObjectId(id);
}

export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log("Database connection closed");
  }
}

// This function can be called when your application is shutting down
export async function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  await closeConnection();
  console.log("Shutdown complete");
}

export async function insertETHPrice(price) {
  const db = await connectToDatabase();
  const collection = db.collection("cryptoPrices");
  const now = new Date();
  const result = await collection.insertOne({
    identifier: "ETH-USD",
    price: parseFloat(price),
    timestamp: now,
    readableTimestamp: now.toISOString(),
  });
  console.log(`Inserted ETH price: ${price} at ${now.toISOString()}`);
  return result;
}

export async function insertPOLPrice(price) {
  const db = await connectToDatabase();
  const collection = db.collection("cryptoPrices");
  const now = new Date();
  const result = await collection.insertOne({
    identifier: "POL-USD",
    price: parseFloat(price),
    timestamp: now,
    readableTimestamp: now.toISOString(),
  });
  console.log(`Inserted POL price: ${price} at ${now.toISOString()}`);
  return result;
}

export async function insertCryptoPrice(symbol, exchange, price) {
  const db = await connectToDatabase();
  const collection = db.collection("cryptoPrices");
  const now = new Date();
  const result = await collection.insertOne({
    symbol,
    exchange,
    price: parseFloat(price),
    timestamp: now,
    readableTimestamp: now.toISOString(),
  });
  console.log(
    `Inserted ${symbol} price from ${exchange}: ${price} at ${now.toISOString()}`
  );
  return result;
}
