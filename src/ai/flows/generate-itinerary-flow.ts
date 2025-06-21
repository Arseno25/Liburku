'use server';
/**
 * @fileOverview A flow to generate a detailed travel itinerary.
 *
 * - generateItinerary - A function that creates a day-by-day plan for a trip.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateItineraryInputSchema = z.object({
  suggestion: z.string().describe('The travel/activity suggestion text that this itinerary should be based on.'),
  duration: z.number().describe('The total duration of the trip in days.'),
  dateRange: z.string().describe('The date range of the trip.'),
  theme: z.string().describe('The theme of the trip (e.g., Adventure, Relaxation).'),
  holidayName: z.string().describe('The name of the holiday.'),
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
  prompt: `You are a professional travel planner for Indonesia. Your task is to create a detailed, day-by-day travel itinerary.

Here are the trip details:
- Holiday: {{holidayName}}
- Duration: {{duration}} days
- Dates: {{dateRange}}
- Theme: {{theme}}
- Core Idea: "{{suggestion}}"

Based on this information, generate a practical and exciting itinerary.
- Structure the output in simple Markdown.
- Use a heading (e.g., "Hari 1: ...") for each day.
- Under each day, provide bullet points for suggested activities (morning, afternoon, evening).
- Include recommendations for places to eat (breakfast, lunch, dinner) that fit the theme.
- Keep the language in Bahasa Indonesia.
- Make it sound helpful and inspiring.
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
