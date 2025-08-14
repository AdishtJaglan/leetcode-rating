import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import axios from "axios";

import { formatDateReadable } from "@/utils/dateFormatters";
import getRatingColor from "@/utils/ratingColor";
import getDifficultyColor from "@/utils/difficultyColor";

const API_URL = import.meta.env.VITE_API_URL;

const QuestionList = () => {
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [ratingRange, setRatingRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const loadingRef = useRef(null);

  const hasActiveFilters = useMemo(
    () =>
      !!searchTerm ||
      !!selectedDifficulty ||
      selectedTopics.length > 0 ||
      !!ratingRange.min ||
      !!ratingRange.max,
    [searchTerm, selectedDifficulty, selectedTopics, ratingRange]
  );

  const fetchData = useCallback(async (page = 1, isLoadMore = false) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      if (!isLoadMore) setIsInitialLoading(true);
      else setIsLoadingMore(true);

      const { data } = await axios.get(`${API_URL}/problem/solved-problems`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20 },
      });

      const newProblems = data?.data || [];
      const meta = data?.meta || {};

      if (isLoadMore) {
        setAllData((prev) => [...prev, ...newProblems]);
      } else {
        setAllData(newProblems);
      }

      setHasMore(page < meta.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  const cleanTitle = (title, problemId) => {
    return title.replace(new RegExp(`^${problemId}\\.\\s*`), "");
  };

  const safeData = useMemo(() => {
    return Array.isArray(allData) ? allData : [];
  }, [allData]);

  const isDataLoaded = !isInitialLoading;
  const isEmpty = isDataLoaded && allData.length === 0;

  const allTopics = [
    ...new Set(safeData.flatMap((item) => item.topicTags || [])),
  ];

  useEffect(() => {
    if (!isDataLoaded) return;

    let filtered = [...safeData];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          cleanTitle(item.title, item.problemId).toLowerCase().includes(term) ||
          item.problemId.toString().includes(term) ||
          (item.topicTags || []).some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(
        (item) => item.difficulty === selectedDifficulty
      );
    }

    // Topic filters
    if (selectedTopics.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTopics.some((topic) => (item.topicTags || []).includes(topic))
      );
    }

    // Rating range filter
    if (ratingRange.min || ratingRange.max) {
      filtered = filtered.filter((item) => {
        const rating = item.ratingAtSolve;
        const min = ratingRange.min ? parseInt(ratingRange.min) : 0;
        const max = ratingRange.max ? parseInt(ratingRange.max) : Infinity;
        return rating >= min && rating <= max;
      });
    }

    setFilteredData(filtered);
  }, [
    safeData,
    searchTerm,
    selectedDifficulty,
    selectedTopics,
    ratingRange,
    isDataLoaded,
  ]);

  // Load more items
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchData(currentPage + 1, true);
  }, [currentPage, hasMore, isLoadingMore, fetchData]);

  useEffect(() => {
    if (hasActiveFilters || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loadingRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.disconnect();
      }
    };
  }, [hasActiveFilters, hasMore, isLoadingMore, loadMoreItems]);

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDifficulty("");
    setSelectedTopics([]);
    setRatingRange({ min: "", max: "" });
  };

  // Render loading state
  if (!isDataLoaded) {
    return (
      <div className="w-full mt-8 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Recently Solved Problems
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Your latest LeetCode submissions with ratings and difficulty
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-950/20 to-gray-900/10 border border-gray-800/20 rounded-2xl backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Loading problems...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (isEmpty) {
    return (
      <div className="w-full mt-8 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Recently Solved Problems
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Your latest LeetCode submissions with ratings and difficulty
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-950/20 to-gray-900/10 border border-gray-800/20 rounded-2xl backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-12 text-center text-gray-400">
            No problems found in your submission history
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 p-6">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Recently Solved Problems
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Your latest LeetCode submissions with ratings and difficulty
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div
          className={`flex items-center justify-start gap-${
            hasActiveFilters ? "4" : "2"
          } transition-all`}
        >
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 p-3 bg-gray-950/30 border border-gray-800 rounded-lg text-gray-300 hover:text-white hover:bg-gray-950/50 transition-all backdrop-blur-sm"
          >
            <Filter size={16} />
            Filters
          </button>
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-400 p-3 bg-gray-950/30 border border-gray-800 rounded-lg hover:text-white transition-colors"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
          <div className={`relative w-${hasActiveFilters ? "3/4" : "full"}`}>
            <Search
              className="absolute z-50 left-4 top-4 text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search problems by title, ID, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-950/30 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600/50 focus:bg-gray-950/50 transition-all backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gradient-to-br from-gray-950/20 to-gray-900/10 border border-gray-800/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950/50 border border-gray-800/30 rounded-lg text-white focus:outline-none focus:border-gray-600/50 backdrop-blur-sm"
                >
                  <option value="">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Rating Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={ratingRange.min}
                    onChange={(e) =>
                      setRatingRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-950/50 border border-gray-800/30 rounded-lg text-white focus:outline-none focus:border-gray-600/50 backdrop-blur-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={ratingRange.max}
                    onChange={(e) =>
                      setRatingRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-950/50 border border-gray-800/30 rounded-lg text-white focus:outline-none focus:border-gray-600/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Topic Filter */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topics
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 rounded-full text-xs transition-all backdrop-blur-sm ${
                        selectedTopics.includes(topic)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-400">
          {hasActiveFilters
            ? `Showing ${filteredData.length} of ${allData.length} problems`
            : `Showing ${allData.length} problems`}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-gradient-to-br from-gray-950/20 to-gray-900/10 border border-gray-800/20 rounded-2xl backdrop-blur-sm overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-800/30 bg-gray-950/30">
          <div className="grid grid-cols-12 gap-6 px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div className="col-span-2">Last Solved</div>
            <div className="col-span-2">Rating</div>
            <div className="col-span-1">ID</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Difficulty</div>
          </div>
        </div>

        {/* Table Body */}
        <div>
          {filteredData.length === 0 && !isLoadingMore ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No problems found matching your criteria
            </div>
          ) : (
            filteredData.map((problem, index) => {
              const ratingStyle = getRatingColor(problem.ratingAtSolve);
              const difficultyColor = getDifficultyColor(problem.difficulty);

              return (
                <div
                  key={`${problem.problemId}-${index}`}
                  className="grid grid-cols-12 gap-6 px-6 py-4 hover:bg-gray-800/20 border-b border-gray-800/50 last:border-b-0 transition-all duration-200 hover:backdrop-blur-sm"
                >
                  {/* Last Submitted */}
                  <div className="col-span-2">
                    <span className="text-gray-300 text-sm">
                      {formatDateReadable(problem.lastSubmittedAt)}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${ratingStyle.dot} shadow-lg`}
                        style={{
                          boxShadow: `0 0 8px ${
                            ratingStyle.dot.includes("red")
                              ? "#ef4444"
                              : ratingStyle.dot.includes("orange")
                              ? "#f97316"
                              : ratingStyle.dot.includes("purple")
                              ? "#a855f7"
                              : ratingStyle.dot.includes("blue")
                              ? "#3b82f6"
                              : "#6b7280"
                          }40`,
                        }}
                      ></div>
                      <span
                        className={`text-sm font-medium ${ratingStyle.color}`}
                      >
                        {problem.ratingAtSolve}
                      </span>
                    </div>
                  </div>

                  {/* Problem ID */}
                  <div className="col-span-1">
                    <span className="text-gray-400 text-sm font-mono">
                      {problem.problemId}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="col-span-5">
                    <div className="group relative">
                      <span className="text-white text-sm hover:text-gray-200 transition-colors cursor-pointer">
                        {cleanTitle(problem.title, problem.problemId)}
                      </span>
                      {/* Topic Tags Tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800/95 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap backdrop-blur-md border border-gray-700/50 shadow-xl">
                          {problem.topicTags?.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="col-span-2">
                    <span className={`text-sm font-medium ${difficultyColor}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Loading Indicator */}
        <div ref={loadingRef} className="px-6 py-4 text-center">
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Loading more problems...
            </div>
          )}
          {!hasMore && allData.length > 0 && !hasActiveFilters && (
            <div className="text-gray-400 text-sm">
              You've reached the end of the list
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionList;
