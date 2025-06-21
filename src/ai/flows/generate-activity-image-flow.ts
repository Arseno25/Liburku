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
  imagePrompt: z.string().describe('A concise English prompt to generate an image from.'),
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
  async ({ imagePrompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `${imagePrompt}. The final image should be a beautiful, vibrant, photorealistic travel photo. Do not include any text, words, or logos in the image.`,
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
