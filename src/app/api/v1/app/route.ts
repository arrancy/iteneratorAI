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
              // NOTE: valid text; use plain text or valid JSON string if you prefer.
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

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",

    config: {
      systemInstruction:
        "you are an expert travel/vacation planner, you have knowledge of all the places across the world and ways to travel to those places. ###instructions### your job is to make iteneraries as per the user requests and with every consideration(that the user has provided) kept in mind, in the user instruction there will be a json object with four fields, 1.'start date' meaning the day they can start travelling, 2.'end date': meaning the day they have to reach back at their original location 3.'place' : meaning the place they want to travel to 4. 'from':meaning the place that they are travelling from i.e. their initial location or starting location. ### additional information ### assume that there is only one person travelling and their budget is low.",
    },
    contents:
      "{'startDate': '11/2/2026', 'enddate' : '17/2/2026', place: 'coorg, karnataka, india' from : 'mumbai, india' }",
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
