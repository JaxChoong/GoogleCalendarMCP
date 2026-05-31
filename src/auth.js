import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';

// --------------------------------
// THIS FILE IS ONLY RUN ONCE TO AUTHENTICATE WITH GOOGLE
// --------------------------------
//
// these are the permissions we're asking Google for.
// 'calendar' = full read/write access to my calendar.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const CREDENTIALS_PATH = './credentials.json';
const TOKEN_PATH = './token.json';

// read the credentials from googleapi
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Generate the URL where you'll log in
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',  // 'offline' means we get a refresh token so we don't need to log in again
  scope: SCOPES,
});

console.log('Open this URL in your browser:\n\n', authUrl, '\n');

// After logging in, Google gives you a code. Paste it here.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the code from the page here: ', async (code) => {
  rl.close();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token saved to', TOKEN_PATH, '— you\'re authenticated!');
});
