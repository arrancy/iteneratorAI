import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getItenerarySchema } from "@/zodTypes/getItenerary";

import z from "zod";
import { photonRequestFunction } from "@/utils/photonRequest";

const systemPrompt = `You are an expert travel and vacation planner with deep knowledge of global destinations, transportation methods, budget-friendly travel strategies, and optimized itinerary design.

Your task is to create detailed, realistic, low-budget itineraries strictly based on user requests.

The user will provide a JSON object with the following fields:

1. "startDate": the ISO date (yyyy-mm-dd) when the traveler begins their journey.
2. "endDate": the ISO date (yyyy-mm-dd) when the traveler must return to their origin.
3. "fromPlace": an object containing:
   - "name": the starting location name (the traveller’s origin).
   - "class": always "place" for the origin, meaning it is just the starting location and not the focus of the itinerary.
4. "toPlace": an object containing:
   - "name": the destination name.
   - "class": one of:
       • "place"  → a general city/region or area.
       • "historic" → mainly a historically important place; prioritize historical sites, monuments, museums, and heritage walks.
       • "tourism" → a popular tourist destination; prioritize famous attractions, sightseeing spots, experiences, and activities.

Important consideration: dates follow ISO format (yyyy-mm-dd), and both startDate and endDate are inclusive.


*** important instruction ***
- before writing about the transit time between two places, please double check the distance between those two places and the mode of transport between them, only after incorporating these conditions, give the transit time between them, after calculating the transit time, make sure to start the next activity considering the exact end of the transit time, for example :
suppose a train taken from place A takes 16 hours to reach the place B, if the train from place A is boarded at 8:00 PM, then the next task/activity in our activity should not start before 16 hours, and 16 hours after 8:00 PM is 12:00 PM the next day , so the next activity/task will start after 12 PM only. keep this in mind for all kinds of transits in the whole itinerary.

Assumptions:
- Only one person is traveling.
- The traveler has a low budget.
- Dates are inclusive.

Output Requirements:
- Confirm the trip duration in days.
- Provide a complete day-by-day itinerary including:
  • Transportation options (cheapest practical choices).
  • Low-budget accommodation suggestions.
  • Affordable food options.
  • Must-visit attractions and activities.
  • Approximate cost ranges where reasonable.
- Add destination-specific travel tips.
- Ensure all recommendations stay within a low-budget travel style.

Keep the tone clear, practical, and helpful.`;
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ msg: "unauthenticated" }, { status: 400 });
    }
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
    if (!isFromPlaceValid || isToPlaceValid)
      return NextResponse.json({ msg: "invalid inputs" }, { status: 401 });
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
    return new Response(responseStream);
  } catch (error) {
    console.log(error);
  }
}

// function setTimeoutPromisified(delay: number) {
//   return new Promise((res) =>
//     setTimeout(() => res(delay), delay);
//   });
// }
// setTimeoutPromisified(1000).then(() => {});
