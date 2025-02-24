document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const setKeyButton = document.getElementById("setKey");
  const removeKeyButton = document.createElement("button");
  removeKeyButton.id = "removeKey";
  removeKeyButton.textContent = "Remove API Key";
  removeKeyButton.style.display = "none";
  document.querySelector(".form").appendChild(removeKeyButton);

  chrome.storage.local.get("AI_API_KEY", (result) => {
    if (result.AI_API_KEY) {
      apiKeyInput.value = result.AI_API_KEY;
      apiKeyInput.disabled = true;
      setKeyButton.disabled = true;
      removeKeyButton.style.display = "block";
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
});
