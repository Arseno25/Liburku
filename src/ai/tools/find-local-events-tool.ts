'use server';
/**
 * @fileOverview An AI tool to find local events for a travel itinerary.
 *
 * - findLocalEvents - A Genkit tool that finds events based on location, date, and holiday.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This is a "tool" that the itinerary-generating AI can choose to use.
// It helps make the itinerary more specific and authentic.
export const findLocalEvents = ai.defineTool(
  {
    name: 'findLocalEvents',
    description: 'Finds local events, festivals, or special attractions for a given location and date range, especially those related to a specific holiday. Use this to make travel itineraries more specific and authentic.',
    inputSchema: z.object({
      location: z.string().describe('The city or region to search for events in. Example: "Bali" or "Yogyakarta".'),
      dateRange: z.string().describe('The date range of the trip. Example: "Jumat, 29 Maret - Minggu, 31 Maret 2024".'),
      holidayName: z.string().describe('The name of the holiday occurring during the trip, which might influence local events. Example: "Wafat Isa Al Masih".'),
    }),
    outputSchema: z.object({
      events: z.array(z.object({
        eventName: z.string().describe("The name of the event or festival."),
        description: z.string().describe("A brief, one-sentence description of the event."),
      })).describe("A list of 2-3 relevant local events. If no specific events are known, return an empty array."),
    }),
  },
  async (input) => {
    // In a real-world app, this could call a database or a dedicated Events API.
    // For this demo, we'll use an LLM's world knowledge to find plausible events.
    // This is like a specialized AI agent helping the main AI agent.
    const { output } = await ai.generate({
      prompt: `You are a local event expert for Indonesia. Based on your knowledge, list 2-3 real or highly plausible local events, festivals, or special attractions happening in ${input.location} during ${input.dateRange}, considering it is the ${input.holidayName} holiday. Provide a name and a brief description for each. Be concise. If you don't know of any specific events, return an empty list.`,
      output: {
        schema: z.object({
            events: z.array(z.object({
                eventName: z.string(),
                description: z.string(),
            }))
        })
      },
      model: 'googleai/gemini-2.0-flash', // Use the app's default fact-based model
    });

    return output || { events: [] };
  }
);
