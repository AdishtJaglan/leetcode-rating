import { useState, useEffect } from "react";
import getRatingColor from "@/utils/ratingColor";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState(null);
  const [contestData, setContestData] = useState(null);
  const [ratingColor, setRatingColor] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const { data } = await axios.get(`${API_URL}/user/data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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

  return (
    <div className="w-full border border-gray-800 py-4 px-6 rounded-lg mb-4">
      {avatar && username ? (
        <div className="flex items-center justify-between">
          {/* Left: Avatar and Username */}
          <div className="flex items-center gap-4">
            <img
              src={avatar}
              alt={username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{username}</span>
              {contestData?.badges && contestData.badges.length > 0 && (
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  {contestData.badges[0]?.name}
                </span>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-8 text-sm">
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

            <div className="text-center">
              <div className="text-white font-medium">
                #{contestData?.globalRanking?.toLocaleString()}
              </div>
              <div className="text-gray-500 text-xs">Rank</div>
            </div>

            <div className="text-center">
              <div className="text-white font-medium">
                {contestData?.topPercentage}%
              </div>
              <div className="text-gray-500 text-xs">Top</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span className="text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default Navbar;
