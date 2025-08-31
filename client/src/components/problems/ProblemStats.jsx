/* eslint-disable no-unused-vars */
import React, {
  useMemo,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { motion, animate, AnimatePresence } from "framer-motion";

const useProblemStatsCalculator = (solvedCount = 0, total = 0) => {
  return useMemo(() => {
    const percentage = total > 0 ? (solvedCount / total) * 100 : 0;
    return {
      solvedPercentage: Math.round(percentage),
    };
  }, [solvedCount, total]);
};

const defaultTheme = {
  colors: {
    solved: "text-green-400",
    total: "text-gray-300",
    separator: "text-gray-500",
    percentage: "text-gray-400",
    progressBar: "bg-green-500",
    progressTrack: "bg-gray-800",
  },
  animation: {
    numberSpring: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.8,
    },
    progressBar: { duration: 0.8, ease: "easeOut" },
  },
};

const StatsThemeContext = createContext(defaultTheme);
const useStatsTheme = () => useContext(StatsThemeContext);

const AnimatedNumber = React.memo(({ value, ...rest }) => {
  const ref = useRef(null);
  const { animation } = useStatsTheme();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(parseFloat(node.textContent || 0), value, {
      ...animation.numberSpring,
      onUpdate(latest) {
        node.textContent = Math.round(latest).toString();
      },
    });

    return () => controls.stop();
  }, [value, animation.numberSpring]);

  return <span ref={ref} {...rest} />;
});

const ThemedProgressBar = React.memo(({ percentage }) => {
  const { colors, animation } = useStatsTheme();
  return (
    <div
      className={`w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden ${colors.progressTrack}`}
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={percentage}
    >
      <motion.div
        className={`h-1.5 rounded-full ${colors.progressBar}`}
        initial={{ width: "0%" }}
        animate={{ width: `${percentage}%` }}
        transition={animation.progressBar}
      />
    </div>
  );
});

const SkeletonLoader = React.memo(() => (
  <motion.div
    key="skeleton"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-3"
  >
    <div className="animate-pulse flex items-center gap-3">
      <div className="w-6 h-6 bg-gray-800 rounded"></div>
      <div className="w-16 h-3 bg-gray-800 rounded"></div>
      <div className="w-12 h-2 bg-gray-800 rounded-full"></div>
    </div>
  </motion.div>
));

const StatsContentView = ({ problemData }) => {
  const { solvedCount, total } = problemData;
  const { solvedPercentage } = useProblemStatsCalculator(solvedCount, total);
  const { colors } = useStatsTheme();

  return (
    <motion.div
      key="content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4"
    >
      <div className="flex items-baseline gap-1 text-sm">
        <AnimatedNumber
          value={solvedCount}
          className={`${colors.solved} font-medium`}
        />
        <span className={`${colors.separator} text-xs`}>/</span>
        <AnimatedNumber value={total} className={colors.total} />
      </div>

      <ThemedProgressBar percentage={solvedPercentage} />

      <div className="flex items-center text-xs text-gray-400 font-mono min-w-[2.5rem] justify-end">
        <AnimatedNumber
          value={solvedPercentage}
          className={colors.percentage}
        />
        <span className={colors.percentage}>%</span>
      </div>
    </motion.div>
  );
};

const ProblemStats = ({ problemData }) => {
  const showContent = problemData && Object.keys(problemData).length > 0;

  return (
    <StatsThemeContext.Provider value={defaultTheme}>
      <div className="flex items-center gap-4 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 py-4.5 min-h-[58px] min-w-[210px]">
        <AnimatePresence mode="wait">
          {showContent ? (
            <StatsContentView problemData={problemData} />
          ) : (
            <SkeletonLoader />
          )}
        </AnimatePresence>
      </div>
    </StatsThemeContext.Provider>
  );
};

export default ProblemStats;
