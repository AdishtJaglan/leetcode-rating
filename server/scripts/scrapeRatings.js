import puppeteer from "puppeteer";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, "problems.json");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  const TARGET_COUNT = 4000;
  const SCROLL_DELAY_MS = 1000;
  const MAX_NO_CHANGE = 5;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://clist.by/problems/?resource=102", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("table tbody");

  let lastCount = 0;
  let noChangeCounter = 0;

  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(SCROLL_DELAY_MS);

    const currentCount = await page.evaluate(
      () => document.querySelectorAll("table tbody tr").length
    );
    console.log("Rows loaded:", currentCount);

    if (currentCount >= TARGET_COUNT) {
      console.log(`✅ Reached target (${currentCount} ≥ ${TARGET_COUNT})`);
      break;
    }

    if (currentCount === lastCount) {
      noChangeCounter++;
      if (noChangeCounter >= MAX_NO_CHANGE) {
        console.log("⚠️ No new rows after several scrolls — stopping.");
        break;
      }
    } else {
      noChangeCounter = 0;
      lastCount = currentCount;
    }
  }

  const problems = await page.evaluate(() =>
    Array.from(document.querySelectorAll("table tbody tr")).map((row) => {
      const idCell = row.querySelector("td.problem-column-id > span > span");
      const nameCell = row.querySelector("td.problem-name-column");
      const ratingCell = row.querySelector(
        "td.problem-rating-column > span.coder-color"
      );
      const linkEl = nameCell?.querySelector("a");
      const id = idCell?.innerText.trim() || null;
      const title =
        linkEl?.innerText.trim() || nameCell?.innerText.trim() || null;
      const idTitle = id + ". " + title;
      return {
        id: id,
        title: idTitle,
        rating: ratingCell?.innerText.trim() || null,
      };
    })
  );

  fs.writeFileSync(OUT_FILE, JSON.stringify(problems, null, 2), "utf-8");
  console.log(`📄 Saved ${problems.length} problems to ${OUT_FILE}`);

  await browser.close();
})();
