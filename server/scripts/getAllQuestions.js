import fs from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, "questions.json");

const GRAPHQL_URL = "https://leetcode.com/graphql";

const ALL_QUESTIONS_QUERY = `
query allQuestions {
  allQuestions {
    title
    titleSlug
    questionId
    questionFrontendId
    difficulty
    isPaidOnly
    topicTags {
      name
      slug
    }
  }
}
`;

async function fetchAllQuestions() {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: ALL_QUESTIONS_QUERY }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} - ${response.statusText}`
      );
    }

    const json = await response.json();

    const allQuestions = json?.data?.allQuestions ?? [];

    await fs.writeFile(
      OUT_FILE,
      JSON.stringify(allQuestions, null, 2),
      "utf-8"
    );
    console.log("Saved all questions to", OUT_FILE);
  } catch (err) {
    console.error("Failed to fetch questions:", err);
  }
}

fetchAllQuestions();
