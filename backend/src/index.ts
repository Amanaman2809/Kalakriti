import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoute from "./routes/auth/signup";
import otpRoute from "./routes/auth/otp-ops";
import loginRoute from "./routes/auth/login";
import resetPassRoute from "./routes/auth/reset-pass";
import categoryRoute from "./routes/categories";
import productRoute from "./routes/admin/product";
import cartRoute from "./routes/cart";
import wishlistRoute from "./routes/whishlist";
import orderRoute from "./routes/order";
import feedbackRoute from "./routes/feedback";
import searchRoute from "./routes/search";
import createAdminRoute from "./routes/auth/create-admin";
import cloudinaryRoute from "./routes/cloudinary";
import addressRoute from "./routes/address";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    credentials: true,
  })
);
app.use("/api/auth", authRoute);
app.use("/api/otp", otpRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", createAdminRoute);
app.use("/api/auth", resetPassRoute);
app.use("/api", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/orders", orderRoute);
app.use("/api", feedbackRoute);
app.use("/api/search", searchRoute);
app.use("/api/cloudinary", cloudinaryRoute);
app.use("/api/address", addressRoute);

app.get("/", (_req, res) => {
  res.send("Hello from Kalakriti backend!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(PORT);
  console.log(`Server is running at http://localhost:${PORT}`);
});
