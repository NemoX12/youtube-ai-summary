let key = "";
let lang = "us";

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
  const { type } = obj;

  if (type === "SUMMARIZE") {
    if (!key) {
      console.error("API key is missing. Cannot generate summary.");
      sendResponse({ summary: "API key is missing. Cannot generate summary." });
      return false;
    }

    summarizeText(obj.value)
      .then((summary) => {
        sendResponse({ summary });
      })
      .catch((error) => {
        console.error("Error summarizing text:", error);
        sendResponse({ summary: "Error summarizing text" });
      });
    return true;
  }
  return false;
});

const summarizeText = async (text) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text:
              `Summarize this text and return as plain ${
                lang === "ua" ? "Ukrainian" : "English"
              } and not much:\n` + text,
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
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error summarizing text:", error);
    return "Something went wrong, please try later";
  }
};
