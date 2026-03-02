# Omiyages Chrome Role Importer

This extension extracts job data from Jobmiru role pages and sends it to your Google Sheet via Apps Script Web App.

## 1) Files

- `manifest.json` - Chrome extension config
- `popup.html` / `popup.css` / `popup.js` - extension UI and sending logic
- `content.js` - page scraper logic

## 2) Load Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `chrome-role-importer`

## 3) First-time setup in popup

1. Open any Jobmiru role page (for example the shared link you provided).
2. Click the extension icon.
3. Paste:
   - **Apps Script Web App URL**
   - **API key** (must match `API_KEY` in your Apps Script code)
4. Click **Extract**
5. Review payload in preview
6. Click **Send to Sheet**

## 4) Expected Google Sheet columns

The Apps Script should accept and append these fields:

- `job_title`
- `company`
- `location`
- `working_style`
- `division`
- `job_description`
- `requirements`
- `nice_to_haves`
- `benefits`
- `source_url`
- `scraped_at` (usually appended by Apps Script)

## 5) Notes

- If extraction misses fields, inspect the target page HTML and adjust selectors in `content.js`.
- `working_style` is normalized to one of:
  - `Hybrid`
  - `Remote`
  - `Onsite`
