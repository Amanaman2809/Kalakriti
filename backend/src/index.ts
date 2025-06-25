import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth/signup";
import otpRoute from "./routes/auth/otp-ops";
import loginRoute from "./routes/auth/login";
import meRoute from "./routes/auth/me";
import resetPassRoute from "./routes/auth/reset-pass";
import categoryRoute from "./routes/admin/categories";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/otp", otpRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", meRoute);
app.use("/api/auth", resetPassRoute);
app.use("/api/admin", categoryRoute);

app.get("/", (_req, res) => {
  res.send("Hello from Kalakriti backend!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
