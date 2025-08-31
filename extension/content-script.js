chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== "readSessionStorage" || !msg.cookies) {
    return;
  }

  try {
    const { sessionValue, csrfValue } = msg.cookies;
    const storageKey = `[${sessionValue}, ${csrfValue}]`;
    const sessionDataRaw = sessionStorage.getItem(storageKey) || null;

    let parsed = null;
    try {
      parsed = sessionDataRaw ? JSON.parse(sessionDataRaw) : null;
    } catch (e) {
      // not JSON — leave parsed as null
    }

    const leetcode_session =
      (parsed &&
        (parsed.leetcode_session ||
          parsed.LEETCODE_SESSION ||
          parsed.session ||
          parsed.token)) ||
      null;
    const csrftoken =
      (parsed && (parsed.csrftoken || parsed.CSRFToken || parsed.csrf)) || null;

    sendResponse({
      storageKey,
      sessionData: sessionDataRaw,
      parsed: parsed || null,
      leetcode_session,
      csrftoken,
    });
  } catch (err) {
    sendResponse({ error: err.message });
  }

  return true;
});
