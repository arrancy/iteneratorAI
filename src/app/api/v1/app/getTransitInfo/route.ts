import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getTransitInfoSchema } from "@/zodTypes/getTransitInfo";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getTransitInfoSystemPrompt } from "@/lib/prompts/getTransitInfoSystemPrompt";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ msg: "unauthenticared" }, { status: 401 });
  }
  const reqBody = await req.json();
  const { success } = getTransitInfoSchema.safeParse(reqBody);
  if (!success)
    return NextResponse.json({ msg: "invalid inputs" }, { status: 400 });

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: getTransitInfoSystemPrompt },
      { role: "user", content: JSON.stringify(reqBody) },
    ],
    model: "moonshotai/kimi-k2-instruct",
  });
}
