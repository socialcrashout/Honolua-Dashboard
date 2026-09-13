import mongoose from "mongoose"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("Add MONGODB_URI to .env.local")
}

let cached = global._mongooseConn

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null }
}

export async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).then((m) => m)
  }

  cached.conn = await cached.promise
  return cached.conn
}