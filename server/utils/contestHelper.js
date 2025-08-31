import axios from "axios";

// this contest need contest slug & will give us data which tells use which all questions
// were solved by the user for that given contest
export const fetchContestQuestions = async ({
  sessionCookie,
  csrfToken,
  contestSlug,
}) => {
  if (!sessionCookie) throw new Error("sessionCookie is required");

  const payload = {
    operationName: "contestQuestionList",
    query: `
      query contestQuestionList($contestSlug: String!) {
        contestQuestionList(contestSlug: $contestSlug) {
          isAc
          credit
          title
          titleSlug
          questionId
        }
      }
    `,
    variables: { contestSlug },
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Cookie: `LEETCODE_SESSION=${sessionCookie}`,
    "x-csrftoken": csrfToken,
    Origin: "https://leetcode.com",
    Referer: `https://leetcode.com/contest/${contestSlug}/`,
  };

  const url = "https://leetcode.com/graphql/";

  try {
    const { data } = await axios.post(url, payload, { headers });
    return data?.data?.contestQuestionList;
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      throw new Error(
        `LeetCode request failed: ${status} - ${JSON.stringify(data)}`
      );
    }
    throw err;
  }
};

// this function tells us all the contests which were attended by the user
export const getAttendedContests = async ({
  sessionCookie,
  csrfToken,
  username,
}) => {
  if (!sessionCookie) throw new Error("sessionCookie is required");
  if (!csrfToken) throw new Error("csrfToken is required");
  if (!username) throw new Error("username is required");

  const payload = {
    operationName: "userContestRankingHistory",
    query: `
      query userContestRankingHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest { title startTime }
        }
      }
    `,
    variables: { username },
  };

  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json",
    "x-csrftoken": csrfToken,
    Cookie: `LEETCODE_SESSION=${sessionCookie}`,
  };

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql/",
      payload,
      {
        headers,
      }
    );
    const history = data?.data?.userContestRankingHistory ?? [];
    if (!Array.isArray(history)) return [];
    return history.filter((entry) => entry?.attended === true);
  } catch (err) {
    if (err.response) {
      throw new Error(
        `LeetCode request failed: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
    }
    throw err;
  }
};
