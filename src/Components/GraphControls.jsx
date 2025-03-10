import './GraphControls.css';
import React, { useState } from 'react';

function GraphControls({ setDateRange, earliestDate }) {
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
    
    const resetToCurrentWeek = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight

        // Calculate Monday of the current week
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Adjust to Monday

        // Calculate Sunday of the current week
        const currentSunday = new Date(currentMonday);
        currentSunday.setDate(currentMonday.getDate() + 6); // Sunday is 6 days after Monday

        // Convert dates to YYYY-MM-DD strings
        const formatDate = (date) => date.toISOString().split("T")[0];
        const startDateStr = formatDate(currentMonday);
        const endDateStr = formatDate(currentSunday);

        // Update dateRange with current week
        setDateRange({ startDate: startDateStr, endDate: endDateStr });

        // Update the displayed date
        setDate(currentMonday);
    };

    const changeWeek = (weeks, earliestDate) => {
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

            // If newStartDate is earlier than the earliest date, reset to the earliest week
            if (earliestDate && newStartDate < new Date(earliestDate)) {
                const earliestMonday = new Date(earliestDate);
                earliestMonday.setDate(earliestMonday.getDate() - (earliestMonday.getDay() === 0 ? 6 : earliestMonday.getDay() - 1)); // Calculate Monday of the earliest week
                const earliestSunday = new Date(earliestMonday);
                earliestSunday.setDate(earliestMonday.getDate() + 6); // Calculate Sunday of the earliest week
          
                // Convert dates to YYYY-MM-DD strings
                const formatDate = (date) => date.toISOString().split("T")[0];
                const startDateStr = formatDate(earliestMonday);
                const endDateStr = formatDate(earliestSunday);
          
                // Update dateRange with earliest week
                setDateRange({ startDate: startDateStr, endDate: endDateStr });
                return earliestMonday; // Return earliest Monday to update the state
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
                <button onClick={() => changeWeek(-1, earliestDate)}>&lt;</button>
                <span onClick={resetToCurrentWeek}>{formatWeekRange(date)}</span>
                <button onClick={() => changeWeek(+1, earliestDate)}>&gt;</button>
        </div>
    );
}
export default GraphControls;