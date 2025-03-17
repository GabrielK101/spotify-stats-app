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

function GraphCard({ title, userId, dataType=null, artistId=null, artistName=null, artistIds=[], artistNames=[] }) {
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState(getCurrentWeekRange()); // Initialize to current week
  const [earliestDate, setEarliestDate] = useState(null);

  // Fetch the earliest date when the component mounts
  useEffect(() => {
    async function fetchEarliestDate() {
      const earliest = await getEarliestDate(userId);
      setEarliestDate(earliest);
    }
    fetchEarliestDate();
  }, [userId]);

  // Fetch listening data when userId, dateRange, or artist info changes
  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      // Case 1: Multiple artists (using artistIds array)
      if (artistIds && artistIds.length > 0) {
        console.log("Fetching data for multiple artists:", artistIds);
        
        // Create a base chart structure with days of the week
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const combinedData = {
          labels: daysOfWeek,
          datasets: []
        };

        // Fetch data for each artist
        for (let i = 0; i < artistIds.length; i++) {
          const id = artistIds[i];
          const name = artistNames[i] || `Artist ${i+1}`;
          
          console.log(`Fetching data for ${name} (${id})`);
          const { rawData } = await getListeningData(userId, dateRange.startDate, dateRange.endDate, id);
          
          // Process this artist's data
          const artistData = chartListeningData(rawData, dateRange.startDate, dateRange.endDate, name);
          
          // We only need the first dataset from the processed data
          if (artistData && artistData.datasets && artistData.datasets.length > 0) {
            // Use a different color for each artist
            const color = getRandomColor(i);
            const dataset = {
              ...artistData.datasets[0],
              borderColor: color,
              pointBorderColor: color
            };
            
            combinedData.datasets.push(dataset);
          }
        }
        
        setChartData(combinedData);
      }
      // Case 2: Single artist (using artistId)
      else if (dataType === "artist" && artistId) {
        console.log("Fetching listening data for artist", artistId);
        const { rawData } = await getListeningData(userId, dateRange.startDate, dateRange.endDate, artistId);
        const processedData = chartListeningData(rawData, dateRange.startDate, dateRange.endDate, artistName);
        setChartData(processedData);
      }
      // Case 3: Default total listening data
      else {
        const { rawData } = await getListeningData(userId, dateRange.startDate, dateRange.endDate);
        const processedData = chartListeningData(rawData, dateRange.startDate, dateRange.endDate);
        setChartData(processedData);
      }
    }
    
    fetchData();
  }, [userId, dateRange, dataType, artistId, artistName, artistIds, artistNames]);

  // Helper function to generate a random color
  function getRandomColor(index) {
    // Predefined colors for better visibility
    const colors = [
      'rgb(79, 176, 122)', // Green
      'rgb(59, 130, 246)', // Blue
      'rgb(253, 186, 116)', // Orange
      'rgb(167, 139, 250)', // Purple
      'rgb(251, 113, 133)', // Pink
      'rgb(252, 211, 77)', // Yellow
      'rgb(156, 163, 175)', // Gray
      'rgb(224, 231, 255)', // Light blue
      'rgb(254, 202, 202)', // Light red
      'rgb(187, 247, 208)'  // Light green
    ];
    
    // Use predefined colors if available, otherwise generate a random color
    if (index < colors.length) {
      return colors[index];
    } else {
      return `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)})`;
    }
  }

  return (
    <div className="graph-card">
      <h2>{title}</h2>
      <GraphControls dateRange={dateRange} setDateRange={setDateRange} earliestDate={earliestDate} />
      {chartData ? <LineChart chartData={chartData} /> : <LineChart />}
    </div>
  );
}

export default GraphCard;