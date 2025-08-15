/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";

import getRatingColor from "@/utils/ratingColor";

const API_URL = import.meta.env.VITE_API_URL;

const Problems = () => {
  const [weakTopics, setWeakTopics] = useState({});
  const [recProblems, setRecProblems] = useState([]);
  const [hardMode, setHardMode] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const headers = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [weakTopicsRes, problemRecsRes] = await Promise.all([
          axios.get(`${API_URL}/user/topics`, headers),
          axios.get(`${API_URL}/user/problem-recs`, headers),
        ]);

        setWeakTopics(weakTopicsRes?.data?.topics);
        if (problemRecsRes?.data?.success) {
          setRecProblems(problemRecsRes?.data?.questionRecs);
        } else {
          // you gotta req problems
        }
      } catch (error) {
        console.error("Error fetching problem data: " + error?.message);
      }
    };

    if (localStorage.getItem("accessToken")) getData();
  }, []);

  // Sort weak topics by value (descending - higher means weaker)
  const sortedWeakTopics = Object.entries(weakTopics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // Show top 8 weak topics

  return (
    <div className="space-y-6 p-4 px-6">
      {/* Weak Topics Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-medium text-white mb-1">
            Areas to Focus
          </h2>
          <p className="text-gray-500 text-sm">
            Topics where you need more practice based on submission history
          </p>
        </div>

        <div className="space-y-1">
          {sortedWeakTopics.map(([topic, value], index) => (
            <div
              key={topic}
              className="flex items-center justify-between py-2 hover:bg-gray-900/20 rounded transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    index === 0
                      ? "bg-red-500"
                      : index === 1
                      ? "bg-orange-500"
                      : index === 2
                      ? "bg-yellow-500"
                      : "bg-gray-600"
                  }`}
                ></div>
                <span className="text-gray-300 capitalize text-sm">
                  {topic}
                </span>
              </div>
              {index < 3 && (
                <span className="text-xs text-gray-600">Priority</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Problems Section */}
      {recProblems.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">
                Recommended Problems
              </h2>
              <p className="text-gray-500 text-sm">
                {recProblems.length} problems tailored to your weak areas
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Show Tags Toggle */}
              <button
                onClick={() => setShowTags(!showTags)}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors duration-150"
              >
                {showTags ? "Hide Tags" : "Show Tags"}
              </button>

              {/* Hard Mode Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Hard Mode</label>
                <button
                  onClick={() => setHardMode(!hardMode)}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                    hardMode ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${
                      hardMode ? "translate-x-5" : "translate-x-1"
                    }`}
                  ></div>
                </button>
              </div>

              {/* Refresh Button */}
              <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors duration-150">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {recProblems.map((problem, index) => (
              <div
                key={problem.id}
                className="py-3 hover:bg-gray-900/20 rounded transition-colors duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <span className="text-gray-600 text-sm mt-0.5 w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={`https://leetcode.com/problems/${problem.slug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-blue-400 transition-colors duration-150 text-sm font-medium"
                        >
                          {problem.title}
                        </a>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            problem.difficulty === "Easy"
                              ? "text-green-400 bg-green-400/10"
                              : problem.difficulty === "Medium"
                              ? "text-yellow-400 bg-yellow-400/10"
                              : "text-red-400 bg-red-400/10"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>

                      {/* Tags - Cleaner Style */}
                      {showTags && (
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {problem.matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-blue-400 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {problem.tags
                            .filter((tag) => !problem.matchedTags.includes(tag))
                            .slice(0, 3)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          {problem.tags.length - problem.matchedTags.length >
                            3 && (
                            <span className="text-xs text-gray-600">
                              +
                              {problem.tags.length -
                                problem.matchedTags.length -
                                3}{" "}
                              more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 ml-4">
                    <span>{Math.round(problem.matchFraction * 100)}%</span>
                    <span
                      className={`${
                        getRatingColor(problem?.rating)?.color
                      } font-mono`}
                    >
                      {problem.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-white mb-2">
            Generate Your Recommendations
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Get personalized problem recommendations based on your weak areas
            and current skill level. Choose your challenge level and start
            improving.
          </p>

          <div className="flex flex-col items-center gap-4">
            {/* Hard Mode Toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-300 mb-1">
                  Challenge Level
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Comfort</span>
                  <button className="w-12 h-6 bg-gray-800 rounded-full relative transition-colors duration-200 hover:bg-gray-700">
                    <div className="w-5 h-5 bg-gray-600 rounded-full absolute left-0.5 top-0.5 transition-transform duration-200"></div>
                  </button>
                  <span className="text-xs text-gray-500">Challenge</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 max-w-xs text-left">
                <div className="font-medium text-gray-400 mb-1">
                  Comfort Mode:
                </div>
                Problems at your current level to build confidence
                <div className="font-medium text-gray-400 mb-1 mt-2">
                  Challenge Mode:
                </div>
                Harder problems to push your limits and accelerate growth
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium">
              Generate Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problems;
