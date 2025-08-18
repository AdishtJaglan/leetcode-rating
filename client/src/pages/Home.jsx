import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DotPattern } from "@/components/magicui/dot-pattern";
import Features from "@/components/Features";
import IDEmock from "@/components/IDEmock";
import ProfessionalStats from "@/components/Stat";
import { cn } from "@/lib/utils";
import {
  Code,
  Chrome,
  Github,
  ChevronRight,
  Download,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {}, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Glossy overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/20 pointer-events-none" />

      {/* UPDATED: Subtle animated background elements with color */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-6 backdrop-blur-sm border-b border-white/10">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-black rounded-xl flex items-center justify-center border border-white/20 shadow-lg backdrop-blur-sm">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              LeetRate
            </span>
          </div>
          <div className="flex items-center space-x-8">
            <a
              href="#features"
              className="text-zinc-400 hover:text-white transition-all duration-300 font-medium"
            >
              Features
            </a>
            <a
              href="#stats"
              className="text-zinc-400 hover:text-white transition-all duration-300 font-medium"
            >
              Stats
            </a>
            {/* UPDATED: Added a colored shadow on hover for the button */}
            <button
              onClick={() => navigate("/verification")}
              className="bg-gradient-to-r from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900 px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20 backdrop-blur-sm font-medium shadow-lg hover:shadow-blue-500/20"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Hero badge */}
            <div className="inline-flex items-center space-x-2 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
              {/* UPDATED: Used a color from your streak palette */}
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-zinc-300">
                Trusted by 50,000+ developers
              </span>
            </div>
            {/* UPDATED: More vibrant gradient text */}
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
              Stop Guessing,
              <br />
              <span className="bg-gradient-to-r from-white via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Start Knowing
              </span>
            </h1>
            <DotPattern
              className={cn(
                "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
                "inset-x-0 -inset-y-36 min-h-screen -z-50"
              )}
            />
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Transform your LeetCode experience with real difficulty ratings,
              comprehensive analytics, and powerful insights that help you code
              smarter, not harder.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              {/* UPDATED: Added colored hover shadow */}
              <button className="group bg-gradient-to-r from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900 px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-white/20 backdrop-blur-sm flex items-center space-x-3 shadow-2xl hover:shadow-cyan-500/20">
                <Chrome className="w-6 h-6" />
                <span>Add to Chrome</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-zinc-900/50 hover:bg-zinc-800/50 backdrop-blur-sm border-2 border-white/10 hover:border-white/20 px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-lg flex items-center space-x-3">
                <Github className="w-6 h-6" />
                <span>View on GitHub</span>
              </button>
            </div>
          </div>

          <IDEmock />
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Stats Section */}
      <ProfessionalStats />

      {/* How it Works */}
      <section className="relative z-10 px-6 py-24 bg-zinc-950/80 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto font-light">
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
                  "Add LeetRate to your Chrome browser with one click.",
                icon: <Download className="w-7 h-7 text-white" />,
                // UPDATED: Colorful gradient
                color: "from-cyan-500 to-blue-500",
              },
              {
                step: "02",
                title: "Get Your Tokens",
                description:
                  "Our extension automatically extracts session & CSRF tokens.",
                icon: <Zap className="w-7 h-7 text-white" />,
                // UPDATED: Colorful gradient
                color: "from-orange-500 to-yellow-400",
              },
              {
                step: "03",
                title: "Activate Account",
                description:
                  "Enter your tokens on our platform to unlock full analytics.",
                icon: <CheckCircle className="w-7 h-7 text-white" />,
                // UPDATED: Colorful gradient
                color: "from-green-500 to-lime-400",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-sm rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10">
                  <div className="text-6xl font-black text-white/10 mb-6">
                    {item.step}
                  </div>
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-8 border border-white/20 backdrop-blur-sm shadow-lg`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* UPDATED: Added colored border */}
          <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm rounded-3xl p-16 border border-green-500/20">
            {/* UPDATED: Colorful gradient text */}
            <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tight bg-gradient-to-r from-green-300 via-white to-green-300 bg-clip-text text-transparent">
              Ready to Code Smarter?
            </h2>
            <p className="text-xl text-zinc-300 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Join thousands of developers who have transformed their LeetCode
              experience. Get real insights, track your progress, and master
              algorithms like never before.
            </p>
            {/* UPDATED: Colorful hover shadow */}
            <button className="group bg-gradient-to-r from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900 px-12 py-6 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 border border-white/20 backdrop-blur-sm flex items-center space-x-4 mx-auto shadow-2xl hover:shadow-green-500/20">
              <Chrome className="w-7 h-7" />
              <span>Add to Chrome - It's Free</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-zinc-500 text-sm mt-6 font-light">
              No signup required • Works instantly • Open source
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-800 to-black rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              LeetRate
            </span>
          </div>
          <p className="text-zinc-600 font-light">
            © 2025 LeetRate. Making LeetCode better, one problem at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
