"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function Signin() {
  const [email, setEmail] = useState<string>("");
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="px-4 py-4 border-2 border-white">
        <label>signin with email:</label>
        <input
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(event.target.value)
          }
          type="text"
          className="w-full border-2 border-white outline-none focus:ring-1 ring-slate-700 ring-0"
        />
        <button
          onClick={() => signIn("email", { email })}
          className="border-2 rounded-md p-2 text-white text-2x"
        >
          signin with email
        </button>
        <button
          onClick={() => signIn("google")}
          className="border-2 rounded-md p-2 text-white text-2xl"
        >
          signin
        </button>
      </div>
    </div>
  );
}
