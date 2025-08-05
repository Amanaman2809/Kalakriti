import { Strategy as GoogleStrategy,Profile } from "passport-google-oauth20";
import { generateToken } from "./jwt";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export interface VerifiedGoogleProfile {
  id: string;
  email: string;
  name: string;
}

export function isProfileValid(
  profile: Profile
): profile is Profile & { emails: { value: string }[] } {
  return !!profile.emails?.[0]?.value;
}

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!isProfileValid(profile)) {
        return done(new Error("Invalid Google profile: email missing"));
      }

      let user = await prisma.user.findUnique({
        where: { email: profile.emails?.[0].value },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: profile.displayName,
            email: profile.emails[0].value,
            oauthId: profile.id,
            oauthProvider: "google",
            isVerified: true,
            password: null,
            phone: "",
            role: "USER",
          },
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const userWithToken = {
        ...user,
        token,
      };

      return done(null, userWithToken);
    } catch (error) {
      return done(error as Error);
    }
  }
);


export default googleStrategy;
