import React, { useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const LineChart = ({ chartData }) => {
    const chartRef = useRef(null);
    
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
    
    // Force chart resize when window size changes
    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.resize();
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    // Chart.js options to ensure responsiveness
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
    };

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <Line 
                data={data} 
                options={options} 
                ref={chartRef}
            />
        </div>
    );
};

export default React.memo(LineChart);