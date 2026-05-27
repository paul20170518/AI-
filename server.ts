import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { registerApiRoutes } from "./server-routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // Register shared high-performance AI mosquito designer API routes
  registerApiRoutes(app);

  // Serve static assets or mount Vite middleware for local & sandbox runtimes
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in Development mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[安全後端] 防蚊物理 AI 伺服器正執行於 http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});
