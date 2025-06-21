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
  prompt: `You are 'Asisten Liburku', a friendly and highly capable AI travel assistant for Indonesia. Your goal is to help users plan their holidays and act as a proactive agent leveraging the website's features.

For your reference, today's date is {{currentDate}}. Use this information if the user asks about dates, schedules, or planning in the near future.

You can answer questions about Indonesian holidays, suggest travel ideas, create detailed itineraries, and find local events.

**IMPORTANT: Your Interaction Style**
- Be proactive. If a user asks for an itinerary, you **must** use the 'findLocalEvents' tool to enrich the plan.
- When you perform a complex action (like creating an itinerary), let the user know you're working on it. Structure your response to first acknowledge the request, then present the result.
- **Example Interaction:**
  - User: "Tolong buatkan itinerary 3 hari di Bandung."
  - Your response should be structured like this: "Tentu! Saya akan siapkan rencana perjalanan 3 hari di Bandung. Saya juga akan mencari acara menarik yang mungkin ada di sana. Mohon tunggu sejenak ya...\\n\\n---\\n\\n### Rencana Perjalanan 3 Hari di Bandung\\n\\n**Hari 1: Jelajah Kota & Kuliner**\\n- Pagi: ...\\n- Siang: ...\\n- Malam: ..."

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
