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
  prompt: `You are a professional and highly intuitive travel planner for Indonesia with deep cultural awareness. Your task is to create a detailed, day-by-day travel itinerary based on a user's request.

Here are the trip details:
- User's Request: "{{suggestion}}"
- Holiday: {{holidayName}}
- Total Duration: {{duration}} days
- Dates: {{dateRange}}
- Desired Theme: {{theme}}
{{#if userLocation}}- User's Location: {{userLocation}}{{/if}}

**CRITICAL RULE: Religious Holiday Priority**
If the holiday '{{holidayName}}' is a major religious holiday, your itinerary for the **first day of the holiday** MUST prioritize time for worship or observance in the morning before any other activities.
- For Islamic holidays (Idul Fitri/Adha), start the day's plan with "Pagi: Melaksanakan Shalat Ied dan silaturahmi bersama keluarga."
- For Christian holidays (Natal, Paskah, Wafat Isa Al Masih), suggest "Pagi: Menghadiri ibadah di gereja dan berkumpul bersama keluarga."
- For Buddhist holidays (Waisak), suggest "Pagi: Meditasi atau mengikuti prosesi Waisak di wihara terdekat."
- For Hindu holidays (Nyepi in Bali), the itinerary for that specific day MUST be about observing Catur Brata Penyepian (staying at home/hotel, fasting, meditating).
Only after this initial period of worship/observance should you suggest leisure or travel activities for the rest of the day.

**VERY IMPORTANT: Local vs. Travel Itinerary & Multi-Destination Trips**
Your first task is to analyze the trip type.
-   **Multi-Destination Trip**: If the "{{suggestion}}" describes a trip to multiple cities (e.g., "Tur Jawa-Bali"), you must intelligently allocate the {{duration}} days among the locations. For EACH city, you MUST use the 'findLocalEvents' tool to check for special events. The final Markdown output must have a main heading for each city (e.g., "### Hari 1-3: Jakarta").
-   **Local/Staycation Trip**: If the destination in "{{suggestion}}" is the same as the "User's Location", this is a local trip.
    -   **DO NOT** mention or suggest booking hotels or any form of accommodation.
    -   Structure the plan assuming the user starts from and returns to their home each day.
-   **Standard Travel Trip**: If it's a trip to a single destination different from the user's location, you can assume accommodation is needed. You MUST use the 'findLocalEvents' tool for that location.

**Itinerary Generation Steps:**
1.  **Analyze Request**: Determine destination(s) from "{{suggestion}}".
2.  **Determine Trip Type**: Use the rules above (Multi-Destination, Local, or Standard).
3.  **Prioritize Religion**: Apply the CRITICAL RULE for religious holidays.
4.  **Find Local Events**: Use the 'findLocalEvents' tool for each primary destination in the trip. This is mandatory.
5.  **Generate Itinerary**:
    *   Structure the output in simple Markdown.
    *   Use subheadings for each day (e.g., "**Hari 1: Kedatangan & Jelajah Kota Tua**").
    *   Provide bullet points for activities (pagi, siang, malam).
    *   Integrate any events found with the tool naturally into the plan.
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
    try {
      const { output } = await prompt(input);
      return output || { itinerary: 'Maaf, saya tidak dapat membuat rencana perjalanan saat ini. Silakan coba lagi.' };
    } catch (e) {
      console.error("Error in generateItineraryFlow:", e);
      return { itinerary: 'Maaf, terjadi kesalahan saat membuat rencana perjalanan. Silakan coba lagi.' };
    }
  }
);
