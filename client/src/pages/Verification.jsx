import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AuthFlow = () => {
  const [authState, setAuthState] = useState("checking"); // checking, needsLogin, needsLeetCode, needsCredentials, authenticated
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [leetcodeData, setLeetcodeData] = useState({
    sessionToken: "",
    csrfToken: "",
  });
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [verificationToken, setVerificationToken] = useState("");

  // Check for existing refresh token on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        setAuthState("needsLeetCode");
        return;
      }

      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        setAuthState("authenticated");
      }
    } catch (err) {
      console.error("Refresh token verification failed:", err);
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessToken");
      setAuthState("needsLeetCode");
    } finally {
      setLoading(false);
    }
  };

  const handleLeetCodeVerification = async (e) => {
    e.preventDefault();
    if (!leetcodeData.sessionToken || !leetcodeData.csrfToken) {
      setError("Please enter both session token and CSRF token");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${API_URL}/auth/verify-leetcode`, {
        sessionToken: leetcodeData.sessionToken,
        csrfToken: leetcodeData.csrfToken,
      });
      if (response.status === 200) {
        const { verifToken, username, avatar } = response.data;
        setVerificationToken(verifToken);
        setUser({ username, avatar });
        setAuthState("needsCredentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || "LeetCode verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLink = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${API_URL}/auth/link`, {
        token: verificationToken,
        email: credentials.email,
        password: credentials.password,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken, user: userData } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        setUser(userData);
        setAuthState("authenticated");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Account linking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setAuthState("needsLeetCode");
    setLeetcodeData({ sessionToken: "", csrfToken: "" });
    setCredentials({ email: "", password: "" });
    setVerificationToken("");
  };

  // Loading screen
  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Authenticated state
  if (authState === "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center shadow-lg shadow-cyan-400/10">
          <div className="mb-6">
            {user?.leetcodeAvatar && (
              <img
                src={user.leetcodeAvatar}
                alt="Profile"
                className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-cyan-400 shadow-lg shadow-cyan-400/25"
              />
            )}
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-400">@{user?.leetcodeUserName}</p>
            {user?.email && (
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-400 to-violet-400 p-4 rounded-xl text-black font-semibold">
              🎯 Ready to analyze LeetCode problems!
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors border border-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center p-4">
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-lg shadow-cyan-400/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-2xl flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4 shadow-lg shadow-cyan-400/25">
            LC
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            LeetCode Analytics
          </h1>
          <p className="text-gray-400">
            Get insights and ratings for every problem
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-400 text-red-400 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* LeetCode Token Form */}
        {authState === "needsLeetCode" && (
          <form onSubmit={handleLeetCodeVerification} className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                LeetCode Session Token
              </label>
              <input
                type="text"
                value={leetcodeData.sessionToken}
                onChange={(e) =>
                  setLeetcodeData((prev) => ({
                    ...prev,
                    sessionToken: e.target.value,
                  }))
                }
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                placeholder="Enter your LeetCode session token"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                CSRF Token
              </label>
              <input
                type="text"
                value={leetcodeData.csrfToken}
                onChange={(e) =>
                  setLeetcodeData((prev) => ({
                    ...prev,
                    csrfToken: e.target.value,
                  }))
                }
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                placeholder="Enter your CSRF token"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-bold py-3 px-4 rounded-xl hover:from-cyan-500 hover:to-violet-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/25"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify LeetCode Account"
              )}
            </button>

            <div className="text-center text-gray-500 text-sm">
              <p>Need help finding your tokens?</p>
              <a
                href="#"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View instructions →
              </a>
            </div>
          </form>
        )}

        {/* Credentials Form */}
        {authState === "needsCredentials" && user && (
          <div className="space-y-6">
            <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-center space-x-3 mb-2">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-cyan-400"
                  />
                )}
                <div>
                  <p className="text-white font-semibold">@{user.username}</p>
                  <p className="text-green-400 text-sm">✓ LeetCode Verified</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAccountLink} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                  placeholder="Create a password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-bold py-3 px-4 rounded-xl hover:from-cyan-500 hover:to-violet-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/25"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthFlow;
