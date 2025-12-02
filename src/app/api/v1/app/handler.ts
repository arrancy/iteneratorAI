import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getItenerarySchema } from "@/zodTypes/getItenerary";
import { systemPrompt } from "@/lib/systemPrompt";
import z from "zod";
import { photonRequestFunction } from "@/utils/photonRequest";
import { ModifiedRequest } from "./route";
import { tokenBucket } from "@/rateLimiter/state";
export const aiResponseHandler = async (req: ModifiedRequest) => {
  const reqBody = await req.json();
  type ReqBodyType = z.infer<typeof getItenerarySchema>;
  const userObject = reqBody as ReqBodyType;
  const fromPlaceObject: {
    fromOrTo: "from";
    placeName: string;
    osm_key: "place";
    osm_id: number;
  } = {
    fromOrTo: "from",
    placeName: userObject.fromPlace.name,
    osm_key: "place",
    osm_id: userObject.fromPlace.osm_id,
  };

  const toPlaceObject: {
    fromOrTo: "to";
    placeName: string;
    osm_key: "place" | "historic" | "tourism";
    osm_id: number;
  } = {
    fromOrTo: "to",
    placeName: userObject.toPlace.name,
    osm_key: userObject.toPlace.osm_key,
    osm_id: userObject.toPlace.osm_id,
  };

  const isFromPlaceValid = await photonRequestFunction(fromPlaceObject);
  const isToPlaceValid = await photonRequestFunction(toPlaceObject);
  if (!isFromPlaceValid || !isToPlaceValid)
    return NextResponse.json({ msg: "invalid inputs 2" }, { status: 401 });
  const ai = new GoogleGenAI({});

  const tokenResponse = await ai.models.countTokens({
    model: "gemini-2.5-flash",
    // Put system instruction as a content item with role 'system'

    contents: [
      {
        role: "system",

        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify(userObject),
          },
        ],
      },
    ],
  });
  console.log(tokenResponse);

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",

    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }],
      systemInstruction: systemPrompt,
    },

    contents: JSON.stringify(userObject),
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
  new Response(responseStream);

  const limitingToken = req.rateLimitingToken || "";

  tokenBucket.push(limitingToken);
  delete req.rateLimitingToken;
};
