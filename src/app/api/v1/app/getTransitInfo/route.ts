import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  getTransitInfoSchema,
  transitInfoLlmSchema,
} from "@/zodTypes/getTransitInfo";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import Groq from "groq-sdk";
import { getTransitInfoSystemPrompt } from "@/lib/prompts/getTransitInfoSystemPrompt";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
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
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "transit-info-llm-schema",

        schema: z.toJSONSchema(transitInfoLlmSchema),
      },
    },
    model: "openai/gpt-oss-20b",
  });

  const rawResult = JSON.parse(response.choices[0].message.content || "{}");
  const validatedResult = transitInfoLlmSchema.safeParse(rawResult);
  return !validatedResult.success
    ? NextResponse.json({ msg: "internal server error" }, { status: 500 })
    : NextResponse.json({ result: rawResult });
}
