document.addEventListener("DOMContentLoaded", () => {
  const langUa = document.getElementById("lang_ua");
  const langUs = document.getElementById("lang_us");
  const apiKeyInput = document.getElementById("apiKey");
  const setKeyButton = document.getElementById("setKey");
  const removeKeyButton = document.createElement("button");
  removeKeyButton.id = "removeKey";
  removeKeyButton.textContent = "Remove API Key";
  removeKeyButton.style.display = "none";
  document.querySelector(".form").appendChild(removeKeyButton);

  chrome.storage.local.get(["AI_API_KEY", "LANG"], (result) => {
    if (result.AI_API_KEY) {
      apiKeyInput.value = result.AI_API_KEY;
      apiKeyInput.disabled = true;
      setKeyButton.disabled = true;
      removeKeyButton.style.display = "block";
    }
    if (result.LANG) {
      if (result.LANG === "ua") {
        langUa.classList.add("lang_active");
        langUs.classList.remove("lang_active");
      } else {
        langUa.classList.remove("lang_active");
        langUs.classList.add("lang_active");
      }
    }
  });

  setKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value;
    if (apiKey) {
      chrome.storage.local.set({ AI_API_KEY: apiKey }, () => {
        apiKeyInput.disabled = true;
        setKeyButton.disabled = true;
        removeKeyButton.style.display = "block";
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    }
  });

  removeKeyButton.addEventListener("click", () => {
    chrome.storage.local.remove("AI_API_KEY", () => {
      apiKeyInput.value = "";
      apiKeyInput.disabled = false;
      setKeyButton.disabled = false;
      removeKeyButton.style.display = "none";
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  });

  langUa.addEventListener("click", () => {
    chrome.storage.local.set({ LANG: "ua" }, () => {
      langUa.classList.add("lang_active");
      langUs.classList.remove("lang_active");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  });

  langUs.addEventListener("click", () => {
    chrome.storage.local.set({ LANG: "us" }, () => {
      langUa.classList.remove("lang_active");
      langUs.classList.add("lang_active");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  });
});
