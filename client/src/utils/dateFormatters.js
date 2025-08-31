// Day, Date, Month [24 Aug, 2024]
export const formatDateReadable = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};
