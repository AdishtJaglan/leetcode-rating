import React, { useState, useEffect, useRef } from "react";

const ProfessionalStats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0]);
  const sectionRef = useRef(null);

  const stats = [
    {
      id: 0,
      finalValue: 50000,
      suffix: "+",
      label: "Active Developers",
      description: "Trusted by engineering teams worldwide",
    },
    {
      id: 1,
      finalValue: 99.9,
      suffix: "%",
      label: "Uptime",
      description: "Enterprise-grade reliability",
    },
    {
      id: 2,
      finalValue: 2.5,
      suffix: "M",
      label: "Problems Solved",
      description: "Lines of code debugged and optimized",
    },
  ];

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    if (isVisible) {
      stats.forEach((stat, index) => {
        const duration = 1500;
        const steps = 50;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          const progress = step / steps;
          const easeOut = 1 - Math.pow(1 - progress, 2);
          const current = stat.finalValue * easeOut;

          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = current;
            return newValues;
          });

          if (step >= steps) {
            clearInterval(interval);
          }
        }, duration / steps);
      });
    }
  }, [isVisible]);

  const formatValue = (value, suffix) => {
    if (suffix === "M") {
      return (value / 1000000).toFixed(1) + suffix;
    } else if (suffix === "%") {
      return value.toFixed(1) + suffix;
    } else {
      return Math.floor(value).toLocaleString() + suffix;
    }
  };

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-20 transition-all duration-800 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
            Trusted by developers worldwide
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-normal">
            Join thousands of engineering teams who rely on our platform for
            their daily workflow
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-16">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`text-center transition-all duration-800 delay-${
                index * 100
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {/* Value */}
              <div className="mb-3">
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {formatValue(animatedValues[index] || 0, stat.suffix)}
                </div>
              </div>

              {/* Label */}
              <div className="mb-2">
                <div className="text-zinc-300 text-lg font-medium">
                  {stat.label}
                </div>
              </div>

              {/* Description */}
              <div className="text-zinc-500 text-sm font-normal leading-relaxed">
                {stat.description}
              </div>

              {/* Subtle divider */}
              <div className="mt-6 mx-auto w-12 h-px bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div
          className={`text-center mt-20 transition-all duration-800 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-zinc-500 text-sm">
            Updated in real-time • Enterprise security • 24/7 support
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProfessionalStats;
