(() => {
  const style = document.createElement("style");

  const root = document.documentElement;
  const theme = root.hasAttribute("dark") ? "dark" : "light";

  style.textContent = `
      #ai-button {
        filter: invert(100%);
        width: 20px;
        height: 20px;
        margin: auto;
        margin-right: 10px;
        cursor: pointer;
        transition: filter 0.3s;
      }
      #ai-button:hover {
        filter: invert(80%);
      }
      .roller {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
      }
      .roller div {
        animation: roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        transform-origin: 40px 40px;
      }
      .roller div:after {
        content: " ";
        display: block;
        position: absolute;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #000;
        margin: -4px 0 0 -4px;
      }
      .roller div:nth-child(1) {
        animation-delay: -0.036s;
      }
      .roller div:nth-child(1):after {
        top: 63px;
        left: 63px;
      }
      .roller div:nth-child(2) {
        animation-delay: -0.072s;
      }
      .roller div:nth-child(2):after {
        top: 68px;
        left: 56px;
      }
      .roller div:nth-child(3) {
        animation-delay: -0.108s;
      }
      .roller div:nth-child(3):after {
        top: 71px;
        left: 48px;
      }
      .roller div:nth-child(4) {
        animation-delay: -0.144s;
      }
      .roller div:nth-child(4):after {
        top: 72px;
        left: 40px;
      }
      .roller div:nth-child(5) {
        animation-delay: -0.18s;
      }
      .roller div:nth-child(5):after {
        top: 71px;
        left: 32px;
      }
      .roller div:nth-child(6) {
        animation-delay: -0.216s;
      }
      .roller div:nth-child(6):after {
        top: 68px;
        left: 24px;
      }
      .roller div:nth-child(7) {
        animation-delay: -0.252s;
      }
      .roller div:nth-child(7):after {
        top: 63px;
        left: 17px;
      }
      .roller div:nth-child(8) {
        animation-delay: -0.288s;
      }
      .roller div:nth-child(8):after {
        top: 56px;
        left: 12px;
      }
      @keyframes roller {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;
  document.head.append(style);

  let youtubeLeftControls;
  let summaryVisible = true;

  const handleClickAiButton = () => {
    displayLoader();
    const videoId = new URLSearchParams(window.location.search).get("v");
  
    chrome.storage.local.get([videoId], (result) => {
      if (result[videoId]) {
        displaySummary(result[videoId]);
        disableAiButton();
      } else {
        const YT_INITIAL_PLAYER_RESPONSE_RE = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
      
        let player = window.ytInitialPlayerResponse;
        if (!player || videoId !== player.videoDetails.videoId) {
          fetch(`https://www.youtube.com/watch?v=${videoId}`)
            .then((response) => response.text())
            .then((body) => {
              const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
              if (!playerResponse) {
                displayError("Unable to parse player response. Please try again.");
                return;
              }
              player = JSON.parse(playerResponse[1]);
              fetchSummary(player, videoId);
            });
        }
      }
    });
  };

  const fetchSummary = (player, videoId) => {
    if (!player.captions || !player.captions.playerCaptionsTracklistRenderer) {
      displayError("No captions available for this video.");
      return;
    }
  
    const tracks = player.captions.playerCaptionsTracklistRenderer.captionTracks;
    tracks.sort(compareTracks);
  
    fetch(`${tracks[0].baseUrl}&fmt=json3`)
      .then((response) => response.json())
      .then((transcript) => {
        const parsedTranscript = transcript.events
          .filter((x) => x.segs)
          .map((x) =>
            x.segs
              .map((y) => y.utf8)
              .join(" ")
          )
          .join(" ")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/\s+/g, " ")

        sendTranscriptForSummary(parsedTranscript, videoId, player.videoDetails.title);
    });
  };
  
  const sendTranscriptForSummary = (parsedTranscript, videoId, videoTitle) => {
    chrome.runtime.sendMessage(
      {
        type: "SUMMARIZE",
        value: parsedTranscript,
        videoTitle: videoTitle,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          displayError("Error sending message. Please try again.");
        } else if (response.error) {
          displayError(response.message || "Missing key or summary");
        } else {
          chrome.storage.local.set({ [videoId]: response.summary });
          displaySummary(response.summary);
          disableAiButton();
        }
      }
    );
  };

  function compareTracks(track1, track2) {
    const langCode1 = track1.languageCode;
    const langCode2 = track2.languageCode;

    if (langCode1 === "en" && langCode2 !== "en") {
      return -1;
    } else if (langCode1 !== "en" && langCode2 === "en") {
      return 1;
    } else if (track1.kind !== "asr" && track2.kind === "asr") {
      return -1;
    } else if (track1.kind === "asr" && track2.kind !== "asr") {
      return 1;
    }

    return 0;
  }

  const displayLoader = () => {
    const middleRow = document.getElementById("middle-row");
    if (!middleRow) {
      return;
    }

    let summaryDiv = document.getElementById("summary-div");
    if (!summaryDiv) {
      summaryDiv = document.createElement("div");
      summaryDiv.id = "summary-div";
      summaryDiv.style.marginTop = "10px";
      summaryDiv.style.padding = "12px";
      summaryDiv.style.borderRadius = "14px";
      summaryDiv.style.backgroundColor = theme === "dark" ? "rgba(39, 39, 39, 0.9)" : "rgba(242, 242, 242, 1)";
      summaryDiv.style.textAlign = "center";
      summaryDiv.style.fontSize = "14px";
      summaryDiv.style.color = theme === "dark" ? "#fff" : "#000000";

      middleRow.parentNode.insertBefore(summaryDiv, middleRow.nextSibling);
    }

    summaryDiv.innerHTML = "";

    const loader = document.createElement("div");
    loader.className = "roller";
    for (let i = 0; i < 8; i++) {
      const div = document.createElement("div");
      loader.appendChild(div);
    }

    summaryDiv.appendChild(loader);
  };

  const displaySummary = (summary) => {
    const summaryDiv = document.getElementById("summary-div");
    if (!summaryDiv) {
      return;
    }

    summaryDiv.innerHTML = "";

    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Hide";
    toggleButton.style.padding = "5px";
    toggleButton.style.border = "none";
    toggleButton.style.borderRadius = "5px";
    toggleButton.style.backgroundColor = theme === "dark" ? "#494949" : "#d9d9d9";
    toggleButton.style.color = theme === "dark" ? "#fff" : "#000000";
    toggleButton.style.cursor = "pointer";

    const summaryContainer = document.createElement("div");
    summaryContainer.setAttribute("id", "summary-container");
    summaryContainer.style.listStyle = "none";

    toggleButton.addEventListener("click", () => {
      if (summaryVisible) {
        summaryContainer.style.display = "none";
        toggleButton.textContent = "Show Summary";
      } else {
        summaryContainer.style.display = "block";
        toggleButton.textContent = "Hide";
      }
      summaryVisible = !summaryVisible;
    });

    summaryDiv.appendChild(toggleButton);
    summaryDiv.appendChild(summaryContainer);

    const summaryTitle = document.createElement("h3");
    summaryTitle.style.textAlign = "left";
    summaryTitle.innerHTML = "AI Summary:";

    const summaryContent = document.createElement("div");
    summaryContent.style.textAlign = "left";
    summaryContent.innerHTML = summary;

    summaryContainer.appendChild(summaryTitle);
    summaryContainer.appendChild(summaryContent);
  };

  const displayError = (message) => {
    const summaryDiv = document.getElementById("summary-div");
    if (!summaryDiv) {
      return;
    }

    summaryDiv.innerHTML = "";

    const errorMessage = document.createElement("div");
    errorMessage.textContent = message;
    errorMessage.style.color = "red";
    errorMessage.style.fontSize = "16px";
    errorMessage.style.fontWeight = 800;
    errorMessage.style.margin = "10px 0 20px 0";

    const regenerateButton = document.createElement("button");
    regenerateButton.textContent = "Regenerate";
    regenerateButton.style.padding = "10px";
    regenerateButton.style.margin = "5px";
    regenerateButton.style.border = "none";
    regenerateButton.style.borderRadius = "5px";
    regenerateButton.style.backgroundColor = "red";
    regenerateButton.style.color = "#fff";
    regenerateButton.style.cursor = "pointer";
    regenerateButton.addEventListener("click", handleClickAiButton);

    summaryDiv.appendChild(errorMessage);
    summaryDiv.appendChild(regenerateButton);
  };

  const clearSummary = () => {
    const summaryDiv = document.getElementById("summary-div");
    if (summaryDiv) {
      summaryDiv.remove();
    }
  };

  const disableAiButton = () => {
    const aiButton = document.getElementById("ai-button");
    if (aiButton) {
      aiButton.style.pointerEvents = "none";
      aiButton.style.opacity = "0.5";
      aiButton.title = "Summary already generated";
    }
  };

  const newVideoLoaded = () => {
    const aiButtonExists = document.getElementById("ai-button");

    if (aiButtonExists) {
      aiButtonExists.remove();
    }

    const aiButton = document.createElement("img");
    aiButton.id = "ai-button";
    aiButton.src = chrome.runtime.getURL("assets/aiicon.svg");
    aiButton.title = "Click to summarize this video";

    aiButton.addEventListener("click", handleClickAiButton);

    const addButtonToControls = () => {
      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      if (!youtubeLeftControls) {
        console.warn("YouTube left controls not found");
        return;
      }

      if (!document.getElementById("ai-button")) {
        youtubeLeftControls.appendChild(aiButton);
      }

      const videoId = new URLSearchParams(window.location.search).get("v");
      if (!videoId) {
        return;
      }

      chrome.storage.local.get([videoId], (result) => {
        if (result[videoId]) {
          displayLoader();
          displaySummary(result[videoId]);
          disableAiButton();
        }
      });
    };

    if (!document.getElementsByClassName("ytp-left-controls")[0]) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            if (document.getElementsByClassName("ytp-left-controls")[0]) {
              observer.disconnect();
              addButtonToControls();
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      addButtonToControls();
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type } = obj;

    if (type === "NEW") {
      clearSummary();
      newVideoLoaded();
    }
  });

  newVideoLoaded();
})();
