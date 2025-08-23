import './GraphControls.css';
import React, { useState, useEffect, useCallback } from 'react';

// Helper debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function GraphControls({ dateRange, setDateRange, earliestDate }) {
  const [date, setDate] = useState(new Date(dateRange.startDate)); // Initialize with dateRange.startDate

  // Debounced version of setDateRange
  const debouncedSetDateRange = useCallback(
    debounce((newRange) => {
      setDateRange(newRange);
    }, 300),
    [setDateRange]
  );

  // Update internal date state when dateRange changes
  useEffect(() => {
    setDate(new Date(dateRange.startDate));
  }, [dateRange]);

  // Helper function to get Monday of a week for a given date, using UTC to avoid DST issues
  function getMondayForDate(inputDate) {
    // Always work in UTC to avoid DST issues
    const dateUTC = new Date(Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate()
    ));

    const dayOfWeek = dateUTC.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    dateUTC.setUTCDate(dateUTC.getUTCDate() - daysToMonday);

    return dateUTC; // Keep it in UTC
  }
  
  // Function to format the week range display
  function formatWeekRange(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time for accurate comparisons
  
    // Get Monday for the current date
    const mondayDate = getMondayForDate(date);
    console.log("Calculated Monday:", mondayDate); // Debugging log
  
    // Calculate Sunday (6 days after Monday)
    const endDate = new Date(mondayDate);
    endDate.setUTCDate(mondayDate.getUTCDate() + 6);
    console.log("Calculated Sunday:", endDate); // Debugging log
    
    // Check if we're in the current week
    const todayMonday = getMondayForDate(today);
    if (mondayDate.getTime() === todayMonday.getTime()) {
      return "This Week";
    }
  
    // Helper function to format date as "day month year"
    const formatDate = (d) => `${d.getUTCDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getUTCFullYear()}`;
  
    // Return formatted range
    return `${formatDate(mondayDate)} - ${formatDate(endDate)}`;
  }

  // Function to reset to the current week
  const resetToCurrentWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    // Calculate Monday of the current week using our helper
    const currentMonday = getMondayForDate(today);
    console.log("Current Monday:", currentMonday);

    // Calculate Sunday of the current week
    const currentSunday = new Date(currentMonday);
    currentSunday.setUTCDate(currentMonday.getUTCDate() + 6);

    // Convert dates to YYYY-MM-DD strings
    const formatDate = (date) => date.toISOString().split("T")[0];
    const startDateStr = formatDate(currentMonday);
    const endDateStr = formatDate(currentSunday);

    // Update dateRange with current week
    debouncedSetDateRange({ startDate: startDateStr, endDate: endDateStr });

    // Update the displayed date
    setDate(currentMonday);
  };

  // Function to change the week (backward or forward)
  const changeWeek = (weeks) => {
    setDate(prevDate => {
      // Get the Monday of the current week for the selected date
      const currentMonday = getMondayForDate(prevDate);
      
      // Create a new date by adding/subtracting weeks
      const newMonday = new Date(Date.UTC(
        currentMonday.getUTCFullYear(),
        currentMonday.getUTCMonth(),
        currentMonday.getUTCDate() + (weeks * 7)
      ));
      
      // Check against the current week (based on today's date)
      const todayMonday = getMondayForDate(new Date());
      if (newMonday > todayMonday) {
        // If trying to go into a future week, do nothing
        return prevDate;
      }
      
      // Calculate Sunday of the new week
      const newSunday = new Date(Date.UTC(
        newMonday.getUTCFullYear(),
        newMonday.getUTCMonth(),
        newMonday.getUTCDate() + 6
      ));

      // If newMonday is earlier than the earliest date, reset to the earliest week
      if (earliestDate && newMonday < new Date(earliestDate)) {
        const earliestDate_obj = new Date(earliestDate);
        const earliestMonday = getMondayForDate(earliestDate_obj);
        const earliestSunday = new Date(Date.UTC(
          earliestMonday.getUTCFullYear(),
          earliestMonday.getUTCMonth(),
          earliestMonday.getUTCDate() + 6
        ));

        // Convert dates to YYYY-MM-DD strings
        const formatDate = (date) => date.toISOString().split("T")[0];
        const startDateStr = formatDate(earliestMonday);
        const endDateStr = formatDate(earliestSunday);

        // Update dateRange with earliest week
        debouncedSetDateRange({ startDate: startDateStr, endDate: endDateStr });
        return earliestMonday; // Return earliest Monday to update the state
      }

      // Convert dates to YYYY-MM-DD strings
      const formatDate = (date) => date.toISOString().split("T")[0];
      const startDateStr = formatDate(newMonday);
      const endDateStr = formatDate(newSunday);

      // Update dateRange with strings
      debouncedSetDateRange({ startDate: startDateStr, endDate: endDateStr });
      return newMonday;
    });
  };

  return (
    <div className="graph-controls">
      <button onClick={() => changeWeek(-1)}>&lt;</button>
      <span onClick={resetToCurrentWeek} style={{ cursor: 'pointer' }}>{formatWeekRange(date)}</span>
      <button onClick={() => changeWeek(+1)}>&gt;</button>
    </div>
  );
}

export default React.memo(GraphControls);
//export default GraphControls;
