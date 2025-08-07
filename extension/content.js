(function () {
  const BATCH_URL = "http://localhost:3000/rate-batch";
  const ANCHOR_SELECTOR = 'a[href^="/problems/"][target="_self"][id]';
  const TITLE_SELECTOR = "div.ellipsis.line-clamp-1";

  let batchTimer = null;
  let tableObserver = null;
  let initializedForPath = null;

  // ——————————————————————————————
  // Core batch logic
  // ——————————————————————————————

  function scheduleBatch() {
    clearTimeout(batchTimer);
    batchTimer = setTimeout(runBatchRating, 300);
  }

  function collectRows() {
    return Array.from(document.querySelectorAll(ANCHOR_SELECTOR))
      .map((a) => {
        const titleDiv = a.querySelector(TITLE_SELECTOR);
        const badgeEl = a.querySelector("p");
        if (!titleDiv || !badgeEl) return null;
        const title = titleDiv.textContent.trim();
        return { title, badgeEl };
      })
      .filter(Boolean);
  }

  function runBatchRating() {
    const rows = collectRows();
    if (!rows.length) {
      console.warn("[content] no rows found to rate");
      return;
    }

    const payload = { questions: rows.map((r) => r.title) };

    fetch(BATCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        rows.forEach(({ title, badgeEl }) => {
          const map = data?.data;
          const rating = map?.[title] ?? map?.[extractId(title)];
          if (rating != null) badgeEl.textContent = rating;
        });
      })
      .catch((err) => console.error("[content] batch‐rating error:", err));
  }

  // ——————————————————————————————
  // Helpers
  // ——————————————————————————————

  function extractId(title) {
    const m = title.match(/^(\d+)\./);
    return m?.[1];
  }

  // ——————————————————————————————
  // Infinite‐scroll observer on the problem table
  // ——————————————————————————————

  function setupTableObserver() {
    if (tableObserver) tableObserver.disconnect();

    const tbody = document.querySelector(
      'div[class*="w-full"][class*="pb-[80px]"]'
    );
    if (!tbody) {
      console.warn(
        "[content] table <tbody> not found, cannot watch infinite scroll"
      );
      return;
    }

    tableObserver = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length)) {
        scheduleBatch();
      }
    });
    tableObserver.observe(tbody, { childList: true, subtree: true });
  }

  // ——————————————————————————————
  // Initialize the batch + table observer for /problemset
  // ——————————————————————————————
  let firstInit = true;
  function initProblemset() {
    if (initializedForPath === window.location.pathname) {
      return;
    }
    initializedForPath = window.location.pathname;

    const start = () => {
      scheduleBatch();
      setupTableObserver();
    };

    if (firstInit) {
      firstInit = false;
      setTimeout(start, 5000);
    } else {
      start();
    }
  }

  // ——————————————————————————————
  // SPA navigation detection via body‐observer
  // ——————————————————————————————

  let lastPath = location.pathname;
  const rootObserver = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      if (lastPath.startsWith("/problemset")) {
        initProblemset();
      }
    }
  });
  rootObserver.observe(document.body, { childList: true, subtree: true });

  // ——————————————————————————————
  // Kick off if already on /problemset
  // ——————————————————————————————

  if (location.pathname.startsWith("/problemset")) {
    initProblemset();
  } else {
  }
})();
