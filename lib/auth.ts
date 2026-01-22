import { getServerSession, type NextAuthOptions } from "next-auth"; // Preferred over /core/types
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import { z } from "zod";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any), // 'as any' is likely no longer needed with @next-auth/prisma-adapter
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(8),
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) throw new Error("Invalid input format.");

          const { email, password } = parsedCredentials.data;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          // Return null if user not found (standard NextAuth practice)
          if (!user || !user.password) {
            throw new Error(user ? "Please use social login" : "No user found");
          }

          const isPasswordCorrect = await bcrypt.compare(password, user.password);
          if (!isPasswordCorrect) throw new Error("Incorrect Credentials.");

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileImage: user.profileImage,
          };
        } catch (error: any) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileImage = user.profileImage;
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, profileImage: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.profileImage = dbUser.profileImage;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.profileImage = token.profileImage as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};



export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Returns current logged-in user ID
 */
export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
