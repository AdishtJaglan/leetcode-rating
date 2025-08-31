const isWeakTopicsCacheValid = (
  weakTopicsCache,
  currentSubmissionCount,
  cacheValidityHours = 6
) => {
  if (!weakTopicsCache) {
    return {
      valid: false,
      hoursSinceLastCalculation: null,
      reason: "no cache",
    };
  }

  const { result, lastCalculated, submissionCount } = weakTopicsCache;

  if (!result) {
    return {
      valid: false,
      hoursSinceLastCalculation: null,
      reason: "no result in cache",
    };
  }
  if (!lastCalculated) {
    return {
      valid: false,
      hoursSinceLastCalculation: null,
      reason: "no lastCalculated",
    };
  }

  const last = new Date(lastCalculated);
  if (Number.isNaN(last.getTime())) {
    return {
      valid: false,
      hoursSinceLastCalculation: null,
      reason: "invalid lastCalculated",
    };
  }

  const hoursSinceLastCalculation =
    (Date.now() - last.getTime()) / (1000 * 60 * 60);

  // submissionCount match check
  if (submissionCount !== currentSubmissionCount) {
    return {
      valid: false,
      hoursSinceLastCalculation,
      reason: "submission count mismatch",
    };
  }

  // freshness check
  if (hoursSinceLastCalculation >= cacheValidityHours) {
    return {
      valid: false,
      hoursSinceLastCalculation,
      reason: "cache too old",
    };
  }

  // All checks passed
  return { valid: true, hoursSinceLastCalculation, reason: "ok" };
};

export default isWeakTopicsCacheValid;
