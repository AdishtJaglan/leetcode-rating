import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Code,
  BarChart3,
  Star,
  Download,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Github,
  Chrome,
} from "lucide-react";

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Real Ratings",
      description:
        "See actual difficulty ratings instead of vague Easy/Medium/Hard labels",
      gradient: "from-cyan-400 to-blue-500",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description:
        "Visualize your progress with detailed charts and statistics",
      gradient: "from-violet-500 to-pink-500",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Track Progress",
      description:
        "Monitor your solving patterns and favorite topics over time",
      gradient: "from-emerald-400 to-cyan-500",
    },
  ];

  const stats = [
    {
      label: "Active Users",
      value: "10K+",
      icon: <Star className="w-5 h-5" />,
    },
    {
      label: "Problems Analyzed",
      value: "3K+",
      icon: <Code className="w-5 h-5" />,
    },
    { label: "Hours Saved", value: "25K+", icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              LeetRate
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="#features"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#stats"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              Stats
            </a>
            <button
              onClick={() => navigate("/verification")}
              className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Stop Guessing,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Start Knowing
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your LeetCode experience with real difficulty ratings,
              comprehensive analytics, and powerful insights that help you code
              smarter, not harder.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50 flex items-center space-x-2">
                <Chrome className="w-5 h-5" />
                <span>Add to Chrome</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group border-2 border-gray-700 hover:border-cyan-400 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center space-x-2">
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </button>
            </div>

            {/* Preview mockup */}
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-900 to-slate-900 rounded-2xl p-8 shadow-2xl border border-gray-800 shadow-cyan-500/10">
                <div className="bg-black rounded-xl p-6 font-mono text-sm border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500"># LeetCode Problem</span>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gradient-to-r from-orange-400 to-red-500 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg shadow-orange-500/25">
                        Rating: 1847
                      </span>
                    </div>
                  </div>
                  <div className="text-cyan-400">def twoSum(nums, target):</div>
                  <div className="text-gray-300 ml-4">hashmap = {}</div>
                  <div className="text-gray-300 ml-4">
                    for i, num in enumerate(nums):
                  </div>
                  <div className="text-gray-300 ml-8">
                    complement = target - num
                  </div>
                  <div className="text-emerald-400 ml-8">
                    # Know the exact difficulty!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 px-6 py-20 bg-gray-950/80 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                LeetRate?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get the insights you need to level up your coding game with
              precision and style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-500 hover:transform hover:scale-105 ${
                  activeFeature === index
                    ? "ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/25"
                    : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-violet-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gray-900/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-12 border border-gray-800 shadow-2xl shadow-cyan-500/10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by Developers Worldwide
              </h2>
              <p className="text-gray-400 text-lg">
                Join thousands who have already upgraded their coding experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 px-6 py-20 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple setup, powerful results. Here's how to unlock your coding
              potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Install Extension",
                description:
                  "Add LeetRate to your Chrome browser with one click",
                icon: <Download className="w-6 h-6" />,
                color: "from-cyan-500 to-blue-600",
              },
              {
                step: "02",
                title: "Get Your Tokens",
                description:
                  "Extension automatically extracts session & CSRF tokens from LeetCode",
                icon: <Zap className="w-6 h-6" />,
                color: "from-violet-500 to-purple-600",
              },
              {
                step: "03",
                title: "Activate Account",
                description:
                  "Enter your tokens on our platform to unlock full analytics",
                icon: <CheckCircle className="w-6 h-6" />,
                color: "from-emerald-500 to-cyan-600",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10">
                  <div className="text-4xl font-bold text-cyan-500/30 mb-4">
                    {item.step}
                  </div>
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-12 border border-blue-500/30">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Code Smarter?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of developers who have transformed their LeetCode
              experience. Get real insights, track your progress, and master
              algorithms like never before.
            </p>
            <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-3 mx-auto">
              <Chrome className="w-6 h-6" />
              <span>Add to Chrome - It's Free</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-4">
              No signup required • Works instantly • Open source
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              LeetRate
            </span>
          </div>
          <p className="text-gray-500">
            © 2024 LeetRate. Making LeetCode better, one problem at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
