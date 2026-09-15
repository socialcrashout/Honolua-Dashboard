import mongoose from "mongoose";

// If your codebase already has a Mongo connection helper, use that instead
// and delete this file — this is only here so the API routes below have
// something to import.

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}