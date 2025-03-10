import './GraphCard.css';
import LineChart from '../Components/LineChart';
import GraphControls from '../Components/GraphControls';
import { useEffect, useState } from "react";
import { getListeningData, getEarliestDate } from "../getListeningData";
import { chartListeningData } from "../chartListeningData";

// Helper function to get the current week's start and end dates
function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Get Monday
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Get Sunday

  return {
    startDate: startDate.toISOString().split("T")[0], // YYYY-MM-DD
    endDate: endDate.toISOString().split("T")[0], // YYYY-MM-DD
  };
}

function GraphCard({ title, userId }) {
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState(getCurrentWeekRange()); // Initialize to current week
  const [earliestDate, setEarliestDate] = useState(null);

  // Fetch the earliest date when the component mounts
  useEffect(() => {
    async function fetchEarliestDate() {
      const earliest = await getEarliestDate(userId);
      //console.log("Earliest date:", earliest);
      setEarliestDate(earliest);
    }
    fetchEarliestDate();
  }, [userId]);

  // Fetch listening data when userId or dateRange changes
  useEffect(() => {
    async function fetchData() {
      if (userId) {
        const { rawData } = await getListeningData(userId, dateRange.startDate, dateRange.endDate);
        const processedData = chartListeningData(rawData, dateRange.startDate, dateRange.endDate);
        setChartData(processedData);
      }
    }
    fetchData();
  }, [userId, dateRange]);

  return (
    <div className="graph-card">
      <h2>{title}</h2>
      <GraphControls dateRange={dateRange} setDateRange={setDateRange} earliestDate={earliestDate} />
      {chartData ? <LineChart chartData={chartData} /> : <LineChart />}
    </div>
  );
}

export default GraphCard;