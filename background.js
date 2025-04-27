let key = "";
let lang = ""

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch")
  ) {
    chrome.storage.local.get(["AI_API_KEY", "LANG"], (result) => {
      if (result.AI_API_KEY) {
        key = result.AI_API_KEY;
      } else {
        key = "";
        console.error("API key not found in storage");
      }
      if (result.LANG) {
        lang = result.LANG;
      }
    });

    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});

chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
  const { type, value, videoTitle } = obj;

  if (type === "SUMMARIZE") {
    if (!key) {
      sendResponse({
        error: true,
      });
      return false;
    }

    summarizeText(value, videoTitle)
      .then((summary) => {
        sendResponse({ summary, error: false });
      })
      .catch((error) => {
        console.error(error);
        sendResponse({ summary: "Error summarizing text", error: true });
      });
    return true;
  }
  return false;
});

const summarizeText = async (text, videoTitle) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `
              Summarize the following subtitles from the video titled "${videoTitle}". 
              The summary should be not too long, concise, in ${lang} language and easy to read:\n\n${text}. 
              Return as a plain text without any additional formatting. 
              Do not include any code blocks or markdown formatting. 
              Just provide the summary in plain text.
            `,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 200,
      topP: 0.95,
      maxOutputTokens: 300,
      responseMimeType: "text/plain",
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (
      data.candidates &&
      data.candidates[0].content.parts
    ) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected API response structure:", data);
    }
  } catch (error) {
    console.error("Error fetching summary:", error);
  }
};
