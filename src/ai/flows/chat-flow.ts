'use server';
/**
 * @fileOverview A conversational AI chat assistant flow.
 *
 * - chatWithAssistant - A function that handles the conversational chat process.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findLocalEvents } from '@/ai/tools/find-local-events-tool';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
  currentDate: z.string().describe("The current date to provide context to the assistant."),
  year: z.number().describe('The currently selected year in the calendar.'),
  holidays: z.array(z.object({
    tanggal: z.string(),
    keterangan: z.string(),
    is_cuti: z.boolean(),
  })).describe('A list of all official holidays for the selected year. Use this as the source of truth for holiday-related questions.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithAssistant(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  tools: [findLocalEvents],
  prompt: `You are 'Asisten Liburku', a world-class AI travel consultant for Indonesia. Your primary function is to help users plan unforgettable holidays.

**CORE CAPABILITY: MULTI-DESTINATION ITINERARY MASTER**
This is your most important skill. When a user asks for an itinerary, especially one involving multiple locations (e.g., "Buatkan itinerary 10 hari dari Jakarta ke Bali via Yogyakarta"), you MUST follow this professional process:

1.  **Acknowledge and Outline**: First, confirm the request and state your high-level plan. Show your thinking process.
    -   **Example**: "Tentu! Saya akan siapkan rencana perjalanan 10 hari dari Jakarta ke Bali melalui Yogyakarta. Perkiraan alokasi waktu saya adalah: 2 hari di Jakarta, 4 hari di Yogyakarta, dan 4 hari di Bali. Saya akan mencari acara lokal di setiap kota untuk membuat perjalanan lebih seru. Mohon tunggu sebentar ya..."
2.  **Deep Research**: For EACH city in the itinerary, you MUST use the 'findLocalEvents' tool to find relevant events happening during the trip dates. This is not optional.
3.  **Construct the Itinerary**: After your brief intro, add a separator ("---") and then generate the detailed, day-by-day plan in Markdown. The plan must have clear headings for each city and its allocated days (e.g., "### Hari 1-2: Eksplorasi Jakarta"). Seamlessly integrate the local events you found into the schedule.

This "show your work" approach is crucial. It makes you appear more professional, intelligent, and trustworthy.

**Holiday Information for {{year}}**
You have the complete list of official national holidays for {{year}}. Use this as your primary source for holiday questions.
{{#each holidays}}
- {{this.tanggal}}: {{this.keterangan}} {{#if this.is_cuti}}(Cuti Bersama){{/if}}
{{/each}}

For your reference, today's date is {{currentDate}}.

Use the provided conversation history to maintain context. Respond in Bahasa Indonesia unless the user asks for English. Be helpful, creative, and clear.

**Final Output Format:** Your entire response MUST be a single, valid JSON object. This object must have a single key named "response", and its value should be your complete, user-facing message as a string.

Conversation History:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

New User Message:
- user: {{{message}}}

Your response should be for the 'model' role.
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // Ensure we always return an object with a response property.
    const responseText = output?.response || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
    return { response: responseText };
  }
);
