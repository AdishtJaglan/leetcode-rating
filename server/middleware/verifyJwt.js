import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJwt(requiredPurpose = "auth") {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Missing or invalid Authorization header" });
      }

      const token = authHeader.split(" ")[1];

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      if (requiredPurpose && payload.purpose !== requiredPurpose) {
        return res.status(403).json({ message: "Invalid token purpose" });
      }

      req.user = payload;
      next();
    } catch (err) {
      console.error("JWT verification error (outer):", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
