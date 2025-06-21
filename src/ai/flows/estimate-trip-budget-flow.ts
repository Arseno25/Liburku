'use server';
/**
 * @fileOverview A flow to generate a trip budget estimate.
 *
 * - estimateTripBudget - A function that creates a budget based on trip details.
 * - EstimateTripBudgetInput - The input type for the estimateTripBudget function.
 * - EstimateTripBudgetOutput - The return type for the estimateTripBudget function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EstimateTripBudgetInputSchema = z.object({
  itinerary: z.string().describe('The detailed travel itinerary in Markdown format.'),
  suggestion: z.string().describe('The original travel suggestion text, containing the location.'),
  duration: z.number().describe('The total duration of the trip in days.'),
  theme: z.string().describe('The theme of the trip (e.g., Adventure, Relaxation).'),
});
export type EstimateTripBudgetInput = z.infer<typeof EstimateTripBudgetInputSchema>;

const EstimateTripBudgetOutputSchema = z.object({
  markdownBudget: z.string().describe('Estimasi anggaran yang terperinci dan dikategorikan dalam format Markdown.'),
});
export type EstimateTripBudgetOutput = z.infer<typeof EstimateTripBudgetOutputSchema>;

export async function estimateTripBudget(input: EstimateTripBudgetInput): Promise<EstimateTripBudgetOutput> {
  return estimateTripBudgetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateTripBudgetPrompt',
  input: { schema: EstimateTripBudgetInputSchema },
  output: { schema: EstimateTripBudgetOutputSchema },
  prompt: `You are an expert travel budget planner for Indonesia. Your task is to create a realistic budget estimate for a trip.

Here are the trip details:
- Trip Idea: "{{suggestion}}"
- Duration: {{duration}} days
- Theme: {{theme}}
- Itinerary:
{{itinerary}}

Based on all this information, generate 'markdownBudget': a detailed budget estimate in simple Markdown.
-   All currency must be in Indonesian Rupiah (Rp).
-   Organize into "Akomodasi", "Transportasi Lokal", "Makan & Minum", "Aktivitas & Tiket Masuk", and "Lain-lain (Oleh-oleh, dll.)". Use headings for each category.
-   Provide a realistic price range per day or per trip (e.g., "Akomodasi: Rp 300.000 - Rp 800.000 / malam").
-   Infer the location from the "Trip Idea".
-   Base your estimates on the activities mentioned in the itinerary and the overall theme.
-   Provide a "Total Estimasi Per Orang" (Estimated Total Per Person) at the end, summarizing the total cost range for the entire trip, excluding flights to the location.
-   Add a disclaimer that these are estimates and prices can vary.
-   Keep the language in Bahasa Indonesia.
`,
});

const estimateTripBudgetFlow = ai.defineFlow(
  {
    name: 'estimateTripBudgetFlow',
    inputSchema: EstimateTripBudgetInputSchema,
    outputSchema: EstimateTripBudgetOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
