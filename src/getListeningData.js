import { collection, query, getDocs, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Fast function to get daily aggregated data
export async function getDailyStats(userId, startDate = null, endDate = null) {
  if (!userId) {
    console.error("No userId provided");
    return { dailyData: [], earliestDate: null };
  }

  try {
    let q = query(
      collection(db, "users", userId, "daily_stats"),
      orderBy("date", "asc")
    );

    // Apply date filtering if provided
    if (startDate && endDate) {
      q = query(
        collection(db, "users", userId, "daily_stats"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
      );
    }

    const querySnapshot = await getDocs(q);
    const dailyData = [];
    let earliestDate = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;

      if (!earliestDate || date < earliestDate) {
        earliestDate = date;
      }

      dailyData.push({
        date,
        totalDuration: data.total_duration_ms,
        totalHours: data.total_hours,
        topArtists: data.top_artists || [],
        topTracks: data.top_tracks || [],
        topAlbums: data.top_albums || []
      });
    });

    return { dailyData, earliestDate };
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return { dailyData: [], earliestDate: null };
  }
}

// Fast function to get artist suggestions using the artist index
export async function getArtistSuggestions(userId, searchQuery = "", maxResults = 10) {
  if (!userId) {
    console.error("No userId provided");
    return [];
  }

  try {
    // Get the artist index
    const indexDoc = await getDoc(doc(db, "users", userId, "indexes", "artists"));
    
    if (!indexDoc.exists()) {
      console.log("No artist index found");
      return [];
    }

    const artists = indexDoc.data().artists || {};
    const normalizedSearch = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Filter and format results
    const results = Object.entries(artists)
      .filter(([artistId, artistName]) => {
        if (!normalizedSearch) return true;
        const normalizedArtist = artistName.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normalizedArtist.includes(normalizedSearch);
      })
      .map(([artistId, artistName]) => ({
        artist_id: artistId,
        artist: artistName
      }))
      .sort((a, b) => a.artist.localeCompare(b.artist))
      .slice(0, maxResults);

    return results;
  } catch (error) {
    console.error("Error fetching artist suggestions:", error);
    return [];
  }
}

// Function to get weekly summary from daily stats
export async function getWeeklyStats(userId, startDate, endDate) {
  if (!userId || !startDate || !endDate) {
    console.error("Missing required parameters");
    return { weeklyData: [], totalDuration: 0 };
  }

  try {
    const { dailyData } = await getDailyStats(userId, startDate, endDate);
    
    const totalDuration = dailyData.reduce((sum, day) => sum + (day.totalDuration || 0), 0);
    const totalHours = Math.round((totalDuration / (1000 * 60 * 60)) * 100) / 100;
    
    // Aggregate artists across the week
    const weeklyArtists = {};
    dailyData.forEach(day => {
      day.topArtists?.forEach(artist => {
        if (weeklyArtists[artist.artist_id]) {
          weeklyArtists[artist.artist_id] += artist.duration_ms;
        } else {
          weeklyArtists[artist.artist_id] = artist.duration_ms;
        }
      });
    });

    const topWeeklyArtists = Object.entries(weeklyArtists)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([artistId, duration]) => ({ artist_id: artistId, duration_ms: duration }));

    return {
      weeklyData: dailyData,
      totalDuration,
      totalHours,
      topWeeklyArtists
    };
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return { weeklyData: [], totalDuration: 0 };
  }
}

// Legacy function for detailed day view (keep for detailed views)
export async function getDetailedListeningDataForDay(userId, date) {
  if (!userId || !date) {
    console.error("No userId or date provided");
    return [];
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "users", userId, "listening_history"),
    where("played_at", ">=", startOfDay),
    where("played_at", "<=", endOfDay),
    orderBy("played_at", "desc")
  );

  try {
    const querySnapshot = await getDocs(q);
    const rawData = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rawData.push({
        date: data.played_at.toDate().toISOString().split("T")[0],
        duration: data.duration_ms,
        artistName: data.artist,
        artistId: data.artist_id,
        songName: data.name,
        songId: data.track_id,
        image: data.image,
        playedAt: data.played_at.toDate()
      });
    });

    return rawData;
  } catch (error) {
    console.error("Error fetching detailed listening data:", error);
    return [];
  }
}

// Function to get earliest date from daily stats (much faster)
export async function getEarliestDate(userId) {
  if (!userId) {
    console.error("No userId provided");
    return null;
  }

  try {
    const q = query(
      collection(db, "users", userId, "daily_stats"),
      orderBy("date", "asc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return doc.data().date;
  } catch (error) {
    console.error("Error fetching earliest date:", error);
    return null;
  }
}