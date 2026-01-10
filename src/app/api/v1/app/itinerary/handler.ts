import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getItenerarySchema } from "@/zodTypes/getItenerary";
import { getItinerarySystemPrompt } from "@/lib/prompts/getItinerarySystemPrompt";
import z from "zod";
import { photonRequestFunction } from "@/utils/photonRequest";
export const aiResponseHandler = async (req: NextRequest, userId: string) => {
  const reqBody = await req.json();
  type ReqBodyType = z.infer<typeof getItenerarySchema>;
  const userObject = reqBody as ReqBodyType;
  const fromPlaceObject: {
    fromOrTo: "from";
    placeName: string;
    osm_key: "place";
    country: string;
    osm_id: number;
  } = {
    fromOrTo: "from",
    placeName: userObject.fromPlace.name,
    country: userObject.fromPlace.country,
    osm_key: "place",
    osm_id: userObject.fromPlace.osm_id,
  };

  const toPlaceObject: {
    fromOrTo: "to";
    placeName: string;
    country: string;
    osm_key: "place" | "historic" | "tourism";
    osm_id: number;
  } = {
    fromOrTo: "to",
    placeName: userObject.toPlace.name,
    country: userObject.toPlace.country,
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
            text: getItinerarySystemPrompt,
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
  let finalItenerary = "";
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",

    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }],
      systemInstruction: getItinerarySystemPrompt,
    },

    contents: JSON.stringify(userObject),
  });

  function responseToStream() {
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await response.next();
        if (done) {
          const iteneraryInDb = await prisma?.itenerary.create({
            data: { text: finalItenerary, userId },
          });
          if (!iteneraryInDb)
            throw new Error("could not save itenerary in DB ");
          controller.close();
          return;
        }
        finalItenerary += value.text;
        controller.enqueue(value.text);
      },
    });
  }
  const responseStream = responseToStream();

  return new Response(responseStream);
};
