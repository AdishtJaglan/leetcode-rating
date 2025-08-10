(() => {
  function getSlug() {
    return window.location.pathname.split("/").filter(Boolean)[1] || null;
  }

  function getQuestionTitleFromDOM() {
    const selectors = [
      'div[data-cy="question-title"]',
      'div[data-test-id="question-title"]',
      ".text-title-large",
      "h1",
      "h2",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }

    const slug = getSlug();
    const href = `/problems/${slug}/`;
    const link = document.querySelector(`a[href="${href}"]`);
    if (link && link.innerText) {
      return link.innerText.trim();
    }

    if (document.title) {
      return document.title.replace(/\s*-\s*LeetCode.*$/i, "").trim();
    }

    return null;
  }

  function waitForTitleChange(prevTitle, timeout = 2500) {
    const now = performance.now();
    const initial = getQuestionTitleFromDOM();
    if (initial && initial !== prevTitle) return Promise.resolve(initial);

    return new Promise((resolve, reject) => {
      const obs = new MutationObserver(() => {
        const cur = getQuestionTitleFromDOM();
        if (cur && cur !== prevTitle) {
          obs.disconnect();
          clearTimeout(timer);
          resolve(cur);
        }
      });

      const timer = setTimeout(() => {
        obs.disconnect();
        const cur = getQuestionTitleFromDOM();
        if (cur) resolve(cur);
        else reject(new Error("timeout waiting for title change"));
      }, timeout);

      obs.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
  }

  async function fetchAndApplyRating({ slug, title }) {
    try {
      const res = await fetch("http://localhost:3000/api/problem/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title }),
      });
      if (!res.ok) throw new Error("Server responded " + res.status);
      const data = await res.json();
      const badge = document.querySelector('div[class*="text-difficulty-"]');
      if (badge) {
        badge.textContent = `${data.rating}`;
      } else {
        console.warn("[content] Could not find difficulty badge to replace.");
      }
    } catch (err) {
      console.error("[content] Error while rating:", err);
    }
  }

  (function hijackHistory() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function () {
      _push.apply(this, arguments);
      window.dispatchEvent(new Event("locationchange"));
    };
    history.replaceState = function () {
      _replace.apply(this, arguments);
      window.dispatchEvent(new Event("locationchange"));
    };
    window.addEventListener("popstate", () =>
      window.dispatchEvent(new Event("locationchange"))
    );
  })();

  let lastSlug = getSlug();
  let lastTitle = getQuestionTitleFromDOM();

  if (lastSlug) fetchAndApplyRating({ slug: lastSlug, title: lastTitle });

  window.addEventListener("locationchange", async () => {
    const slug = getSlug();
    if (!slug || slug === lastSlug) return;

    const prevTitle = lastTitle;
    lastSlug = slug;

    try {
      const newTitle = await waitForTitleChange(prevTitle, 3000);
      lastTitle = newTitle;
      fetchAndApplyRating({ slug, title: newTitle });
    } catch (err) {
      console.warn(
        "[content] Title did not update in time, falling back to slug-only fetch"
      );

      fetchAndApplyRating({ slug, title: null });
    }
  });
})();
