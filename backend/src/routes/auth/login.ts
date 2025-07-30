import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "../../generated/prisma/client";
import { generateToken } from "../../lib/jwt";
import googleStrategy from "../../lib/googleStrategy";
import passport from "passport";

const router = express.Router();
const prisma = new PrismaClient();

passport.use(googleStrategy);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({ error: "Wrong Password" });
    return;
  }

  if (!user.isVerified) {
    res.status(401).json({ error: "Account not verified" });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login Successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res, next) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      const { user, token } = req.user as {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        token: string;
      };

      res.json({
        message: "Google login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error); // Pass errors to Express error handler
    }
  }
);

export default router;

