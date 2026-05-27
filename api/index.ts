import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerApiRoutes } from "../server-routes";

dotenv.config();

const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());

// Register all API routes
registerApiRoutes(app);

// Export for Vercel Serverless Function handler
export default app;
