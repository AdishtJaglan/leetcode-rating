import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import getRatingColor from "@/utils/ratingColor";

const QuestionList = ({
  data = [
    {
      difficulty: "HARD",
      lastSubmittedAt: "2025-08-12T09:08:30.000Z",
      problemId: "639",
      ratingAtSolve: 2183,
      title: "639. Decode Ways II",
      topicTags: ["String", "Dynamic Programming"],
    },
    {
      difficulty: "MEDIUM",
      lastSubmittedAt: "2025-08-11T14:22:15.000Z",
      problemId: "146",
      ratingAtSolve: 1547,
      title: "146. LRU Cache",
      topicTags: ["Hash Table", "Linked List", "Design"],
    },
    {
      difficulty: "EASY",
      lastSubmittedAt: "2025-08-10T16:45:20.000Z",
      problemId: "1",
      ratingAtSolve: 800,
      title: "1. Two Sum",
      topicTags: ["Array", "Hash Table"],
    },
    {
      difficulty: "HARD",
      lastSubmittedAt: "2025-08-09T11:30:45.000Z",
      problemId: "25",
      ratingAtSolve: 2341,
      title: "25. Reverse Nodes in k-Group",
      topicTags: ["Linked List", "Recursion"],
    },
    {
      difficulty: "MEDIUM",
      lastSubmittedAt: "2025-08-08T19:12:33.000Z",
      problemId: "297",
      ratingAtSolve: 1823,
      title: "297. Serialize and Deserialize Binary Tree",
      topicTags: ["String", "Tree", "Depth-First Search"],
    },
  ],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return "text-green-400";
      case "MEDIUM":
        return "text-orange-400";
      case "HARD":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const cleanTitle = (title, problemId) => {
    return title.replace(new RegExp(`^${problemId}\\.\\s*`), "");
  };

  const totalPages = Math.ceil(data?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data?.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="bg-black py-4">
      <div className="mx-auto">
        {/* Table Container */}
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-slate-800">
            <div className="grid grid-cols-12 gap-6 px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
              <div className="col-span-2">Last Solved</div>
              <div className="col-span-2">Rating</div>
              <div className="col-span-1">ID</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Difficulty</div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {currentData?.map((problem, index) => {
              const ratingStyle = getRatingColor(problem.ratingAtSolve);
              const difficultyColor = getDifficultyColor(problem.difficulty);

              return (
                <div
                  key={`${problem.problemId}-${index}`}
                  className="grid grid-cols-12 gap-6 px-6 py-4 hover:bg-slate-900/30 border-b border-slate-800/50 last:border-b-0 transition-colors"
                >
                  {/* Last Submitted */}
                  <div className="col-span-2">
                    <span className="text-slate-300 text-sm">
                      {formatDate(problem.lastSubmittedAt)}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${ratingStyle.dot}`}
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
                    <span className="text-slate-400 text-sm font-mono">
                      {problem.problemId}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="col-span-5">
                    <div className="group relative">
                      <span className="text-white text-sm hover:text-slate-300 transition-colors cursor-pointer">
                        {cleanTitle(problem.title, problem.problemId)}
                      </span>
                      {/* Topic Tags Tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800/95 text-white text-xs rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm border border-slate-700">
                          {problem.topicTags.join(", ")}
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
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-800 bg-slate-900/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
                  {data.length}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(totalPages)]?.map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => goToPage(i + 1)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentPage === i + 1
                          ? "bg-white text-black"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionList;
