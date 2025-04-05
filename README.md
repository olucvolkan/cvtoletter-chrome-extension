# CvToLetter Chrome Extension

A Chrome extension that integrates with the CvToLetter web application to generate personalized cover letters from job descriptions with a single click.

## Features

- Automatically detects job descriptions on popular job sites (LinkedIn, Indeed, Glassdoor, etc.)
- Generate personalized cover letters using your CVs stored on CvToLetter
- Seamless integration with your CvToLetter account and credits
- Copy generated cover letters to clipboard with one click

## Installation

### Development Mode

1. Clone this repository:
   ```
   git clone https://github.com/olucvolkan/cvtoletter-chrome-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner

4. Click "Load unpacked" and select the folder containing this extension

5. The extension should now appear in your Chrome toolbar

## Usage

1. Navigate to a job posting on a supported job site (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter)

2. Click on the CvToLetter extension icon in your Chrome toolbar

3. The extension will automatically detect and display the job description

4. Click "Generate Cover Letter" to use your CvToLetter account to create a personalized cover letter

5. Use the "Copy to Clipboard" button to copy the generated cover letter

## Integration with CvToLetter

This extension requires a CvToLetter account and credits to generate cover letters. You can:

- Log in with your Google account (same as CvToLetter web app)
- View your available credits
- Purchase additional credits directly from the extension

## Development

### Project Structure

```
cvtoletter-extension/
├── manifest.json              # Extension configuration
├── background.js              # Background script for authentication
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Styles for the popup
│   └── popup.js              # Popup functionality
├── content/
│   ├── content-script.js     # Script to run on websites
│   └── jobDescriptionParser.js  # Job description extraction logic
├── assets/
│   ├── icon-16.png           # Extension icons
│   ├── icon-48.png
│   ├── icon-128.png
│   └── logo.svg
└── utils/
    ├── auth.js               # Authentication handling
    └── api.js                # API calls to the backend
```

## Privacy

This extension only accesses job descriptions on the pages you visit. It does not track your browsing history or collect any personal data outside of what's needed to authenticate with CvToLetter.

## License

MIT License
