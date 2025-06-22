'use server';
/**
 * @fileOverview Flow untuk memberikan penjelasan tentang hari libur di Indonesia.
 *
 * - explainHoliday - Fungsi yang menghasilkan penjelasan untuk hari libur tertentu.
 * - ExplainHolidayInput - Tipe input untuk fungsi explainHoliday.
 * - ExplainHolidayOutput - Tipe output untuk fungsi explainHoliday.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainHolidayInputSchema = z.object({
  holidayName: z.string().describe('Nama hari libur yang akan dijelaskan.'),
});
export type ExplainHolidayInput = z.infer<typeof ExplainHolidayInputSchema>;

const ExplainHolidayOutputSchema = z.object({
  explanation: z.string().describe('Penjelasan singkat tentang hari libur.'),
});
export type ExplainHolidayOutput = z.infer<typeof ExplainHolidayOutputSchema>;


export async function explainHoliday(input: ExplainHolidayInput): Promise<ExplainHolidayOutput> {
  return explainHolidayFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainHolidayPrompt',
  input: {schema: ExplainHolidayInputSchema},
  output: {schema: ExplainHolidayOutputSchema},
  prompt: `Anda adalah seorang ahli budaya dan sejarah Indonesia.
Tugas Anda adalah memberikan penjelasan yang jelas dan informatif mengenai hari libur di Indonesia.

Jelaskan secara singkat dan menarik tentang hari libur "{{holidayName}}".
Gunakan Bahasa Indonesia yang baik, benar, dan formal. Hindari penggunaan singkatan, bahasa gaul, atau kalimat yang terlalu santai.
Penjelasan harus terdiri dari 2-3 kalimat yang padat informasi dan mudah dimengerti oleh masyarakat umum.`,
});


const explainHolidayFlow = ai.defineFlow(
  {
    name: 'explainHolidayFlow',
    inputSchema: ExplainHolidayInputSchema,
    outputSchema: ExplainHolidayOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { explanation: 'Maaf, saya tidak dapat memberikan penjelasan saat ini.' };
  }
);
