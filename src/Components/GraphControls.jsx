import './GraphControls.css';
import React, { useState } from 'react';

function GraphControls({ setDateRange }) {
    const [date, setDate] = useState(new Date());

    function formatWeekRange(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignore time for accurate comparisons
    
        // Find the Monday of the current week
        const startDate = new Date(date);
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to Monday
        startDate.setDate(startDate.getDate() - daysToMonday);
    
        // Find the Sunday of the current week
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday is 6 days after Monday
    
        // Check if the date is in the current week
        if (startDate <= today && today <= endDate) {
            return "This Week";
        }
    
        // Helper function to format date as "day month year"
        const formatDate = (d) => `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    
        // Return formatted range
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    

    const changeWeek = (weeks) => {
        setDate(prevDate => {
            const newStartDate = new Date(prevDate);
    
            // Calculate Monday of the week
            const dayOfWeek = newStartDate.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            newStartDate.setDate(newStartDate.getDate() - daysToMonday);
    
            // Move backward/forward by weeks
            newStartDate.setDate(newStartDate.getDate() + weeks * 7);
    
            // Calculate Sunday of the week
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newStartDate.getDate() + 6);
    
            // Get today's date (start of the day)
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to midnight
    
            // If newStartDate is in the future, reset to the current week
            if (newStartDate > today) {
                const currentMonday = new Date(today);
                currentMonday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Calculate Monday of the current week
                const currentSunday = new Date(currentMonday);
                currentSunday.setDate(currentMonday.getDate() + 6); // Calculate Sunday of the current week
    
                // Convert dates to YYYY-MM-DD strings
                const formatDate = (date) => date.toISOString().split("T")[0];
                const startDateStr = formatDate(currentMonday);
                const endDateStr = formatDate(currentSunday);
    
                // Update dateRange with current week
                setDateRange({ startDate: startDateStr, endDate: endDateStr });
                return currentMonday; // Return current Monday to update the state
            }
    
            // Convert dates to YYYY-MM-DD strings
            const formatDate = (date) => date.toISOString().split("T")[0];
            const startDateStr = formatDate(newStartDate);
            const endDateStr = formatDate(newEndDate);
    
            // Update dateRange with strings
            setDateRange({ startDate: startDateStr, endDate: endDateStr });
            return newStartDate;
        });
    };
    
    return (
        <div className="graph-controls">
                <button onClick={() => changeWeek(-1)}>&lt;</button>
                <span>{formatWeekRange(date)}</span>
                <button onClick={() => changeWeek(+1)}>&gt;</button>
        </div>
    );
}
export default GraphControls;