"use client";

import { signIn } from "next-auth/react";

export default function Signin() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <button
        onClick={() => signIn("google")}
        className="border-2 rounded-md p-2 text-white text-2xl"
      >
        signin
      </button>
    </div>
  );
}
