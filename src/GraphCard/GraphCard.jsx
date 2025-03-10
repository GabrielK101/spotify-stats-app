import './GraphCard.css';
import LineChart from '../Components/LineChart';
import GraphControls from '../Components/GraphControls';
import { useEffect, useState } from "react";
import { getListeningData } from "../getListeningData";
import { chartListeningData } from "../chartListeningData";

function GraphCard({ title, userId }) {
    const [chartData, setChartData] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    useEffect(() => {
        async function fetchData() {
            if (userId && dateRange.startDate && dateRange.endDate) { // Validate dateRange
                console.log("Fetching data for", userId, dateRange);
                const rawData = await getListeningData(userId, dateRange.startDate, dateRange.endDate);
                console.log("Raw data", rawData);
                const processedData = chartListeningData(rawData, dateRange.startDate, dateRange.endDate);
                setChartData(processedData);
            }
        }
        fetchData();
    }, [userId, dateRange]);

    return (
        <div className="graph-card">
            <h2>{title}</h2>
            <GraphControls setDateRange={setDateRange} />
            {chartData ? <LineChart chartData={chartData} /> : <LineChart />}
        </div>
    );
}

export default GraphCard;
