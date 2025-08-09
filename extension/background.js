chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "sendCookies") {
    const getCookie = (name) =>
      new Promise((resolve) => {
        chrome.cookies.get({ url: "https://leetcode.com", name }, (cookie) =>
          resolve(cookie || null)
        );
      });

    Promise.all([getCookie("LEETCODE_SESSION"), getCookie("csrftoken")])
      .then(([sessionCookie, csrfCookie]) => {
        const cookies = [sessionCookie, csrfCookie].filter(Boolean);
        if (cookies.length === 0) {
          console.warn("Neither cookie found.");
          sendResponse({ success: false, reason: "no-cookies" });
          return;
        }

        const payload = cookies.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
        }));

        return fetch("http://localhost:3000/api/user/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: payload }),
        });
      })
      .then((res) => {
        if (res && !res.ok) throw new Error(`Server ${res.status}`);
        console.log("Selected cookies POSTed");
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error("Error posting cookies:", err);
        sendResponse({ success: false, reason: err.message });
      });

    return true;
  }
});
