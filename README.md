# Google Calendar MCP Server

A **Model Context Protocol (MCP)** server that connects AI assistants (like Claude) directly to your Google Calendar. It exposes calendar operations as callable tools over standard I/O, enabling an AI to read, create, delete, and search events on your behalf.

This project uses the [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) to implement a stdio-based MCP server and the [Google Calendar API v3](https://developers.google.com/calendar/api/v3/reference) for all calendar operations.

---

## Features

| Tool                 | Description                                                |
|----------------------|------------------------------------------------------------|
| `get_upcoming_events` | Fetch the next N upcoming events from your primary calendar. Defaults to 10. |
| `create_event`        | Create a new event with a title, start/end times (ISO 8601), and optional description. |
| `delete_event`        | Delete an event from your calendar by its event ID.        |
| `search_events`       | Search for events by keyword (e.g. "meeting", "birthday"). |

All operations use the **primary** calendar associated with the authenticated Google account.

---

## Requirements

- **Node.js** 18+ (ESM modules)
- A **Google Cloud project** with the **Google Calendar API** enabled
- **OAuth 2.0 credentials** downloaded from the Google Cloud Console
- A Google account with a calendar

---

## Setup / Installation

### 1. Clone and install

```bash
git clone <repo-url>
cd GoogleCalendarMCP
npm install
```

### 2. Enable the Google Calendar API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > Library** and enable the **Google Calendar API**.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > OAuth 2.0 Client ID** (application type: **Desktop app**).
6. Download the JSON file and save it as **`credentials.json`** in the project root.

> **⚠️ Security note:** `credentials.json` and `token.json` are listed in `.gitignore` so they are never committed. Do not share them.

### 3. Authenticate with Google

Run the one-time authentication script:

```bash
node src/auth.js
```

This will:
- Print a URL to the console.
- Open it in your browser, sign in with your Google account, and grant calendar access.
- You'll receive a code — paste it back into the terminal.
- A `token.json` file is generated containing your OAuth tokens (including a refresh token for long-lived access).

---

## Usage

The server communicates over **stdio** — it is designed to be launched by an MCP host (e.g. Claude Desktop, a custom MCP client, or any software that supports the Model Context Protocol).

### Starting the server directly

```bash
node src/server.js
```

The server will listen for MCP JSON-RPC messages on stdin and respond on stdout. No output means it's waiting for a client to connect.

### Example MCP client configuration (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["/absolute/path/to/GoogleCalendarMCP/src/server.js"]
    }
  }
}
```

Once connected, the AI assistant can call any of the four registered tools.

### Example tool invocations

**Get upcoming events:**
```
get_upcoming_events(maxResults: 5)
```

**Create an event:**
```
create_event(
  summary: "Team standup",
  startDateTime: "2026-06-01T10:00:00",
  endDateTime: "2026-06-01T10:30:00",
  description: "Daily sync"
)
```

**Delete an event:**
```
delete_event(eventId: "abc123xyz")
```

**Search events:**
```
search_events(query: "meeting", maxResults: 5)
```

---

## Project Structure

```
GoogleCalendarMCP/
├── src/
│   ├── server.js       # MCP server entrypoint — registers tools and connects via stdio
│   ├── calendar.js     # Google Calendar API wrapper (list, create, delete, search)
│   └── auth.js         # One-time OAuth 2.0 authentication flow
├── credentials.json    # [Ignored by git] Your Google API OAuth client secrets
├── token.json          # [Ignored by git] Generated OAuth tokens after authentication
├── package.json
├── package-lock.json
└── .gitignore
```

### Key files explained

| File | Purpose |
|------|---------|
| `src/server.js` | Defines the MCP server and registers four tools (`get_upcoming_events`, `create_event`, `delete_event`, `search_events`). Communicates over stdio using `StdioServerTransport`. |
| `src/calendar.js` | Contains the business logic: `getUpcomingEvents()`, `createEvent()`, `deleteEvent()`, `searchEvents()`. Each function creates an authenticated Google Calendar client and calls the relevant API endpoint. |
| `src/auth.js` | A one-shot script that walks you through the OAuth 2.0 consent flow and saves `token.json`. Uses the `calendar` scope (full read/write access). |

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.29.0 | MCP server framework — provides `McpServer`, `StdioServerTransport`, and Zod-based input schemas |
| `googleapis` | ^173.0.0 | Google API client library — wraps the Calendar v3 REST API |
| `dotenv` | ^17.4.2 | Environment variable loader (for future use) |

### Dev

None are currently configured.

---

## How Authentication Works

1. **`src/auth.js`** requests an OAuth 2.0 token with the `https://www.googleapis.com/auth/calendar` scope (full read/write).
2. The user logs in via the generated URL and pastes the authorization code back into the terminal.
3. Tokens (access + refresh) are saved to `token.json`.
4. At runtime, **`src/calendar.js`** reads `credentials.json` and `token.json`, creates an `OAuth2` client, and sets the saved credentials.
5. The refresh token allows the server to obtain new access tokens automatically when they expire.

---

## Contributing

Contributions are welcome! If you have ideas for additional tools (e.g. update events, list calendars, manage reminders), feel free to open an issue or submit a pull request.

---

## License

ISC
