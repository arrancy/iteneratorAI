import z from "zod";
export const getItenerarySchema = z.object({
  fromPlace: z.object({
    name: z.string().min(1),
    class: z.enum(["place"]),
  }),
  toPlace: z.object({
    name: z.string().min(1),
    class: z.enum(["place", "historic", "tourism"]),
  }),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

// so we can take the display name for sure , on top of that we can also take class, class can be place, tourism , or historic that's it, and we can add in the system prompt that
// if the class is historic or tourism then we can suggest the LLM in the prompt that you can add keep visiting that place at the top priority
// and if the duration allows then include other things nearby that place in the itinerary
