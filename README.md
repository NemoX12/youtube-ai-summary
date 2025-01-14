# YouTube AI Summary

YouTube AI Summary is a Chrome extension that provides AI-generated summaries for YouTube videos using the Gemini API.

![demo](./assets/readme/demo.gif)

## Features

- Summarizes YouTube videos using AI
- Displays the summary directly on the YouTube page
- Easy to use with a simple button click

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/NemoX12/ai-video-summary.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd youtube-ai-summary
    ```

3.  API Key

    1. Get your [API Key](https://ai.google.dev/gemini-api/docs) from Gemini docs
    2. Create a file named `key.json`
    3. The file should have the following structure
       ```json
       {
         "AI_API_KEY": "YOUR_API_KEY_HERE"
       }
       ```

4.  Load the extension in Chrome:

    1. Open Chrome and go to chrome://extensions/.
    2. Enable "Developer mode" by toggling the switch in the top right corner.
    3. Click on "Load unpacked" and select the project directory.

## Usage

1. Open a YouTube video.
2. Click on the AI icon button added by the extension.
3. Wait for the AI to generate the summary.
4. The summary will be displayed below the video.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Links

[GitHub](https://github.com/NemoX12/youtube-ai-summary)

[Gemini API Docs](https://ai.google.dev/gemini-api/docs?_gl=1*8e3mwk*_up*MQ..&gclid=Cj0KCQiAs5i8BhDmARIsAGE4xHwi0zCSwP6uBlJAXpoLSWEwMAPECPg9qfghU-Icby6-CX1DU-Id7ZMaAnaZEALw_wcB)
