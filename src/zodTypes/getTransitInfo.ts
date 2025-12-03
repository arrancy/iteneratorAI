import z from "zod";
import { getItenerarySchema } from "./getItenerary";
export const getTransitInfoSchema = z.object({
  getItineraryInput: getItenerarySchema,
  itinerary: z.string().min(1),
});
