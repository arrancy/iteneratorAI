import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import { aiResponseHandler } from "./handler";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ msg: "unauthenticated" }, { status: 400 });
    }

    return aiResponseHandler(req, session.user.id);
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
