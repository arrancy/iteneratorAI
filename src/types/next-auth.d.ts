import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Token {
    id: string;
  }
  interface Session {
    user?: { id: string };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
