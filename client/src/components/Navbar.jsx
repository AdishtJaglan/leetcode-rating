import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import axios from "axios";

import getRatingColor from "@/utils/ratingColor";
import { getStreakColor } from "@/utils/streakColor";

const API_URL = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const location = useLocation();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState(null);
  const [contestData, setContestData] = useState(null);
  const [ratingColor, setRatingColor] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const headers = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [dataRes, streakDataRes] = await Promise.all([
          axios.get(`${API_URL}/user/data`, headers),
          axios.get(`${API_URL}/user/streak`, headers),
        ]);

        const data = dataRes.data;
        const streakData = streakDataRes.data;

        setStreak(streakData?.currentStreak);
        setUsername(data?.user?.leetcodeUserName);
        setAvatar(data?.user?.leetcodeAvatar);
        setContestData(data?.user?.contestMetaData);
        setRatingColor(getRatingColor(contestData?.rating));
      } catch (error) {
        console.error("Error while fetching nav info: " + error);
      }
    };

    if (localStorage.getItem("accessToken")) fetchData();
  }, [contestData?.rating]);

  const isActiveTab = (path) => location.pathname === path;

  return (
    <div className="sticky top-2 z-50 w-full border border-gray-800 py-4 px-4 sm:px-6 rounded-lg mb-4 hover:border-gray-700 transition-colors duration-200 bg-black/75 backdrop-blur-md">
      {avatar && username ? (
        <>
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            {/* Left: Avatar and Username */}
            <div className="flex items-center gap-4">
              <img
                src={avatar}
                alt={username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{username}</span>

                {/* Streak indicator */}
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  <svg
                    className={`w-3 h-3 ${getStreakColor(streak)}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className={`${getStreakColor(streak)}`}>{streak}</span>
                </div>

                {contestData?.badges && contestData.badges.length > 0 && (
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {contestData.badges[0]?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Center: Navigation with active state */}
            <div className="flex items-center gap-6">
              <Link
                to="/profile"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Overview
              </Link>
              <Link
                to="/profile/problems"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile/problems")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Problems
              </Link>
              <Link
                to="/profile/contests"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile/contests")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Contests
              </Link>
            </div>

            {/* Right: Stats with subtle separators */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-start font-medium gap-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${ratingColor?.dot}`}
                  ></div>
                  <span className={`text-sm font-medium ${ratingColor?.color}`}>
                    {Math.round(contestData?.rating)}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">Rating</div>
              </div>

              <div className="w-px h-8 bg-gray-800"></div>

              <div className="text-center">
                <div className="text-white font-medium">
                  #{contestData?.globalRanking?.toLocaleString()}
                </div>
                <div className="text-gray-500 text-xs">Rank</div>
              </div>

              <div className="w-px h-8 bg-gray-800"></div>

              <div className="text-center">
                <div className="text-white font-medium">
                  {contestData?.topPercentage}%
                </div>
                <div className="text-gray-500 text-xs">Top</div>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:flex lg:hidden flex-col gap-4">
            {/* Top row: Avatar, Username, Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={avatar}
                  alt={username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{username}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    <svg
                      className={`w-3 h-3 ${getStreakColor(streak)}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={`${getStreakColor(streak)}`}>
                      {streak}
                    </span>
                  </div>
                  {contestData?.badges && contestData.badges.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {contestData.badges[0]?.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats - Compact */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${ratingColor?.dot}`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${ratingColor?.color}`}
                    >
                      {Math.round(contestData?.rating)}
                    </span>
                  </div>
                </div>
                <div className="text-white text-sm">
                  #{contestData?.globalRanking?.toLocaleString()}
                </div>
                <div className="text-white text-sm">
                  {contestData?.topPercentage}%
                </div>
              </div>
            </div>

            {/* Bottom row: Navigation */}
            <div className="flex items-center justify-center gap-8 pt-2 border-t border-gray-800">
              <Link
                to="/profile"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Overview
              </Link>
              <Link
                to="/profile/problems"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile/problems")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Problems
              </Link>
              <Link
                to="/profile/contests"
                className={`text-sm transition-colors duration-150 ${
                  isActiveTab("/profile/contests")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Contests
              </Link>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-3">
            {/* Top: Avatar and Username */}
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={username}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white font-medium text-sm">{username}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                <svg
                  className={`w-2.5 h-2.5 ${getStreakColor(streak)}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 117 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={`${getStreakColor(streak)}`}>{streak}</span>
              </div>
            </div>

            {/* Stats Row - Horizontal */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${ratingColor?.dot}`}
                ></div>
                <span className={`font-medium ${ratingColor?.color}`}>
                  {Math.round(contestData?.rating)}
                </span>
                <span className="text-gray-500">Rating</span>
              </div>
              <div className="text-white">
                <span className="text-gray-500">Rank </span>#
                {contestData?.globalRanking?.toLocaleString()}
              </div>
              <div className="text-white">
                <span className="text-gray-500">Top </span>
                {contestData?.topPercentage}%
              </div>
            </div>

            {/* Navigation - Tab Style */}
            <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
              <Link
                to="/profile"
                className={`flex-1 text-center py-2 px-3 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActiveTab("/profile")
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Overview
              </Link>
              <Link
                to="/profile/problems"
                className={`flex-1 text-center py-2 px-3 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActiveTab("/profile/problems")
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Problems
              </Link>
              <Link
                to="/profile/contests"
                className={`flex-1 text-center py-2 px-3 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActiveTab("/profile/contests")
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Contests
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center">
          <span className="text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default Navbar;
