import './GraphControls.css';
import React, { useState, useEffect } from 'react';

function GraphControls({ dateRange, setDateRange, earliestDate }) {
  const [date, setDate] = useState(new Date(dateRange.startDate)); // Initialize with dateRange.startDate

  // Update internal date state when dateRange changes
  useEffect(() => {
    setDate(new Date(dateRange.startDate));
  }, [dateRange]);

  // Function to format the week range display
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

  // Function to reset to the current week
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

  // Function to change the week (backward or forward)
  const changeWeek = (weeks) => {
    setDate(prevDate => {
      const newStartDate = new Date(prevDate);
  
      // Move backward/forward by weeks
      newStartDate.setDate(newStartDate.getDate() + weeks * 7);
  
      // Calculate Monday of the new week
      const dayOfWeek = newStartDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      newStartDate.setDate(newStartDate.getDate() - daysToMonday);
  
      // Ensure newStartDate is not before earliestDate
      if (earliestDate && newStartDate < new Date(earliestDate)) {
        newStartDate.setDate(new Date(earliestDate).getDate());
      }
  
      // Calculate Sunday of the week
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 6);
  
      // Convert dates to YYYY-MM-DD strings
      const formatDate = (date) => date.toISOString().split("T")[0];
      setDateRange({ startDate: formatDate(newStartDate), endDate: formatDate(newEndDate) });
  
      return newStartDate;
    });
  };

  return (
    <div className="graph-controls">
      <button onClick={() => changeWeek(-1)}>&lt;</button>
      <span onClick={resetToCurrentWeek}>{formatWeekRange(date)}</span> {/* Make span clickable */}
      <button onClick={() => changeWeek(+1)}>&gt;</button>
    </div>
  );
}

export default GraphControls;