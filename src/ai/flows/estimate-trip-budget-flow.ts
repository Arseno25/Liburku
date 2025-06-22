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
  userLocation: z.string().optional().describe("The user's current city to help determine if accommodation costs are necessary."),
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
  prompt: `You are an expert travel budget planner for Indonesia. Your task is to create a realistic budget estimate for a trip based on a provided itinerary.

Here are the trip details:
- Trip Idea: "{{suggestion}}"
- Duration: {{duration}} days
- Theme: {{theme}}
- Itinerary:
{{{itinerary}}}

Based on all this information, generate a detailed budget estimate in simple Markdown called 'markdownBudget'.

**IMPORTANT: Accommodation Logic**
-   Analyze the itinerary. If it describes a local trip or "staycation" where the user returns home each day (i.e., there is no mention of hotels or overnight stays), **you MUST OMIT the "Akomodasi" category from your budget.**
-   For trips that clearly involve travel to another city, you MUST include the "Akomodasi" category.

**Budget Rules:**
-   All currency must be in Indonesian Rupiah (Rp).
-   Organize into categories like "Transportasi Lokal", "Makan & Minum", "Aktivitas & Tiket Masuk", and "Lain-lain (Oleh-oleh, dll.)". Use headings for each.
-   Provide a realistic price range per day or per trip (e.g., "Akomodasi: Rp 300.000 - Rp 800.000 / malam").
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
    try {
      const { output } = await prompt(input);
      return output || { markdownBudget: 'Maaf, saya tidak dapat membuat estimasi anggaran saat ini. Silakan coba lagi.' };
    } catch (e) {
      console.error("Error in estimateTripBudgetFlow:", e);
      return { markdownBudget: 'Maaf, terjadi kesalahan saat membuat estimasi anggaran. Silakan coba lagi.' };
    }
  }
);
