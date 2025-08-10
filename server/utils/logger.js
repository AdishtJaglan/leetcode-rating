const logger = (req, res, next) => {
  const start = Date.now();
  const origin = req.get("Origin") || req.get("Referer") || "unknown";

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${
        res.statusCode
      } (${duration}ms) | Origin: ${origin}`
    );
  });

  next();
};

export default logger;
