const IDEmock = () => {
  return (
    <div className="relative max-w-5xl mx-auto group">
      {/* UPDATED: Aurora background glow effect */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-violet-600 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>

      <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* IDE Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-zinc-400 text-sm font-light">
            LeetRate IDE - /two_sum/solution.cpp
          </div>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        <div className="flex">
          {/* Main Content: Editor + Problem Details */}
          <div className="flex-grow min-w-0">
            {/* File Tabs */}
            <div className="flex border-b border-white/10">
              <div className="flex items-center gap-2 px-4 py-2 border-r border-white/10 bg-black/30 text-white">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>solution.cpp</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-zinc-400">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>main.cpp</span>
              </div>
            </div>

            {/* Code Editor */}
            <div className="p-6 font-mono text-sm bg-black/20">
              <div className="flex">
                {/* Line Numbers */}
                <div className="pr-4 text-right text-zinc-600 select-none">
                  {Array.from({ length: 18 }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code */}
                <div className="text-zinc-300 space-y-px text-left flex-grow">
                  <div>
                    <span className="text-zinc-500">#include</span>{" "}
                    <span className="text-orange-400">&lt;vector&gt;</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">#include</span>{" "}
                    <span className="text-orange-400">
                      &lt;unordered_map&gt;
                    </span>
                  </div>
                  <div className="h-4"></div>
                  <div>
                    <span className="text-violet-400">class</span>{" "}
                    <span className="text-cyan-400">Solution</span> {"{"}
                  </div>
                  <div>
                    <span className="text-blue-400 ml-4">public:</span>
                  </div>
                  <div>
                    {" "}
                    <span className="text-cyan-400 ml-4">
                      std::vector&lt;int&gt;
                    </span>{" "}
                    <span className="text-green-400">twoSum</span>(
                  </div>
                  <div>
                    {"    "}
                    <span className="text-cyan-400">
                      std::vector&lt;int&gt;
                    </span>
                    &amp; <span className="text-orange-300">nums</span>,{" "}
                    <span className="text-cyan-400">int</span>{" "}
                    <span className="text-orange-300">target</span>
                  </div>
                  <div>
                    {"  "}) {"{"}
                  </div>
                  <div>
                    <span className="text-cyan-400 ml-8">
                      std::unordered_map&lt;int, int&gt;
                    </span>{" "}
                    <span className="text-red-400/80">map</span>;
                  </div>
                  <div className="h-4"></div>
                  <div>
                    {"    "}
                    <span className="text-violet-400">for</span> (
                    <span className="text-cyan-400">int</span> i = 0; i &lt;{" "}
                    <span className="text-red-400/80">nums</span>.
                    <span className="text-yellow-400">size</span>(); ++i) {"{"}
                  </div>
                  <div>
                    <span className="text-cyan-400 ml-12">int</span> complement
                    = <span className="text-orange-300">target</span> -{" "}
                    <span className="text-red-400/80">nums</span>[i];
                  </div>
                  <div>
                    <span className="ml-12 text-violet-400">if</span> (
                    <span className="text-red-400/80">map</span>.
                    <span className="text-yellow-400">count</span>
                    (complement)) {"{"}
                  </div>
                  <div>
                    <span className="ml-16 text-violet-400">return</span> {"{"}
                    <span className="text-red-400/80">map</span>
                    [complement], i{"}"};
                  </div>
                  <div>
                    <span className="ml-12">{"}"}</span>
                  </div>
                  <div>
                    <span className="ml-12 text-red-400/80">map</span>[
                    <span className="text-red-400/80">nums</span>[i]] = i;
                  </div>
                  <div>
                    <span className="ml-8">{"}"}</span>
                  </div>
                  <div>
                    <span className="ml-4 text-violet-400">return</span> {"{}"};{" "}
                    <span className="text-zinc-500">// No solution found</span>
                  </div>
                  <div>
                    <span className="ml-4">{"}"}</span>;
                  </div>
                  <div>{"};"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: Problem Details */}
          <div className="w-64 border-l border-white/10 bg-zinc-900/50 p-4">
            <div className="text-lg font-bold text-white mb-4">
              Problem Details
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Status</span>
                <span className="text-green-400 font-semibold">Accepted</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Difficulty</span>
                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-bold">
                  MEDIUM
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">LeetRate</span>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-blue-400">1847</span>
                </div>
              </div>
              <div className="w-full h-px bg-white/10 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Acceptance</span>
                <span className="text-cyan-400">51.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Runtime</span>
                <span className="text-white">4 ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Memory</span>
                <span className="text-white">11.2 MB</span>
              </div>
              <div className="w-full h-px bg-white/10 my-3"></div>
              <div className="text-zinc-400">Tags</div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-zinc-700/50 px-2 py-0.5 rounded text-xs text-zinc-300">
                  Array
                </span>
                <span className="bg-zinc-700/50 px-2 py-0.5 rounded text-xs text-zinc-300">
                  Hash Table
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Terminal */}
        <div className="border-t border-white/10 bg-black/30 p-4 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">&gt;</span>
            <span>g++ -std=c++17 solution.cpp -o solution</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">&gt;</span>
            <span className="text-yellow-400">[LeetRate]</span>
            <span> Compilation successful.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">&gt;</span>
            <span className="text-yellow-400">[LeetRate]</span>
            <span> Running tests... </span>
            <span className="text-cyan-400">Passed (2/2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDEmock;
