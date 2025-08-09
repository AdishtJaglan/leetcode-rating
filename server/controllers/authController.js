import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;
const VERIF_TOKEN_EXPIRES = "15m";
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, opts);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * POST /auth/verify-leetcode
 * body: { sessionToken, csrfToken }
 * -> Verifies the session with LeetCode, upserts the user and issues a short-lived verifToken.
 */
export const verifySessionAndCsrfTokens = async (req, res, next) => {
  try {
    const { sessionToken, csrfToken } = req.body;
    if (!sessionToken || !csrfToken) {
      return res
        .status(400)
        .json({ message: "sessionToken & csrfToken required" });
    }

    const url = "https://leetcode.com/graphql/";
    const body = {
      query: `
        query globalData {
          userStatus {
            username
            avatar
          }
        }
      `,
      variables: {},
      operationName: "globalData",
    };

    const headers = {
      "Content-Type": "application/json",
      Origin: "https://leetcode.com",
      "X-CSRFToken": csrfToken,
      Cookie: `LEETCODE_SESSION=${sessionToken};`,
    };

    let data;
    try {
      const resp = await axios.post(url, body, { headers });
      data = resp?.data?.data;
      console.log(resp?.data);
      if (!data || !data.userStatus || !data.userStatus.username) {
        return res
          .status(401)
          .json({ message: "LeetCode verification failed" });
      }
    } catch (err) {
      console.error("LeetCode API error", err?.response?.data || err.message);
      return res
        .status(502)
        .json({ message: "Failed to verify with LeetCode" });
    }

    const username = data.userStatus.username;
    const avatar = data.userStatus.avatar || null;

    const user = await User.findOneAndUpdate(
      { leetcodeUserName: username },
      {
        $set: {
          sessionToken,
          csrfToken,
          leetcodeAvatar: avatar,
        },
        $setOnInsert: {
          leetcodeUserName: username,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const verifToken = signJwt(
      {
        sub: user._id,
        username: user.leetcodeUserName,
        purpose: "verify-leetcode",
      },
      { expiresIn: VERIF_TOKEN_EXPIRES }
    );

    return res.status(200).json({
      message: "LeetCode verified",
      verifToken,
      username: user.leetcodeUserName,
      avatar: user.leetcodeAvatar,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/link
 * body: { token: verifToken, email, password }
 * -> Verifies token, sets hashed password on user, enables local auth, issues access+refresh tokens.
 */
export const linkAccount = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.purpose !== "verify-leetcode") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    const userId = payload.sub;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const refreshTokenPlain = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshTokenPlain);
    const refreshExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    user.email = email.toLowerCase();
    user.passwordHash = passwordHash;
    user.localAuthEnabled = true;
    user.passwordSetAt = new Date();
    user.authMethods = Array.isArray(user.authMethods)
      ? Array.from(new Set([...user.authMethods, "local"]))
      : ["local", ...(user.authMethods || [])];
    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiry = refreshExpiry;
    await user.save();

    const accessToken = signJwt(
      { sub: user._id, username: user.leetcodeUserName, purpose: "auth" },
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    return res.status(200).json({
      message: "Account linked successfully",
      accessToken,
      refreshToken: refreshTokenPlain,
      user: {
        _id: user._id,
        leetcodeUserName: user.leetcodeUserName,
        email: user.email,
        leetcodeAvatar: user.leetcodeAvatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * body: { identifier, password }
 * - identifier can be email OR leetcodeUserName
 * - returns { accessToken, refreshToken, user }
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "identifier & password required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { leetcodeUserName: identifier },
      ],
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const refreshTokenPlain = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshTokenPlain);
    const refreshExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiry = refreshExpiry;
    await user.save();

    const accessToken = signJwt(
      { sub: user._id, username: user.leetcodeUserName, purpose: "auth" },
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    return res.status(200).json({
      message: "Logged in",
      accessToken,
      refreshToken: refreshTokenPlain,
      user: {
        _id: user._id,
        leetcodeUserName: user.leetcodeUserName,
        email: user.email,
        leetcodeAvatar: user.leetcodeAvatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 * body: { refreshToken }
 * - verifies hashed refresh token, expiry, and rotates tokens (safer)
 * - returns { accessToken, refreshToken }
 */
export const refreshAuth = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "refreshToken required" });

    const hashed = hashToken(refreshToken);
    const user = await User.findOne({
      refreshTokenHash: hashed,
      refreshTokenExpiry: { $gt: new Date() },
    });
    if (!user)
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });

    const newRefreshPlain = crypto.randomBytes(64).toString("hex");
    const newRefreshHash = hashToken(newRefreshPlain);
    const newExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    user.refreshTokenHash = newRefreshHash;
    user.refreshTokenExpiry = newExpiry;
    await user.save();

    const accessToken = signJwt(
      { sub: user._id, username: user.leetcodeUserName, purpose: "auth" },
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    return res.status(200).json({
      message: "Token refreshed",
      accessToken,
      refreshToken: newRefreshPlain,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 * body: { refreshToken }  OR (optional) Authorization header to identify user
 * - clears refresh token (invalidates)
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return res
          .status(400)
          .json({ message: "refreshToken or Authorization header required" });
      }

      try {
        const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (user) {
          user.refreshTokenHash = null;
          user.refreshTokenExpiry = null;
          await user.save();
        }
        return res.status(200).json({ message: "Logged out" });
      } catch (e) {
        return res.status(400).json({ message: "Invalid token" });
      }
    }

    const hashed = hashToken(refreshToken);
    const user = await User.findOne({ refreshTokenHash: hashed });
    if (!user) {
      return res.status(200).json({ message: "Logged out" });
    }

    user.refreshTokenHash = null;
    user.refreshTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
