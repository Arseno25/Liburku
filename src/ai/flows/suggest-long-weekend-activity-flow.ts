'use server';
/**
 * @fileOverview Flow to generate activity suggestions for a long weekend.
 *
 * - suggestActivity - A function that generates activity ideas for a given long weekend.
 * - SuggestActivityInput - The input type for the suggestActivity function.
 * - SuggestActivityOutput - The return type for the suggestActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestActivityInputSchema = z.object({
  holidayName: z.string().describe('The name of the holiday during the long weekend.'),
  duration: z.number().describe('The total duration of the long weekend in days.'),
  dateRange: z.string().describe('The date range of the long weekend.'),
  theme: z.string().optional().describe('Tema yang dipilih pengguna untuk saran aktivitas.'),
});
export type SuggestActivityInput = z.infer<typeof SuggestActivityInputSchema>;

const SuggestActivityOutputSchema = z.object({
  suggestion: z.string().describe('A creative and helpful suggestion for activities or a short trip during the long weekend in Bahasa Indonesia.'),
  imagePrompt: z.string().describe('A concise English prompt for an image generation model, based on the suggestion.'),
});
export type SuggestActivityOutput = z.infer<typeof SuggestActivityOutputSchema>;


export async function suggestActivity(input: SuggestActivityInput): Promise<SuggestActivityOutput> {
  return suggestActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivityPrompt',
  input: {schema: SuggestActivityInputSchema},
  output: {schema: SuggestActivityOutputSchema},
  prompt: `You are a friendly and creative travel expert for Indonesia.
A user is looking for ideas for a long weekend.

Details of the long weekend:
- Holiday: "{{holidayName}}"
- Duration: {{duration}} days
- Dates: {{dateRange}}
{{#if theme}}- Desired Theme: "{{theme}}"{{/if}}

Based on this, provide two things:
1.  'suggestion': One exciting and practical travel or activity suggestion in Bahasa Indonesia. Make the suggestion sound inspiring and helpful, around 3-4 sentences. Consider the theme of the holiday if it's relevant (e.g., religious, national). Start with a creative title like "Petualangan Seru di [Lokasi]" or "Relaksasi Maksimal di [Lokasi]". {{#if theme}}The suggestion MUST strongly align with the user's chosen theme: "{{theme}}".{{/if}}
2.  'imagePrompt': A concise, descriptive prompt in English for an image generation AI. This prompt should vividly capture the essence of the activity suggestion. For example: "A stunning, professional travel photograph of a pristine white sand beach in Belitung, with giant granite boulders and crystal clear turquoise water under a bright blue sky."`,
});


const suggestActivityFlow = ai.defineFlow(
  {
    name: 'suggestActivityFlow',
    inputSchema: SuggestActivityInputSchema,
    outputSchema: SuggestActivityOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
