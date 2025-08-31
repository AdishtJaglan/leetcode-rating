const calculateWeakTopics = async (
  solvedProblems = [],
  failedProblems = []
) => {
  const TIME_DECAY_DAYS = 30;
  const MIN_OCCURRENCES = 2;

  let TOPIC_COMPLEXITY_WEIGHTS = {};
  let maxScore = 1;
  let minScore = 1;

  try {
    const { readFile } = await import("fs/promises");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const weightsPath = join(__dirname, "../data/tagAverages.json");

    const rawData = await readFile(weightsPath, "utf8");
    const bayesianData = JSON.parse(rawData);

    const scores = Object.values(bayesianData).map((topic) => topic.score);
    maxScore = Math.max(...scores);
    minScore = Math.min(...scores);

    Object.entries(bayesianData).forEach(([topicName, topicData]) => {
      const normalizedWeight =
        0.5 + (2.5 * (topicData.score - minScore)) / (maxScore - minScore);

      const normalizedTopicName = topicName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");

      TOPIC_COMPLEXITY_WEIGHTS[normalizedTopicName] = parseFloat(
        normalizedWeight.toFixed(2)
      );
    });
  } catch (error) {
    console.warn(
      "Could not load Bayesian weights, using fallback weights:",
      error.message
    );

    // Fallback weights if file loading fails
    TOPIC_COMPLEXITY_WEIGHTS = {
      "dynamic-programming": 2.5,
      graph: 2.3,
      tree: 2.0,
      "binary-search": 2.0,
      backtracking: 2.2,
      trie: 2.4,
      heap: 2.0,
      "linked-list": 1.5,
      stack: 1.4,
      queue: 1.4,
      "hash-table": 0.7,
      string: 0.9,
      math: 1.0,
    };
  }

  // this set contains topics which are
  // objectively easy, and leetcode just
  // slams them into each question
  const FILTERED_TOPICS = new Set();

  Object.entries(TOPIC_COMPLEXITY_WEIGHTS).forEach(([topic, weight]) => {
    if (weight < 0.8) {
      FILTERED_TOPICS.add(topic);
    }
  });

  [
    "array",
    "arrays",
    "hash table",
    "implementation",
    "brute-force",
    "simulation",
  ].forEach((topic) => {
    FILTERED_TOPICS.add(topic);
  });

  const now = new Date();

  const highSubs = solvedProblems.filter((p) => p?.numSubmitted >= 4) || [];
  const problemsWithWeights = [
    ...highSubs.map((p) => ({ ...p, baseWeight: 0.7 })),
    ...failedProblems.map((p) => ({ ...p, baseWeight: 1.0 })),
  ];

  let topicScores = {};

  problemsWithWeights.forEach((problem) => {
    const { topicTags, submissionTime, baseWeight } = problem;

    if (!topicTags || topicTags.length === 0) return;

    let timeWeight = 1.0;
    if (submissionTime) {
      const daysDiff = (now - new Date(submissionTime)) / (1000 * 60 * 60 * 24);
      timeWeight = Math.exp(-daysDiff / TIME_DECAY_DAYS);
    }

    topicTags.forEach((tag) => {
      const tagStr = String(tag).toLowerCase();

      if (FILTERED_TOPICS.has(tagStr)) return;

      const complexityWeight = TOPIC_COMPLEXITY_WEIGHTS[tagStr] || 1.0;
      const finalScore = baseWeight * timeWeight * complexityWeight;

      topicScores[tagStr] = (topicScores[tagStr] || 0) + finalScore;
    });
  });

  const filteredTopics = Object.entries(topicScores)
    .filter(([_, score]) => score >= MIN_OCCURRENCES * 0.5)
    .reduce((acc, [topic, score]) => {
      acc[topic] = parseFloat(score.toFixed(2));
      return acc;
    }, {});

  const sortedTopics = Object.entries(filteredTopics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .reduce((acc, [topic, score]) => {
      acc[topic] = score;
      return acc;
    }, {});

  return {
    topics: sortedTopics,
    totalProblemsAnalyzed: problemsWithWeights.length,
    algorithm: "bayesian_weighted_v3",
    weightsInfo: {
      totalTopics: Object.keys(TOPIC_COMPLEXITY_WEIGHTS).length,
      scoreRange: { min: minScore, max: maxScore },
      filteredTopicsCount: FILTERED_TOPICS.size,
    },
  };
};

export default calculateWeakTopics;
