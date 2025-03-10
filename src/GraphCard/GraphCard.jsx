import './GraphCard.css';
import LineChart from '../Components/LineChart';
import { useEffect, useState } from "react";
import { getListeningData } from "../getListeningData";
import { chartListeningData } from "../chartListeningData";

function GraphCard({ title, userId }) {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (userId) {
                const rawData = await getListeningData(userId);
                const processedData = chartListeningData(rawData);
                setChartData(processedData);
            }
        }
        fetchData();
    }, [userId]);

    return (
        <div className="graph-card">
            <h2>{title}</h2>
            {chartData ? <LineChart chartData={chartData} /> : <LineChart />}
        </div>
    );
}

export default GraphCard;
