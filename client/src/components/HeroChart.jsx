import { useState, useMemo, useRef, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import getRatingColor from "@/utils/ratingColor";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Average Rating",
    color: "hsl(var(--chart-1))",
  },
};

const HeroChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState("7d");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [currentRatingColor, setCurrentRatingColor] = useState("");
  const [averageRatingColor, setAverageRatingColor] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalized = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .map((d) => ({
        date: d.date,
        desktop:
          typeof d.avgRating === "number"
            ? d.avgRating
            : Number(d.avgRating) || 0,
      }))
      .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
  }, [data]);

  const referenceDate = useMemo(() => {
    if (normalized.length === 0) return new Date();
    return new Date(normalized[normalized.length - 1].date);
  }, [normalized]);

  const filteredData = useMemo(() => {
    if (!normalized.length) return [];

    if (timeRange === "all") return normalized;

    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return normalized.filter((item) => new Date(item.date) >= startDate);
  }, [normalized, referenceDate, timeRange]);

  const currentRating =
    filteredData.length > 0 ? filteredData[filteredData.length - 1].desktop : 0;
  const previousRating =
    filteredData.length > 1 ? filteredData[filteredData.length - 2].desktop : 0;
  const ratingChange = currentRating - previousRating;
  const ratingChangePercent =
    previousRating > 0 ? (ratingChange / previousRating) * 100 : 0;

  const averagePeriodRating =
    filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + item.desktop, 0) /
        filteredData.length
      : 0;

  useEffect(() => {
    setCurrentRatingColor(getRatingColor(currentRating));
    setAverageRatingColor(getRatingColor(averagePeriodRating));
  }, [currentRating, averagePeriodRating]);

  return (
    <div className="w-full bg-gradient-to-br from-gray-950/30 to-gray-900/10 backdrop-blur-sm shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800/30">
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            LeetCode Performance
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Daily average difficulty rating of solved problems
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div
                className={`${currentRatingColor?.dot} h-2.5 w-2.5 rounded-full`}
              ></div>
              <span className="text-xl font-bold text-white">
                {currentRating.toFixed(1)}
              </span>
              <span className="text-gray-400 text-sm">latest</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`${averageRatingColor?.dot} h-2.5 w-2.5 rounded-full`}
              ></div>
              <span className="text-lg font-semibold text-gray-300">
                {averagePeriodRating.toFixed(1)}
              </span>
              <span className="text-gray-400 text-sm">avg</span>
            </div>

            {ratingChange !== 0 && (
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  ratingChange >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                <span>{ratingChange >= 0 ? "↗" : "↘"}</span>
                <span>{Math.abs(ratingChangePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="relative" ref={selectRef}>
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="flex items-center justify-between w-[160px] px-3 py-2 bg-gray-800/40 border border-gray-700/40 rounded-lg text-white backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-200"
          >
            <span className="text-sm font-medium">
              {timeRange === "all" && "All time"}
              {timeRange === "90d" && "3 months"}
              {timeRange === "30d" && "30 days"}
              {timeRange === "7d" && "7 days"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isSelectOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isSelectOpen && (
            <div className="absolute top-full mt-2 right-0 w-full bg-gray-900/95 border border-gray-700/50 rounded-lg shadow-2xl backdrop-blur-md z-50">
              {[
                { value: "all", label: "All time" },
                { value: "90d", label: "3 months" },
                { value: "30d", label: "30 days" },
                { value: "7d", label: "7 days" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeRange(option.value);
                    setIsSelectOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-700/50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                    timeRange === option.value
                      ? "bg-gray-700/30 text-white"
                      : "text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            data={filteredData}
            margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          >
            <defs>
              {/* Gradient for bars */}
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
              </linearGradient>

              {/* Glow effect */}
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(100, 116, 139, 0.1)"
              strokeDasharray="2 2"
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickMargin={8}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="bg-gray-800/95 border-gray-600/50 backdrop-blur-md shadow-2xl rounded-xl text-white"
                  labelClassName="text-gray-200"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                    })
                  }
                  formatter={(value) => [
                    `${value.toFixed(1)} avg rating`,
                    "Difficulty",
                  ]}
                />
              }
            />

            <Bar
              dataKey="desktop"
              fill="url(#barGradient)"
              radius={[3, 3, 0, 0]}
              filter="url(#barGlow)"
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default HeroChart;
