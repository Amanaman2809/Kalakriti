import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

router.get('/sign', (req: Request, res: Response) => {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp,
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            },
            process.env.CLOUDINARY_API_SECRET!
        );
  
        res.json({
            success: true,
            timestamp,
            signature,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        console.error("Signature generation failed:", error);
        res.status(500).json({ success: false, error: "Signature generation failed" });
    }
});

router.post("/remove", async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;
    // Extract public_id from the URL
    const parts = imageUrl.split("/");
    const publicIdWithExtension = parts[parts.length - 1]; 
    const publicId = publicIdWithExtension.split(".")[0]; 
    const result = await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, result });
  } catch (error) {
    console.error("Image deletion failed:", error);
    res.status(500).json({ success: false, error: "Image deletion failed" });
  }
});
  

export default router;