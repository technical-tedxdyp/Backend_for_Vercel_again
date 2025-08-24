// File: functions/utils/googleSheetsService.js

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load Google Sheets credentials
let credentials;

if (process.env.TEDX_GOOGLE_APPLICATION_CREDENTIALS) {
  const credentialsPath = path.resolve(process.env.TEDX_GOOGLE_APPLICATION_CREDENTIALS);
  credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
} else if (process.env.TEDX_GOOGLE_CREDENTIALS) {
  credentials = JSON.parse(process.env.TEDX_GOOGLE_CREDENTIALS);
} else {
  throw new Error('❌ Google Sheets credentials are not set.');
}

// Spreadsheet ID from env
const SHEET_ID = process.env.TEDX_SHEET_ID;
if (!SHEET_ID) {
  throw new Error('❌ Google Sheet ID is not set in environment variables.');
}

// Create Google Auth client using the JSON object
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Column headers for Google Sheet (add department, branch)
const headers = [
  'Name', 'Email', 'Phone', 'Department', 'Branch', 'Session', 'Amount',
  'Razorpay Order ID', 'Payment ID', 'Ticket ID', 'Created At'
];

// Function to append a row to Google Sheet
async function appendRowToSheet(rowData) {
  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Check if the sheet is empty
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:A1',
    });

    const sheetIsEmpty = !readResponse.data.values;

    // If empty, add header row
    if (sheetIsEmpty) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });
      console.log('✅ Header row added to Google Sheet');
    }

    // Append new data row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    });
    console.log('✅ New row appended to Google Sheet');
  } catch (err) {
    console.error('Error appending row to Google Sheet:', err);
    throw new Error('Failed to update Google Sheet.');
  }
}

module.exports = appendRowToSheet;
