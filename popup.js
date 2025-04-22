document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.querySelectorAll(".lang_btn");
  const apiKeyInput = document.getElementById("apiKey");
  const setKeyButton = document.getElementById("setKey");
  const removeKeyButton = document.getElementById("removeKey");

  chrome.storage.local.get(["AI_API_KEY", "LANG"], (result) => {
    if (result.AI_API_KEY) {
      apiKeyInput.value = "********"; 
      apiKeyInput.disabled = true;
      setKeyButton.disabled = true;
      removeKeyButton.style.display = "block";
    }
    if (result.LANG) {
      langBtn.forEach((btn) => {
        if (btn.id === result.LANG) {
          btn.classList.add("lang_active");
        }
      });
    }
  });

  setKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value;
    if (apiKey) {
      chrome.storage.local.set({ AI_API_KEY: apiKey }, () => {
        apiKeyInput.value = "********"; 
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

  langBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
      chrome.storage.local.set({ LANG: btn.id }, () => {
        langBtn.forEach((btn) => {
          btn.classList.remove("lang_active");
        });
        btn.classList.add("lang_active");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    });
  });
});
