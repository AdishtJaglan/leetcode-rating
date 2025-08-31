/* eslint-disable no-unused-vars */
import { BarChart, Users, Cpu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const featureVisuals = {
  RATING: "RATING",
  COMMUNITY: "COMMUNITY",
  ANALYTICS: "ANALYTICS",
};

const features = [
  {
    icon: <BarChart className="w-6 h-6 text-white" />,
    title: "Accurate Difficulty Ratings",
    description:
      "Go beyond Easy, Medium, and Hard. Get precise numerical ratings for every problem.",
    gradient: "from-blue-500 to-cyan-400",
    visual: featureVisuals.RATING,
  },
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Community-Powered Insights",
    description:
      "Ratings are generated from thousands of users, providing a real-time, accurate measure.",
    gradient: "from-violet-500 to-orange-400",
    visual: featureVisuals.COMMUNITY,
  },
  {
    icon: <Cpu className="w-6 h-6 text-white" />,
    title: "Performance Analytics",
    description:
      "Track your progress with detailed analytics, strengths, and weaknesses across topics.",
    gradient: "from-green-500 to-yellow-400",
    visual: featureVisuals.ANALYTICS,
  },
];

const RatingVisual = () => {
  const containerVariants = {
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const barVariants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: {
      scaleY: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };
  const bars = ["h-1/4", "h-1/3", "h-3/4", "h-2/3", "h-1/2", "h-1/3"];
  const colors = [
    "from-green-500/50 to-green-500",
    "from-cyan-500/50 to-cyan-500",
    "from-blue-500/50 to-blue-500",
    "from-violet-500/50 to-violet-500",
    "from-orange-500/50 to-orange-500",
    "from-red-500/50 to-red-500",
  ];

  return (
    <>
      <div className="text-center font-semibold text-white mb-4">
        Problem Rating Distribution
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="h-full flex items-end justify-center gap-2"
      >
        {bars.map((height, i) => (
          <motion.div
            key={i}
            variants={barVariants}
            className={`w-8 bg-gradient-to-t rounded-t-lg ${height} ${colors[i]}`}
            style={{ transformOrigin: "bottom" }}
          />
        ))}
      </motion.div>
    </>
  );
};

const CommunityVisual = () => {
  const containerVariants = {
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-full flex items-center justify-center"
    >
      <motion.div
        variants={cardVariants}
        className="absolute w-64 p-4 bg-zinc-800/50 backdrop-blur rounded-xl border border-white/10 shadow-lg"
        style={{ transform: "rotate(3deg)" }}
      >
        <p className="text-lg font-bold text-violet-400">Candidate Master</p>
        <p className="text-sm text-zinc-300">Rating: 2014</p>
      </motion.div>
      <motion.div
        variants={cardVariants}
        className="relative w-64 p-4 bg-zinc-800/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl z-10"
      >
        <p className="text-lg font-bold text-blue-400">Expert</p>
        <p className="text-sm text-zinc-300">Rating: 1847</p>
      </motion.div>
      <motion.div
        variants={cardVariants}
        className="absolute w-64 p-4 bg-zinc-800/50 backdrop-blur rounded-xl border border-white/10 shadow-lg"
        style={{ transform: "rotate(-3deg)" }}
      >
        <p className="text-lg font-bold text-cyan-400">Specialist</p>
        <p className="text-sm text-zinc-300">Rating: 1550</p>
      </motion.div>
    </motion.div>
  );
};

const AnalyticsVisual = () => (
  <>
    <div className="text-center font-semibold text-white mb-4">
      Your Progress
    </div>
    <div className="h-1/2 flex items-end border-b border-l border-white/10 p-4">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 0 40 C 20 10, 40 50, 60 20 C 80 0, 90 30, 100 5"
          stroke="#00f5d4"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="mt-6"
    >
      <p className="text-sm text-zinc-300 font-medium">Strengths</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-xs">
          Dynamic Programming
        </span>
        <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-xs">
          Arrays
        </span>
      </div>
    </motion.div>
  </>
);

const visualizerComponents = {
  [featureVisuals.RATING]: <RatingVisual />,
  [featureVisuals.COMMUNITY]: <CommunityVisual />,
  [featureVisuals.ANALYTICS]: <AnalyticsVisual />,
};

const FeatureCard = ({ feature, isActive, setActiveFeature }) => {
  return (
    <motion.div
      onClick={() => setActiveFeature(feature)}
      className="relative p-6 lg:p-8 rounded-3xl cursor-pointer h-full"
      animate={{
        backgroundColor: isActive
          ? "rgba(39, 39, 42, 0.8)"
          : "rgba(39, 39, 42, 0.4)",
      }}
      whileHover={{ scale: 1.03, backgroundColor: "rgba(39, 39, 42, 0.6)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${feature.gradient}`}
        animate={{ opacity: isActive ? 0.4 : 0 }}
        transition={{ duration: 0.4 }}
      />
      <div className="relative">
        <motion.div
          className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 border border-white/20 shadow-lg`}
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {feature.icon}
        </motion.div>
        <h3 className="text-lg lg:text-xl font-bold mb-3 text-white">
          {feature.title}
        </h3>
        <p className="text-zinc-400 leading-relaxed font-light text-sm lg:text-base">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};

const Features = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);

  return (
    <section
      id="features"
      className="relative z-10 px-6 py-24 bg-zinc-950/80 backdrop-blur-sm border-t border-white/5 overflow-hidden"
    >
      {/* Background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-gradient-to-tr from-violet-600/20 via-blue-600/20 to-green-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            An Unfair Advantage
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto font-light">
            LeetRate isn't just a tool—it's a complete ecosystem designed to
            give you the edge.
          </p>
        </div>

        {/* --- Bento Grid Container --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-3 gap-8">
          {/* Visualizer Box (Top-Left, takes up 2x2 space) */}
          <div className="lg:col-span-2 lg:row-span-2 relative min-h-[32rem] bg-black/40 rounded-3xl border border-white/10 p-8 shadow-inner overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.visual}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  transition: { duration: 0.3, ease: "easeIn" },
                }}
                className="w-full h-full"
              >
                {visualizerComponents[activeFeature.visual]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Feature Card 1 (Top-Right) */}
          <FeatureCard
            feature={features[0]}
            isActive={activeFeature.title === features[0].title}
            setActiveFeature={setActiveFeature}
          />

          {/* Feature Card 2 (Middle-Right) */}
          <FeatureCard
            feature={features[1]}
            isActive={activeFeature.title === features[1].title}
            setActiveFeature={setActiveFeature}
          />

          {/* Feature Card 3 (Bottom-Left) */}
          <FeatureCard
            feature={features[2]}
            isActive={activeFeature.title === features[2].title}
            setActiveFeature={setActiveFeature}
          />

          {/* Call-to-Action Card (Bottom-Middle, spans 2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-2 relative p-8 rounded-3xl bg-zinc-900/40 border border-white/10 flex items-center justify-center"
          >
            <div className="relative text-center">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Ready to Level Up?
              </h3>
              <p className="text-zinc-400 mb-6">
                Stop guessing and start improving with data-driven insights.
                Join LeetRate today.
              </p>
              <button className="font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:opacity-90 transition-opacity rounded-full py-3 px-8">
                Get Started
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
