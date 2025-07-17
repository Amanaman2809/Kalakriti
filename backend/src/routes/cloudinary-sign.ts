import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinarySign = (req: Request, res: Response) => {
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
};