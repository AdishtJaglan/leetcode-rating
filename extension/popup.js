const sendButton = document.getElementById("send");

function showLoading() {
  if (sendButton) sendButton.classList.add("loading");
}

function hideLoading() {
  if (sendButton) sendButton.classList.remove("loading");
}

document.getElementById("send").addEventListener("click", () => {
  showLoading();

  chrome.runtime.sendMessage({ action: "sendCookies" }, (response) => {
    hideLoading();

    if (chrome.runtime.lastError) {
      showStatus("Extension error occurred", "error");
      return;
    }

    if (response) {
      if (response.success) {
        console.log("Cookies sent successfully!");
      } else {
        console.warn("Failed to send cookies:", response.reason);
      }
    } else {
      console.warn("No response from extension");
    }
  });
});
