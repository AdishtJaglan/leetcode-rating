import fs from "fs/promises";

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

    await fs.writeFile(
      "questions.json",
      JSON.stringify(json, null, 2),
      "utf-8"
    );
    console.log("Saved all questions to questions.json");
  } catch (err) {
    console.error("Failed to fetch questions:", err);
  }
}

fetchAllQuestions();
