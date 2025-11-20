import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";

dotenv.config();
const app = express();

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

// The below is also a valid way to connect to MongoDB but it is not recommended as it makes the index.js file more polluted
/*
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

dotenv.config();
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error("Error connecting to MongoDB", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    throw error;
  }
})();
*/
