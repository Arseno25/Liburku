'use server';
/**
 * @fileOverview A flow to generate an image based on a long weekend activity suggestion.
 *
 * - generateActivityImage - A function that creates an image for a given activity description.
 * - GenerateActivityImageInput - The input type for the generateActivityImage function.
 * - GenerateActivityImageOutput - The return type for the generateActivityImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateActivityImageInputSchema = z.object({
  activitySuggestion: z.string().describe('The text description of the suggested activity.'),
});
export type GenerateActivityImageInput = z.infer<typeof GenerateActivityImageInputSchema>;

const GenerateActivityImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateActivityImageOutput = z.infer<typeof GenerateActivityImageOutputSchema>;

export async function generateActivityImage(input: GenerateActivityImageInput): Promise<GenerateActivityImageOutput> {
  return generateActivityImageFlow(input);
}

const generateActivityImageFlow = ai.defineFlow(
  {
    name: 'generateActivityImageFlow',
    inputSchema: GenerateActivityImageInputSchema,
    outputSchema: GenerateActivityImageOutputSchema,
  },
  async ({ activitySuggestion }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a beautiful, vibrant, and inspiring travel photo that illustrates this activity suggestion for a long weekend in Indonesia. The style should be like a professional travel photograph. Do not include any text or logos in the image. Suggestion: "${activitySuggestion}"`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
