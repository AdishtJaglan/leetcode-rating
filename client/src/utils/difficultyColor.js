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

export default getDifficultyColor;
