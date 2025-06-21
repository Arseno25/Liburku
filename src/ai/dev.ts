'use server';
// Flows will be imported for their side effects in this file.
import './flows/explain-holiday-flow';
import './flows/suggest-long-weekend-activity-flow';
import './flows/generate-activity-image-flow';
import './flows/text-to-speech-flow';
import './flows/generate-itinerary-flow';
import './flows/generate-packing-list-flow';
import './flows/chat-flow';
import './flows/estimate-trip-budget-flow';

// Tools must also be imported.
import './tools/find-local-events-tool';
