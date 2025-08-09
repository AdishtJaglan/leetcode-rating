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

// -----------------
// Show button logic
// -----------------

const SHOW_BTN = document.getElementById("show");
const COOKIE_CONTAINER = document.getElementById("cookieContainer");
const TOKEN_SESSION_EL = document.getElementById("token-session");
const TOKEN_CSRF_EL = document.getElementById("token-csrf");
const COPY_BOTH_BTN = document.getElementById("copyBoth");
const COOKIE_STATUS = document.getElementById("cookieStatus");

function maskToken(val) {
  if (!val) return "—";
  if (val.length <= 12) return val;
  return val.slice(0, 6) + "…" + val.slice(-4);
}

function setStatus(msg, timeout = 2000) {
  COOKIE_STATUS.textContent = msg;
  if (timeout) {
    setTimeout(() => {
      COOKIE_STATUS.textContent = "";
    }, timeout);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (err) {
      document.body.removeChild(ta);
      return false;
    }
  }
}

/**
 * Try to read tokens from the popup's sessionStorage first.
 * If not found, attempt to ask the active tab via messaging (content script must respond).
 */
function getSessionTokensFromPopup() {
  const session =
    window.sessionStorage.getItem("LEETCODE_SESSION") ||
    window.sessionStorage.getItem("leetcode_session") ||
    window.sessionStorage.getItem("LEETCODESESSION") ||
    null;
  const csrf =
    window.sessionStorage.getItem("csrftoken") ||
    window.sessionStorage.getItem("CSRFToken") ||
    null;
  return { session, csrf };
}

function getSessionTokensFromTabFallback() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        return resolve({ session: null, csrf: null });
      }

      chrome.runtime.sendMessage(
        { action: "getCookiesForPopup" },
        async (cookieResp) => {
          if (chrome.runtime.lastError || !cookieResp) {
            console.warn(
              "Failed to get cookies from background:",
              chrome.runtime.lastError
            );
            return resolve({ session: null, csrf: null });
          }

          const sessionCookie = cookieResp.sessionCookie || null;
          const csrfCookie = cookieResp.csrfCookie || null;

          if (!sessionCookie || !csrfCookie) {
            return resolve({
              session: sessionCookie ? sessionCookie.value : null,
              csrf: csrfCookie ? csrfCookie.value : null,
            });
          }

          const payload = {
            action: "readSessionStorage",
            cookies: {
              sessionValue: sessionCookie.value,
              csrfValue: csrfCookie.value,
            },
          };

          const trySendToContent = (retry = false) => {
            chrome.tabs.sendMessage(tab.id, payload, (resp) => {
              if (chrome.runtime.lastError || !resp) {
                if (!retry) {
                  chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, files: ["content-script.js"] },
                    () => {
                      trySendToContent(true);
                    }
                  );
                  return;
                }
                console.warn(
                  "Content script didn't respond:",
                  chrome.runtime.lastError
                );
                return resolve({
                  session: sessionCookie.value || null,
                  csrf: csrfCookie.value || null,
                });
              }

              const leetcode_session =
                resp.leetcode_session ||
                resp.parsed?.leetcode_session ||
                resp.sessionDataSession ||
                null;
              const csrftoken =
                resp.csrftoken ||
                resp.parsed?.csrftoken ||
                resp.sessionDataCsrf ||
                null;

              resolve({
                session: leetcode_session || sessionCookie.value || null,
                csrf: csrftoken || csrfCookie.value || null,
              });
            });
          };

          trySendToContent(false);
        }
      );
    });
  });
}

async function fetchTokens() {
  const popupTokens = getSessionTokensFromPopup();
  if (popupTokens.session || popupTokens.csrf) {
    return popupTokens;
  }

  const tabTokens = await getSessionTokensFromTabFallback();
  return tabTokens;
}

async function renderTokens() {
  const { session, csrf } = await fetchTokens();

  TOKEN_SESSION_EL.dataset.full = session || "";
  TOKEN_CSRF_EL.dataset.full = csrf || "";

  TOKEN_SESSION_EL.textContent = maskToken(session);
  TOKEN_CSRF_EL.textContent = maskToken(csrf);

  COOKIE_CONTAINER.style.display = "block";
}

SHOW_BTN.addEventListener("click", async () => {
  const isHidden =
    COOKIE_CONTAINER.style.display === "none" ||
    !COOKIE_CONTAINER.style.display;
  if (isHidden) {
    SHOW_BTN.setAttribute("aria-pressed", "true");
    await renderTokens();
  } else {
    SHOW_BTN.setAttribute("aria-pressed", "false");
    COOKIE_CONTAINER.style.display = "none";
  }
});

COPY_BOTH_BTN.addEventListener("click", async () => {
  const s = TOKEN_SESSION_EL.dataset.full || "";
  const c = TOKEN_CSRF_EL.dataset.full || "";
  if (!s && !c) {
    setStatus("No tokens found");
    return;
  }

  // format: LEETCODE_SESSION=<value>; csrftoken=<value>
  const combined = `LEETCODE_SESSION=${s}; csrftoken=${c}`;
  const ok = await copyText(combined);
  setStatus(ok ? "Both copied" : "Copy failed");
});
