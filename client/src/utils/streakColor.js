export const getStreakColor = (streak) => {
  if (!streak || streak === 0) return "text-gray-500";
  if (streak < 3) return "text-orange-400";
  if (streak < 7) return "text-orange-300";
  if (streak < 15) return "text-yellow-400";
  if (streak < 30) return "text-yellow-300";
  return "text-yellow-200"; // 30+ days
};
