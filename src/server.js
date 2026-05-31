import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getUpcomingEvents, createEvent, deleteEvent, searchEvents } from './calendar.js';

const server = new McpServer({
  name: 'google-calendar',
  version: '1.0.0',
})

// setup tool 1: getting upcoming events
// params: name, {description, inputSchema}, function handler
server.registerTool(
  'get_upcoming_events',
  {
    description: "Fetch upcoming events from Google Calendar",
    inputSchema: { maxResults: z.number().optional().describe('How many events to fetch, defaults to 10') }
  },
  // defines what the tool will do, in this case take a maxResults param, and after that, 
  // run the actual logic for the tool
  async ({ maxResults }) => {
    const events = await getUpcomingEvents(maxResults ?? 10);  // call the getUpcomingEvents function, and default to 10 if no maxResults provided
    if (events.length == 0) return { content: [{ type: 'text', text: 'No upcoming events found.' }] };   // return no upcoming events found if no events found
    // for each event that we found, turn them into a string that explains each event, and join them into alist
    const text = events.map(e =>
      `- ${e.summary} | ${e.start.dateTime || e.start.date}${e.description ? ' | ' + e.description : ''}`
    ).join('\n');
    // finally, return our events
    return { content: [{ type: 'text', text }] }
  }
)

// tool 2: create an event
server.registerTool(
  'create_event',
  {
    description: "Create a new event on Google Calendar",
    inputSchema: {
      summary: z.string().describe("Title of the event"),
      startDateTime: z.string().describe("Start time in ISO 8601 format, e.g. 2025-06-01T10:00:00"),
      endDateTime: z.string().describe("End time in ISO 8601 format, e.g. 2025-06-01T10:00:00"),
      description: z.string().optional().describe("Optional noted or description of the event.")
    }
  },
  async ({ summary, startDateTime, endDateTime, description }) => {
    const event = await createEvent({ summary, startDateTime, endDateTime, description });
    return { content: [{ type: 'text', text: `Event created: "${event.summary}" (ID: ${event.id})` }] }
  }
)

// tool 3: Delete an event
server.registerTool(
  'delete_event',
  {
    description: "Deletes an event from Google Calendar by its ID",
    inputSchema: {
      eventId: z.string().describe("The ID of the event to delete")
    }
  },
  async ({ eventId }) => {
    await deleteEvent(eventId);
    return { content: [{ type: 'text', text: `Event ${eventId} deleted successfully.` }] };
  }
)

// tool 4: search for events
server.registerTool(
  "search_events",
  {
    description: "Search for events on Google Calendar by keyword",
    inputSchema: {
      query: z.string().describe('Keyword to search for'),
      maxResults: z.number().optional().describe('How many results to return, defaults to 10')
    },
  },
  async ({ query, maxResults }) => {
    const events = await searchEvents(query, maxResults ?? 10);
    if (events.length === 0) return { content: [{ type: 'text', text: `No events found for "${query}".` }] };
    const text = events.map(e =>
      `- ${e.summary} | ${e.start.dateTime || e.start.date} | ID: ${e.id}`
    ).join('\n');
    return { content: [{ type: 'text', text }] };
  }
)


// Start the server — it communicates via stdio (standard input/output)
// Openclaw will launch this process and talk to it through stdin/stdout
const transport = new StdioServerTransport();
await server.connect(transport);
