import express from "express";
import { sendMail } from "../utils/mailer";

const router = express.Router();
const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

router.post("/send", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required",
      });
    }

    // Email to admin (you/client)
    const adminEmailSent = await sendMail({
      to: process.env.EMAIL_USER || "ajitsinghchouhan72@gmail.com",
      subject: `New Contact Form: ${subject || "General Inquiry"}`,
      html: `
  <div style="margin:0;padding:0;background:#f8f9fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(42,61,102,0.08);">
            <tr>
              <td align="center" style="background:linear-gradient(135deg, #2a3d66 0%, #3a5080 100%);padding:24px 16px;">
                <img src="https://res.cloudinary.com/kkk-cloudinary523/image/upload/v1760704769/logo_sm_ypypz6.png" alt="Chalava" height="40" style="display:block;height:40px;">
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;color:#1f1b24;">
                <h2 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#2a3d66;">New contact submission</h2>
                <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">A new message was sent from the website contact form.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="width:140px;color:#2a3d66;font-weight:700;font-size:13px;vertical-align:top;padding-top:2px;">Name</td>
                    <td style="font-size:14px;color:#1f1b24;font-weight:500;">${esc(
                      name
                    )}</td>
                  </tr>
                  <tr>
                    <td style="width:140px;color:#2a3d66;font-weight:700;font-size:13px;vertical-align:top;padding-top:2px;">Email</td>
                    <td style="font-size:14px;color:#1f1b24;">
                      <a href="mailto:${esc(
                        email
                      )}" style="color:#3a5080;text-decoration:none;font-weight:500;">${esc(
        email
      )}</a>
                    </td>
                  </tr>
                  ${
                    phone
                      ? `
                  <tr>
                    <td style="width:140px;color:#2a3d66;font-weight:700;font-size:13px;vertical-align:top;padding-top:2px;">Phone</td>
                    <td style="font-size:14px;color:#1f1b24;">
                      <a href="tel:${esc(
                        phone
                      )}" style="color:#3a5080;text-decoration:none;font-weight:500;">${esc(
                          phone
                        )}</a>
                    </td>
                  </tr>`
                      : ``
                  }
                  ${
                    subject
                      ? `
                  <tr>
                    <td style="width:140px;color:#2a3d66;font-weight:700;font-size:13px;vertical-align:top;padding-top:2px;">Subject</td>
                    <td style="font-size:14px;color:#1f1b24;font-weight:500;">${esc(
                      subject
                    )}</td>
                  </tr>`
                      : ``
                  }
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;">
                <div style="color:#2a3d66;font-weight:700;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Message</div>
                <div style="font-size:14px;color:#1f1b24;line-height:1.7;background:#f8f9fb;border-left:4px solid #2a3d66;border-radius:8px;padding:16px 18px;">
                  ${esc(message).replace(/\n/g, "<br>")}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;color:#666;font-size:12px;line-height:1.5;">
                <div style="background:#f8f9fb;border-radius:8px;padding:12px;">
                  💬 Reply to this email to reach <span style="font-weight:600;color:#2a3d66;">${esc(
                    name
                  )}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
      `,
    });

    // Confirmation email to customer
    const customerEmailSent = await sendMail({
      to: email,
      subject: "We received your message! - Chalava",
      html: `
      <div style="margin:0;padding:0;background:#f8f9fb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(42,61,102,0.08);">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg, #2a3d66 0%, #3a5080 100%);padding:24px 16px;">
                    <img src="https://res.cloudinary.com/kkk-cloudinary523/image/upload/v1760704769/logo_sm_ypypz6.png" alt="Chalava" height="40" style="display:block;height:40px;">
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px 20px 24px;font-family:Arial,Helvetica,sans-serif;color:#1f1b24;">
                    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#2a3d66;">Thank you for reaching out!</h2>
                    <p style="margin:0 0 16px 0;color:#666;font-size:14px;line-height:1.6;">Hi <span style="font-weight:600;color:#2a3d66;">${esc(
                      name
                    )}</span>, your message has been received by Chalava's team and will be reviewed within <strong>24 hours</strong>.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:16px 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;color:#888;font-size:12px;line-height:1.6;">
                    <div style="border-top:1px solid #e5e8ed;padding-top:16px;">
                      📍 Shop No. 30, Abhinandan Vihar, Vaishali Nagar, Jaipur<br>
                      📞 <a href="tel:+918209101822" style="color:#3a5080;text-decoration:none;">+91 82091 01822</a> • 
                      📧 <a href="mailto:Chalavamail@gmail.com" style="color:#3a5080;text-decoration:none;">Chalavamail@gmail.com</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    });

    if (!adminEmailSent || !customerEmailSent) {
      throw new Error("Failed to send one or more emails");
    }

    console.log("✅ Contact form emails sent successfully");

    res.json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
    });
  } catch (error: any) {
    console.error("❌ Error sending contact form email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again.",
    });
  }
});

export default router;
