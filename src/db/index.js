import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// Connect to MongoDB
const connectDB = async () => {
  try {

    const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

    console.log(`Connected to MongoDB || DB host: ${connectionInstance.connection.host}`);

  }  catch (err) {

    console.log("Error connecting to MongoDB", err)
    process.exit(1)

  }
}

export default connectDB;