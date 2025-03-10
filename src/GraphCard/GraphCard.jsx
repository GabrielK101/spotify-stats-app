import './GraphCard.css';
import LineChart from '../Components/LineChart';
import GraphControls from '../Components/GraphControls';
import { useEffect, useState } from "react";
import { getListeningData, getEarliestDate } from "../getListeningData";
import { chartListeningData } from "../chartListeningData";

function GraphCard({ title, userId }) {
    const [chartData, setChartData] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [earliestDate, setEarliestDate] = useState(null);

    // Fetch the earliest date when the component mounts
    useEffect(() => {
        async function fetchEarliestDate() {
        const earliest = await getEarliestDate(userId);
        console.log("Earliest date:", earliest);
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
            <GraphControls setDateRange={setDateRange} earliestDate={earliestDate} />
            {chartData ? <LineChart chartData={chartData} /> : <LineChart />}
        </div>
    );
}

export default GraphCard;
