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
export function chartListeningData(rawData) {
    const { startDate, endDate } = getCurrentWeekRange();

    // Initialize structure for a full week (Mon-Sun)
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const minutesListened = {};
    const songsPlayed = {};

    // Pre-fill all days with 0
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

    // Convert into arrays for Chart.js
    return {
        labels: daysOfWeek, // Mon-Sun fixed labels
        datasets: [
            {
                label: "Minutes Listened",
                data: daysOfWeek.map((_, i) => minutesListened[Object.keys(minutesListened)[i]] || 0),
                fill: false,
                borderColor: "rgb(79, 176, 122)",
                tension: 0.3,
            },
        ],
    };
}
