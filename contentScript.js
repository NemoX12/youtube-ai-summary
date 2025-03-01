(() => {
  const style = document.createElement("style");
  style.textContent = `
      .ai-button-style {
        filter: invert(100%);
        width: 20px;
        height: 20px;
        margin: auto;
        margin-right: 10px;
        cursor: pointer;
        transition: filter 0.3s;
      }
      .ai-button-style:hover {
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
        background: #fff;
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
  let summary = "";

  const handleClickAiButton = () => {
    displayLoader();

    const videoId = new URLSearchParams(window.location.search).get("v");
    const YT_INITIAL_PLAYER_RESPONSE_RE =
      /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
    let player = window.ytInitialPlayerResponse;
    if (!player || videoId !== player.videoDetails.videoId) {
      fetch("https://www.youtube.com/watch?v=" + videoId)
        .then(function (response) {
          return response.text();
        })
        .then(function (body) {
          const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
          if (!playerResponse) {
            console.warn("Unable to parse playerResponse");
            displayError("Unable to parse player response. Please try again.");
            return;
          }
          player = JSON.parse(playerResponse[1]);
          const metadata = {
            title: player.videoDetails.title,
            duration: player.videoDetails.lengthSeconds,
            author: player.videoDetails.author,
            views: player.videoDetails.viewCount,
          };

          if (!player.captions || !player.captions.playerCaptionsTracklistRenderer) {
            displayError("No captions available for this video.");
            return;
          }

          const tracks = player.captions.playerCaptionsTracklistRenderer.captionTracks;
          tracks.sort(compareTracks);

          fetch(tracks[0].baseUrl + "&fmt=json3")
            .then(function (response) {
              return response.json();
            })
            .then(function (transcript) {
              const result = { transcript: transcript, metadata: metadata };

              const parsedTranscript = transcript.events
                .filter(function (x) {
                  return x.segs;
                })
                .map(function (x) {
                  return x.segs
                    .map(function (y) {
                      return y.utf8;
                    })
                    .join(" ");
                })
                .join(" ")
                .replace(/[\u200B-\u200D\uFEFF]/g, "")
                .replace(/\s+/g, " ");

              chrome.storage.local.get([videoId], (result) => {
                if (result[videoId]) {
                  return;
                } else {
                  chrome.runtime.sendMessage(
                    { type: "SUMMARIZE", value: parsedTranscript },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        displayError("Error sending message. Please try again.");
                      } else if (response && response.summary && !response.error) {
                        summary = response.summary;
                        chrome.storage.local.set({ [videoId]: summary });
                        displaySummary(summary);
                        disableAiButton();
                      } else {
                        displayError("No summary received. Please try again.");
                      }
                    }
                  );
                }
              });
            });
        });
    }

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
  };

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
      summaryDiv.style.backgroundColor = "rgba(39, 39, 39, 0.9)";
      summaryDiv.style.textAlign = "center";
      summaryDiv.style.fontSize = "14px";
      summaryDiv.style.color = "#fff";

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

    const summaryTitle = document.createElement("h3");
    summaryTitle.style.textAlign = "left";
    summaryTitle.textContent = "AI Summary:";

    const summaryContent = document.createElement("div");
    summaryContent.style.textAlign = "left";
    summaryContent.textContent = summary;

    summaryDiv.appendChild(summaryTitle);
    summaryDiv.appendChild(summaryContent);
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

    if (!aiButtonExists) {
      const aiButton = document.createElement("img");
      aiButton.id = "ai-button";
      aiButton.src = chrome.runtime.getURL("assets/aiicon.svg");
      aiButton.classList.add("ai-button-style");
      aiButton.title = "Click to summarize this video";

      aiButton.addEventListener("click", handleClickAiButton);

      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];

      youtubeLeftControls.appendChild(aiButton);
    } else {
      const aiButton = document.getElementById("ai-button");
      aiButton.style.pointerEvents = "auto";
      aiButton.style.opacity = "1";
      aiButton.title = "Click to summarize this video";
    }

    const videoId = new URLSearchParams(window.location.search).get("v");

    chrome.storage.local.get([videoId], (result) => {
      if (result[videoId]) {
        displayLoader();
        displaySummary(result[videoId]);
        disableAiButton();
      }
    });
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
