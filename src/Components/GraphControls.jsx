import './GraphControls.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

function GraphControls({ dateRange, setDateRange, earliestDate }) {
  // Helper function to get Monday of a week for a given date
  const getMondayForDate = useCallback((inputDate) => {
    const date = new Date(inputDate);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return monday;
  }, []);

  // Helper function to format date as YYYY-MM-DD
  const formatDateString = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get current Monday based on dateRange
  const currentMonday = useMemo(() => {
    if (!dateRange?.startDate) return getMondayForDate(new Date());
    return getMondayForDate(new Date(dateRange.startDate));
  }, [dateRange?.startDate, getMondayForDate]);

  // Get today's Monday for comparison
  const todayMonday = useMemo(() => getMondayForDate(new Date()), [getMondayForDate]);

  // Get earliest Monday if earliestDate is provided
  const earliestMonday = useMemo(() => {
    if (!earliestDate) return null;
    return getMondayForDate(new Date(earliestDate));
  }, [earliestDate, getMondayForDate]);

  // Function to format the week range display
  const formatWeekRange = useCallback((monday) => {
    // Check if we're in the current week
    if (monday.getTime() === todayMonday.getTime()) {
      return "This Week";
    }

    // Calculate Sunday (6 days after Monday)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Helper function to format date as "day month year"
    const formatDate = (d) => {
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  }, [todayMonday]);

  // Function to update date range
  const updateDateRange = useCallback((monday) => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startDateStr = formatDateString(monday);
    const endDateStr = formatDateString(sunday);
    
    setDateRange({ startDate: startDateStr, endDate: endDateStr });
  }, [setDateRange, formatDateString]);

  // Function to reset to the current week
  const resetToCurrentWeek = useCallback(() => {
    updateDateRange(todayMonday);
  }, [updateDateRange, todayMonday]);

  // Function to change the week (backward or forward)
  const changeWeek = useCallback((weeks) => {
    const newMonday = new Date(currentMonday);
    newMonday.setDate(currentMonday.getDate() + (weeks * 7));
    
    // Check if trying to go into future
    if (newMonday > todayMonday) {
      return; // Don't allow future weeks
    }
    
    // Check if trying to go before earliest date
    if (earliestMonday && newMonday < earliestMonday) {
      updateDateRange(earliestMonday);
      return;
    }
    
    updateDateRange(newMonday);
  }, [currentMonday, todayMonday, earliestMonday, updateDateRange]);

  // Check if we can go to previous/next week
  const canGoPrevious = useMemo(() => {
    if (!earliestMonday) return true;
    const previousWeek = new Date(currentMonday);
    previousWeek.setDate(currentMonday.getDate() - 7);
    return previousWeek >= earliestMonday;
  }, [currentMonday, earliestMonday]);

  const canGoNext = useMemo(() => {
    const nextWeek = new Date(currentMonday);
    nextWeek.setDate(currentMonday.getDate() + 7);
    return nextWeek <= todayMonday;
  }, [currentMonday, todayMonday]);

  return (
    <div className="graph-controls">
      <button 
        onClick={() => changeWeek(-1)}
        disabled={!canGoPrevious}
        className="week-nav-button"
        aria-label="Previous week"
      >
        &lt;
      </button>
      
      <span 
        onClick={resetToCurrentWeek} 
        className="week-display"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            resetToCurrentWeek();
          }
        }}
        aria-label="Click to go to current week"
      >
        {formatWeekRange(currentMonday)}
      </span>
      
      <button 
        onClick={() => changeWeek(1)}
        disabled={!canGoNext}
        className="week-nav-button"
        aria-label="Next week"
      >
        &gt;
      </button>
    </div>
  );
}

export default React.memo(GraphControls);