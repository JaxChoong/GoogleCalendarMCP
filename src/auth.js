import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';

// these are the permissions we're asking Google for.
// 'calendar' = full read/write access to my calendar.

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const CREDENTIALS_PATH = './credentials.json';
const TOKEN_PATH = './token.json';
