import { useState, useMemo, useRef, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChevronDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Average Rating",
    color: "hsl(var(--chart-1))",
  },
};

export function ChartAreaInteractive({ data }) {
  const [timeRange, setTimeRange] = useState("7d");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef(null);

  // Close dropdown when clicking outside
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

  return (
    <Card className="bg-gradient-to-br from-gray-950/50 to-gray-900/20 border-gray-800/50 backdrop-blur-sm shadow-2xl shadow-black/50">
      <CardHeader className="flex items-center gap-4 space-y-0 border-b border-gray-800/50 py-6 sm:flex-row">
        <div className="grid flex-1 gap-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Interactive Rating Analytics
          </CardTitle>
          <CardDescription className="text-gray-400 text-base">
            Real-time performance metrics with trend analysis
          </CardDescription>

          {/* Current Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg shadow-blue-500/25"></div>
              <span className="text-2xl font-bold text-white">
                {currentRating.toFixed(1)}
              </span>
              <span className="text-gray-400">current rating</span>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                ratingChange >= 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              <span>{ratingChange >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(ratingChangePercent).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Custom Select */}
        <div className="relative" ref={selectRef}>
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="flex items-center justify-between w-[180px] px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 shadow-lg"
          >
            <span className="text-sm font-medium">
              {timeRange === "all" && "All time"}
              {timeRange === "90d" && "Last 3 months"}
              {timeRange === "30d" && "Last 30 days"}
              {timeRange === "7d" && "Last 7 days"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isSelectOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isSelectOpen && (
            <div className="absolute top-full mt-2 w-full bg-gray-900/95 border border-gray-700/50 rounded-lg shadow-2xl backdrop-blur-md z-50">
              {[
                { value: "all", label: "All time" },
                { value: "90d", label: "Last 3 months" },
                { value: "30d", label: "Last 30 days" },
                { value: "7d", label: "Last 7 days" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeRange(option.value);
                    setIsSelectOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-700/50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
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
      </CardHeader>

      <CardContent className="px-2 pt-6 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[320px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              {/* More subtle gradient */}
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#475569" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#334155" stopOpacity={0.05} />
              </linearGradient>

              {/* Glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(100, 116, 139, 0.1)"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="bg-gray-800/95 border-gray-600/50 backdrop-blur-md shadow-2xl rounded-xl text-white"
                  labelClassName="text-gray-200"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            <Area
              dataKey="desktop"
              type="monotone"
              fill="url(#fillDesktop)"
              stroke="#64748b"
              strokeWidth={2}
              filter="url(#glow)"
              dot={{
                fill: "#64748b",
                strokeWidth: 2,
                stroke: "#475569",
                r: 2,
              }}
              activeDot={{
                r: 3,
                fill: "#94a3b8",
                stroke: "#475569",
                strokeWidth: 2,
              }}
            />

            <ChartLegend
              content={<ChartLegendContent className="text-gray-300" />}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
