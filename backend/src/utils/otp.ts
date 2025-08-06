import crypto from "crypto";
import { sendMail } from "./mailer";

export function generateOTP(length = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
}

export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export const sendOTPByEmail = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your Verification Code</h2>
      <p>Please use the following code to verify your account:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 2px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendMail({
    to: email,
    subject: `Kalakriti Account Verification for Password reset`,
    html,
  });
};
