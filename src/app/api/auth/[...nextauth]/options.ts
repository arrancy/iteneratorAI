import Google from "next-auth/providers/google";
import prisma from "@/lib/db/singleton";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
export const authOptions: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (
        user &&
        account?.provider === "google" &&
        profile &&
        "email_verified" in profile
      ) {
        const isVerified = profile.email_verified;
        const { email } = user;
        if (!email) return token;
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) return token;
        if (!dbUser.emailVerified && isVerified) {
          await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
          });
        }
        token.id = dbUser.id;
        return token;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }
      session.user.id = token.id || "";
      return session;
    },
  },
};
