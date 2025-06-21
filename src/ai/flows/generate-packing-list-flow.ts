'use server';
/**
 * @fileOverview A flow to generate a personalized packing list for a trip.
 *
 * - generatePackingList - A function that creates a packing list based on trip details.
 * - GeneratePackingListInput - The input type for the generatePackingList function.
 * - GeneratePackingListOutput - The return type for the generatePackingList function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GeneratePackingListInputSchema = z.object({
  suggestion: z.string().describe('The original travel suggestion text, which contains the location and general idea.'),
  itinerary: z.string().describe('The detailed travel itinerary in Markdown format.'),
  duration: z.number().describe('The total duration of the trip in days.'),
  theme: z.string().describe('The theme of the trip (e.g., Adventure, Relaxation).'),
});
export type GeneratePackingListInput = z.infer<typeof GeneratePackingListInputSchema>;

const GeneratePackingListOutputSchema = z.object({
  packingList: z.string().describe('A detailed, categorized packing list in Markdown format.'),
});
export type GeneratePackingListOutput = z.infer<typeof GeneratePackingListOutputSchema>;

export async function generatePackingList(input: GeneratePackingListInput): Promise<GeneratePackingListOutput> {
  return generatePackingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePackingListPrompt',
  input: { schema: GeneratePackingListInputSchema },
  output: { schema: GeneratePackingListOutputSchema },
  prompt: `You are an expert travel planner and packing assistant for trips within Indonesia.
Your task is to create a comprehensive and practical packing list for a user.

Here are the trip details:
- Trip Idea: "{{suggestion}}"
- Duration: {{duration}} days
- Theme: {{theme}}
- Itinerary:
{{itinerary}}

Based on all this information, generate a personalized packing list.

Follow these rules:
- Structure the output in simple Markdown.
- Organize items into logical categories (e.g., "Pakaian", "Dokumen & Keuangan", "Elektronik", "Obat-obatan & P3K", "Lain-lain"). Use headings for each category.
- Under each category, use bullet points for the items.
- Tailor the list specifically to the activities in the itinerary, the location implied in the suggestion, the trip duration, and the theme. For example, if the theme is "Petualangan" and the itinerary mentions hiking, you must include hiking shoes. If it mentions a beach, include swimwear.
- Keep the language in Bahasa Indonesia.
- Make the list helpful and thorough.
`,
});

const generatePackingListFlow = ai.defineFlow(
  {
    name: 'generatePackingListFlow',
    inputSchema: GeneratePackingListInputSchema,
    outputSchema: GeneratePackingListOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
