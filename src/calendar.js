import { google } from 'googleapis';
import fs from 'fs';

const CREDENTIALS_PATH = './credentials.json';
const TOKEN_PATH = './token.json';

// This function sets up and returns an authenticated Google Calendar client
function getCalendarClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);

  return google.calendar({ version: 'v3', auth: oAuth2Client });
}

// Fetch the next N events from your primary calendar
export async function getUpcomingEvents(maxResults = 10) {
  const calendar = getCalendarClient();
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),  // only events from now onwards
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

// Create a new event
export async function createEvent({ summary, description, startDateTime, endDateTime }) {
  const calendar = getCalendarClient();
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,        // the title of the event
      description,    // optional notes
      start: { dateTime: startDateTime, timeZone: 'Asia/Kuala_Lumpur' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Kuala_Lumpur' },
    },
  });
  return response.data;
}

// Delete an event by its ID
export async function deleteEvent(eventId) {
  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
  return { success: true, eventId };
}

// Search for events containing a keyword
export async function searchEvents(query, maxResults = 10) {
  const calendar = getCalendarClient();
  const response = await calendar.events.list({
    calendarId: 'primary',
    q: query,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}
