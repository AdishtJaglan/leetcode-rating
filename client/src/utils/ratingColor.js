const getRatingColor = (rating) => {
  if (rating >= 3000) return { color: "text-red-500", dot: "bg-red-500" }; // Legendary Grandmaster
  if (rating >= 2600) return { color: "text-red-600", dot: "bg-red-600" }; // International Grandmaster
  if (rating >= 2400) return { color: "text-red-700", dot: "bg-red-700" }; // Grandmaster
  if (rating >= 2300) return { color: "text-orange-500", dot: "bg-orange-500" }; // International Master
  if (rating >= 2100) return { color: "text-orange-400", dot: "bg-orange-400" }; // Master
  if (rating >= 1900) return { color: "text-violet-500", dot: "bg-violet-500" }; // Candidate Master
  if (rating >= 1600) return { color: "text-blue-500", dot: "bg-blue-500" }; // Expert
  if (rating >= 1400) return { color: "text-cyan-400", dot: "bg-cyan-400" }; // Specialist
  if (rating >= 1200) return { color: "text-green-500", dot: "bg-green-500" }; // Pupil
  return { color: "text-gray-400", dot: "bg-gray-400" }; // Newbie
};

export default getRatingColor;
