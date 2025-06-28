import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoute from "./routes/auth/signup";
import otpRoute from "./routes/auth/otp-ops";
import loginRoute from "./routes/auth/login";
import meRoute from "./routes/auth/me";
import resetPassRoute from "./routes/auth/reset-pass";
import categoryRoute from "./routes/categories";
import productRoute from "./routes/admin/product";
import cartRoute from "./routes/cart";
import wishlistRoute from "./routes/whishlist";
import orderRoute from "./routes/order";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  }),
);
app.use("/api/auth", authRoute);
app.use("/api/otp", otpRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", meRoute);
app.use("/api/auth", resetPassRoute);
app.use("/api", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/order", orderRoute);

app.get("/", (_req, res) => {
  res.send("Hello from Kalakriti backend!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
