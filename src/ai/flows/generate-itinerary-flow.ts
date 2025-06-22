'use server';
/**
 * @fileOverview A flow to generate a detailed travel itinerary, capable of handling single or multi-destination requests.
 *
 * - generateItinerary - A function that creates a day-by-day plan for a trip.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findLocalEvents } from '@/ai/tools/find-local-events-tool';

const GenerateItineraryInputSchema = z.object({
  suggestion: z.string().describe('The travel/activity suggestion text. This can be a simple idea for one location (e.g., "Petualangan di Bromo") or a complex multi-destination request (e.g., "Tur 10 hari dari Jakarta ke Bali via Yogyakarta").'),
  duration: z.number().describe('The total duration of the trip in days.'),
  dateRange: z.string().describe('The date range of the trip.'),
  theme: z.string().describe('The theme of the trip (e.g., Adventure, Relaxation).'),
  holidayName: z.string().describe('The name of the holiday.'),
  userLocation: z.string().optional().describe("The user's current city to determine if the trip is local or requires travel and accommodation."),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

const GenerateItineraryOutputSchema = z.object({
  itinerary: z.string().describe('A detailed day-by-day itinerary in Markdown format.'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;

export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: { schema: GenerateItineraryInputSchema },
  output: { schema: GenerateItineraryOutputSchema },
  tools: [findLocalEvents],
  prompt: `You are a professional and highly intuitive travel planner for Indonesia. Your task is to create a detailed, day-by-day travel itinerary based on a user's request. You are capable of creating both standard travel plans and local "staycation" style plans.

Here are the trip details:
- User's Request: "{{suggestion}}"
- Holiday: {{holidayName}}
- Total Duration: {{duration}} days
- Dates: {{dateRange}}
- Desired Theme: {{theme}}
{{#if userLocation}}- User's Location: {{userLocation}}{{/if}}

**VERY IMPORTANT: Local vs. Travel Itinerary**
Your most important task is to first determine if this is a local trip or a trip that requires travel and accommodation.
- A trip is **LOCAL** if the destination in "{{suggestion}}" appears to be the same city as the "User's Location".
- If it is a **LOCAL** trip (staycation/day-trip):
    - **DO NOT** mention or suggest booking hotels, guesthouses, or any form of accommodation.
    - Structure the plan assuming the user starts from and returns to their home each day.
    - Use phrases like "Pagi: Berangkat dari rumah menuju..." or "Sore: Kembali ke rumah untuk beristirahat."
    - Focus on activities within the city.
- If it is a **TRAVEL** trip (the destination is different from the user's location) or a multi-destination trip:
    - You can implicitly assume accommodation is needed. Structure it like a normal travel plan.
    - For multi-destination trips, intelligently allocate the {{duration}} days among the locations. For example, for a 10-day Jakarta-Yogya-Bali trip, you might allocate 2 days for Jakarta, 3 for Yogyakarta, 4 for Bali, and 1 for travel.

**Itinerary Generation Steps:**
1.  **Analyze the Request**: Determine the destination(s) from "{{suggestion}}".
2.  **Determine Trip Type**: Based on the rule above, decide if it's LOCAL or TRAVEL.
3.  **Find Local Events**: For each primary location, use the 'findLocalEvents' tool to check for special events happening during the specified dates.
4.  **Generate the Itinerary**:
    *   Structure the output in simple Markdown.
    *   For multi-destination trips, use a main heading for each city and the days allocated (e.g., "### Hari 1-3: Jakarta").
    *   Use a subheading for each day (e.g., "**Hari 1: Kedatangan & Jelajah Kota Tua**").
    *   Provide bullet points for suggested activities (pagi, siang, malam).
    *   If the tool found events, integrate them naturally into the plan (e.g., "Sore: Menyaksikan parade Ogoh-ogoh.").
    *   Include recommendations for places to eat that fit the theme.
    *   Keep the language in Bahasa Indonesia. Make it sound helpful and inspiring.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
