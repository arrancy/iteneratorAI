import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import { areYouAllowed, tokenBucket, waitingArray } from "@/rateLimiter/state";
import { aiResponseHandler } from "./handler";
export interface ModifiedRequest extends NextRequest {
  rateLimitingToken?: string;
}

export async function POST(req: ModifiedRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ msg: "unauthenticated" }, { status: 400 });
    }
    if (!areYouAllowed(session.user.id)) {
      await new Promise<void>((resolve) =>
        setInterval(() => {
          if (!session.user) return;

          if (waitingArray.includes(session.user.id)) return;
          else {
            const currentToken = tokenBucket.pop();
            if (!currentToken) {
              return;
            }
            req.rateLimitingToken = currentToken;
            resolve();
          }
        }, 1000)
      );
      aiResponseHandler(req);
    } else {
      const rateLimitingToken = areYouAllowed(session.user.id);
      if (rateLimitingToken === false) {
        return NextResponse.json({ msg: "too many requests" }, { status: 429 });
      }
      req.rateLimitingToken = rateLimitingToken;
      aiResponseHandler(req);
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: "internal server error" }, { status: 500 });
  }
}

// function setTimeoutPromisified(delay: number) {
//   return new Promise((res) =>
//     setTimeout(() => res(delay), delay);
//   });
// }
// setTimeoutPromisified(1000).then(() => {});
