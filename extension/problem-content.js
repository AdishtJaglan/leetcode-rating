console.log("[content] LeetCode extension loaded on", window.location.href);

const parts = window.location.pathname.split("/").filter((p) => p);
const slug = parts[1];

if (!slug) {
  console.warn("[content] No slug found in URL.");
} else {
  const href = `/problems/${slug}/`;
  const link = document.querySelector(`a[href="${href}"]`);

  if (!link || !link.innerText) {
    console.warn("[content] Could not find question title anchor.");
  }

  const questionTitle = link.innerText.trim();
  console.log("[content] Found question title:", questionTitle);

  fetch("http://localhost:3000/rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: questionTitle }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const badge = document.querySelector('div[class*="text-difficulty-"]');
      if (badge) {
        console.log("[content] Replacing badge text");
        badge.textContent = `${data.rating}`;
      } else {
        console.warn("[content] Could not find difficulty badge to replace.");
      }
    })
    .catch((err) => {
      console.error("[content] Error while rating:", err);
    });
}
