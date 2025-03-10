// Helper function to get the current week's Monday-Sunday date range
export function getCurrentWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Get Monday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Get Sunday

    return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
    };
}

// Process Firestore data into a chart-friendly format
export function chartListeningData(rawData, startDate, endDate) {
    if (!startDate || !endDate || isNaN(new Date(startDate).getTime())) {
        console.error("Invalid date range:", { startDate, endDate });
        return {
            labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            datasets: [
                {
                    label: "Minutes Listened",
                    data: Array(7).fill(0),
                    fill: false,
                    borderColor: "rgb(79, 176, 122)",
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "white",
                    pointBorderWidth: 2,
                    pointBorderColor: "rgb(79, 176, 122)",
                },
            ],
        };
    }
    // Initialize structure for the selected week (Mon-Sun)
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const minutesListened = {};
    const songsPlayed = {};

    // Pre-fill days based on selected date range
    let currentDay = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        const dateStr = currentDay.toISOString().split("T")[0];
        minutesListened[dateStr] = 0;
        songsPlayed[dateStr] = 0;
        currentDay.setDate(currentDay.getDate() + 1);
    }

    // Process raw data
    rawData.forEach(({ date, duration_ms }) => {
        if (minutesListened.hasOwnProperty(date)) {
            minutesListened[date] += duration_ms / 60000; // Convert ms to minutes
            songsPlayed[date] += 1; // Count songs
        }
    });

    // Get today's date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if the selected week is the current week
    const isCurrentWeek = (
        startDate <= todayStr &&
        todayStr <= endDate
    );

    // Modify data to show current day and null for future days, but keep all labels
    const truncatedData = daysOfWeek.map((_, i) => {
        const dateStr = Object.keys(minutesListened)[i];

        // Only truncate if it's the current week
        if (isCurrentWeek) {
            const currentDayOfWeek = new Date().getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
            if (i < currentDayOfWeek) {
                return minutesListened[dateStr] || 0; // Data for completed days
            } else if (i === currentDayOfWeek) {
                return minutesListened[dateStr] || null; // Data for today (can show actual data or pause with null)
            } else {
                return null; // Future days should have no data
            }
        } else {
            // For historical weeks, show full data
            return minutesListened[dateStr] || 0;
        }
    });

    return {
        labels: daysOfWeek, // Keep all labels (Mon-Sun)
        datasets: [
            {
                label: "Minutes Listened",
                data: truncatedData,
                fill: false,
                borderColor: "rgb(79, 176, 122)",
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: "white",
                pointBorderWidth: 2,
                pointBorderColor: "rgb(79, 176, 122)",
            },
        ],
    };
}
