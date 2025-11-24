import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import z from "zod";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ msg: "unauthenticated" }, { status: 400 });
  }

  const ai = new GoogleGenAI({});
  const tokenResponse = await ai.models.countTokens({
    model: "gemini-2.5-flash",
    // Put system instruction as a content item with role 'system'

    contents: [
      {
        role: "system",
        parts: [
          {
            text: "you are an expert travel/vacation planner, you have knowledge of all the places across the world and ways to travel to those places. ###instructions### your job is to make iteneraries as per the user requests and with every consideration(that the user has provided) kept in mind, in the user instruction there will be a json object with four fields, 1.'start date' meaning the day they can start travelling, 2.'end date': meaning the day they have to reach back at their original location 3.'place' : meaning the place they want to travel to 4. 'from':meaning the place that they are travelling from i.e. their initial location or starting location. ### additional information ### assume that there is only one person travelling and their budget is low.",
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text:
              "{" +
              '"startDate":"11/2/2026",' +
              '"endDate":"17/2/2026",' +
              '"place":"coorg, karnataka, india",' +
              '"from":"mumbai, india"' +
              "}",
          },
        ],
      },
    ],
  });
  console.log(tokenResponse);
  const userObject = {
    startDate: "7/1/2026",
    endDate: "13/1/2026",
    place: "coorg, karnataka, india",
    from: "mumbai, maharashtra",
  };
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-pro",

    config: {
      systemInstruction: `You are an expert travel and vacation planner with deep knowledge of global destinations, transportation methods, budget-friendly travel strategies, and optimized itinerary design.

Your task is to create detailed, realistic, low-budget itineraries strictly based on user requests.

The user will provide a JSON object with the following fields:
1. "startDate": the date the traveler begins their journey.
2. "endDate": the date the traveler must return to their origin.
3. "place": the destination the traveler wants to visit.
4. "from": the starting location.
important consideration** : dates are in dd/mm/yyyy fromat.

*** important instruction ***
- before writing about the transit time between two places, please double check the distance between those two places and the mode of transport between them, only after incorporating these conditions, give the transit time between them.
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

Keep the tone clear, practical, and helpful.
`,
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
}

// function setTimeoutPromisified(delay: number) {
//   return new Promise((res) =>
//     setTimeout(() => res(delay), delay);
//   });
// }
// setTimeoutPromisified(1000).then(() => {});
