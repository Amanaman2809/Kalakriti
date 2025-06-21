import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { supabase } from "./lib/supabase";

dotenv.config();

const PORT = process.env.PORT || 8000;
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello from Kalakriti backend!");
});
app.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
