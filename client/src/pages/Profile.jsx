/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { ChartAreaInteractive } from "@/components/HeroChart";
import QuestionList from "@/components/QuestionList";
import Navbar from "@/components/Navbar";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [chartData, setChartData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [paginationData, setPaginationData] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Authentication error.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [ratingRes, solvedRes] = await Promise.all([
          axios.get(`${API_URL}/user/rating-daily`, config),
          axios.get(`${API_URL}/problem/solved-problems`, config),
        ]);

        setChartData(ratingRes.data?.questions ?? []);
        setQuestionData(solvedRes.data?.data ?? []);
        setPaginationData(solvedRes.data?.meta ?? {});
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    getData();
  }, []);

  return (
    <div className="min-h-screen bg-black p-4">
      <Navbar />
      <ChartAreaInteractive data={chartData} />
      <QuestionList data={questionData} />
    </div>
  );
};

export default Profile;
