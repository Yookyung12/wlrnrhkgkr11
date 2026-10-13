// Paste deployed Apps Script web app URL to enable submissions.
export const GAS_WEB_APP_URL = '';
// Keep this sheet private to staff; public student pages cannot read it.
export const ADMIN_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1dikbIHwZji7mJF-UEMaEJQlZ0LPG2beF7zSLgii4JAQ/edit';
export const IS_CONFIGURED = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(GAS_WEB_APP_URL.trim());
