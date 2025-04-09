import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const LineChart = ({ chartData }) => {
    // If chartData is not provided, use default data (for fallback or testing)
    const data = chartData || {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
            {
                label: "No data",
                data: [],
                fill: false,
                borderColor: "rgb(255, 255, 255)",
                tension: 0.3,
            },
        ],
    };

    return <Line data={data} />;
};

export default React.memo(LineChart);
//export default LineChart;