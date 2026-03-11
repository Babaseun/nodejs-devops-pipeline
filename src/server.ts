import express, { Request, Response } from "express";
import morgan from "morgan";
import db from "./db/db";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

app.get("/health", async (req: Request, res: Response) => {
  try {
    await db.query("SELECT 1");
    return res.status(200).send({
      status: "healthy",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Database connection failed", e);
    return res.status(503).send({
      status: "unhealthy",
      db: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/status", (req: Request, res: Response) => {
  return res.status(200).send({
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.post("/process", async (req: Request, res: Response) => {
  const data = req.body;
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).send({ error: "No data provided" });
  }

  try {
    const result = await db.query(
      "INSERT INTO processed_data (data) VALUES ($1) RETURNING *",
      [data],
    );
    return res.status(200).send({
      message: "Data processed successfully",
      receivedData: result.rows[0].data,
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("Database error", err);
    return res.status(500).json({ error: "Failed to process data" });
  }
});

let server: any;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
