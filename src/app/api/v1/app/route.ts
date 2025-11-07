import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ msg: "unauthenticated" });
  }

  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "explain how LLMs work in detail",
  });
  function responseToStream() {
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await response.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value.text);
      },
    });
  }
  const responseStream = responseToStream();
  return new Response(responseStream);
}

// function setTimeoutPromisified(delay: number) {
//   return new Promise((res) =>
//     setTimeout(() => res(delay), delay);
//   });
// }
// setTimeoutPromisified(1000).then(() => {});
