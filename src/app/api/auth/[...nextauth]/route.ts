import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:
        "702374076486-m8qhgsladppc2blvcd6glbibvf7d2ajt.apps.googleusercontent.com",
      clientSecret: "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",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: "your-secret-key-here-replace-with-random-string",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
