import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { db } from "./firebase";

export async function getListeningData(userId, startDate = null, endDate = null, artistId = null) {
  if (!userId) {
    console.error("No userId provided");
    return { rawData: [], earliestDate: null };
  }

  let q = query(
    collection(db, "users", userId, "listening_history"),
    orderBy("played_at", "asc") // Sort by played_at
  );

  // If filtering by artist, apply where condition
  if (artistId) {
    q = query(
      collection(db, "users", userId, "listening_history"),
      where("artist_id", "==", artistId),
      orderBy("played_at", "asc")
    );
  }

  try {
    const querySnapshot = await getDocs(q);
    const rawData = [];
    let earliestDate = null;

    querySnapshot.forEach((doc) => {
      const { played_at, duration_ms } = doc.data();
      const date = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD

      // Track the earliest date
      if (!earliestDate || date < earliestDate) {
        earliestDate = date;
      }

      // If date filtering is applied, enforce it
      if (startDate && endDate) {
        if (date < startDate) return; // Skip if before startDate
        if (date > endDate) return; // Skip if after endDate
      }

      rawData.push({ date, duration_ms });
    });

    return { rawData, earliestDate };
  } catch (error) {
    console.error("Error fetching listening data:", error);
    return { rawData: [], earliestDate: null };
  }
}

export async function getListeningDataForDay(userId, date) {
  if (!userId || !date) {
    console.error("No userId or date provided");
    return []; // Consistent return type
  }

  // Query listening history for the specific day
  const q = query(
    collection(db, "users", userId, "listening_history"),
    where("played_at", ">=", new Date(date)), // Start of the day
    where("played_at", "<", new Date(new Date(date).setDate(new Date(date).getDate() + 1))) // End of the day
  );

  const querySnapshot = await getDocs(q);
  const rawData = [];

  querySnapshot.forEach((doc) => {
    const { played_at, duration_ms, artist, artist_id, name, track_id } = doc.data();
    const entryDate = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD

    // Add entry to rawData
    rawData.push({
      date: entryDate,
      duration: duration_ms,
      artistName: artist,
      artistId: artist_id,
      songName: name,
      songId: track_id
    });
  });

  return rawData; // Consistent return type
}


export async function getListeningDataForWeek(userId, date) {
  if (!userId || !date) {
    console.error("No userId or date provided");
    return [];
  }

  const inputDate = new Date(date);
  const dayOfWeek = inputDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday being 0
  const weekStart = new Date(inputDate);
  weekStart.setDate(inputDate.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7); // Exclusive upper bound
  weekEnd.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "users", userId, "listening_history"),
    where("played_at", ">=", weekStart),
    where("played_at", "<", weekEnd)
  );

  const querySnapshot = await getDocs(q);
  const rawData = [];

  querySnapshot.forEach((doc) => {
    const { played_at, duration_ms, artist, artist_id, name, track_id, image } = doc.data();
    const entryDate = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD
    rawData.push({
      date: entryDate,
      duration: duration_ms,
      artistName: artist,
      artistId: artist_id,
      image: image,
      songName: name,
      songId: track_id
    });
  });

  return rawData;
}

export async function getEarliestDate(userId) {
    if (!userId) {
      console.error("No userId provided");
      return null;
    }

    // Query the earliest played_at date
    const q = query(
      collection(db, "users", userId, "listening_history"),
      orderBy("played_at", "asc"), // Sort by played_at
      limit(1) // Only fetch the first document
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null; // No data found
    }

    const doc = querySnapshot.docs[0];
    const { played_at } = doc.data();
    return new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function getListeningDataForArtist(userId, artistId) {
    if (!userId || !artistId) {
      console.error("No userId or artistId provided");
      return []; // Consistent return type
    }

    // Query listening history for the specific artist
    const q = query(
      collection(db, "users", userId, "listening_history"),
      where("artist_id", "==", artistId)
    );

    const querySnapshot = await getDocs(q);
    const rawData = [];

    querySnapshot.forEach((doc) => {
      const { played_at, duration_ms } = doc.data();
      const entryDate = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD

      // Add entry to rawData
      rawData.push({entryDate, duration_ms});
    });

    return rawData; // Consistent return type
}

function normalizeText(text) {
  return text ? text.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

// Get artist ID with case/punctuation-insensitive search
export async function getArtistID(userId, artistName) {
  if (!userId || !artistName) {
    console.error("No userId or artistName provided");
    return null;
  }

  const normalizedSearch = normalizeText(artistName);
  const q = query(collection(db, "users", userId, "listening_history"));

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("No listening history found.");
      return null;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.artist || !data.artist_id) continue; // Skip if missing artist or artist_id

      const normalizedStored = normalizeText(data.artist);
      if (normalizedStored === normalizedSearch) {
        return { artist_id: data.artist_id, artist: data.artist }; // Return artist_id if matched
      }
    }

    console.log("Artist not found in listening history.");
    return null;
  } catch (error) {
    console.error("Error fetching artist ID:", error);
    return null;
  }
}

/**
 * Get artist suggestions from a user's listening history
 * @param {string} userId - The user ID
 * @param {string} [searchQuery=""] - Optional search query to filter artists
 * @param {number} [maxResults=10] - Maximum number of results to return
 * @returns {Promise<Array<{artist_id: string, artist: string}>>} Array of matching artists
 */
export async function getArtistSuggestions(userId, searchQuery = "", maxResults = 10) {
  if (!userId) {
    console.error("No userId provided");
    return [];
  }

  try {
    // Query all listening history for the user
    const q = query(collection(db, "users", userId, "listening_history"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No listening history found.");
      return [];
    }

    // Use a Map to track unique artists to avoid duplicates
    const artistsMap = new Map();
    const normalizedSearch = normalizeText(searchQuery);
    
    // Process all documents
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.artist || !data.artist_id) return; // Skip if missing artist or artist_id
      
      // If we already have this artist, skip
      if (artistsMap.has(data.artist_id)) return;
      
      // If search query provided, filter by it
      if (normalizedSearch) {
        const normalizedArtist = normalizeText(data.artist);
        // Check if artist name contains the search query
        if (!normalizedArtist.includes(normalizedSearch)) return;
      }
      
      // Add to our Map
      artistsMap.set(data.artist_id, {
        artist_id: data.artist_id,
        artist: data.artist
      });
    });
    
    // Convert Map values to array and limit results
    const results = Array.from(artistsMap.values())
      // Sort alphabetically by artist name
      .sort((a, b) => a.artist.localeCompare(b.artist))
      // Limit to maxResults
      .slice(0, maxResults);
    
    return results;
  } catch (error) {
    console.error("Error fetching artist suggestions:", error);
    return [];
  }
}

/**
 * Get album suggestions from a user's listening history
 * @param {string} userId - The user ID
 * @param {string} [searchQuery=""] - Optional search query to filter albums
 * @param {number} [maxResults=10] - Maximum number of results to return
 * @returns {Promise<Array<{album_id: string, album: string, artist: string, image: string}>>} Array of matching albums
 */
export async function getAlbumSuggestions(userId, searchQuery = "", maxResults = 10) {
  if (!userId) {
    console.error("No userId provided");
    return [];
  }

  try {
    // Query all listening history for the user
    const q = query(collection(db, "users", userId, "listening_history"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No listening history found.");
      return [];
    }

    // Use a Map to track unique albums to avoid duplicates
    const albumsMap = new Map();
    const normalizedSearch = normalizeText(searchQuery);
    
    // Process all documents
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.album) return; // Skip if missing album or album_id
      
      // If we already have this album, skip
      if (albumsMap.has(data.album)) return;
      
      // If search query provided, filter by it
      if (normalizedSearch) {
        const normalizedAlbum = normalizeText(data.album);
        // Check if album name contains the search query
        if (!normalizedAlbum.includes(normalizedSearch)) return;
      }
      
      // Add to our Map
      albumsMap.set(data.album_id, {
        album: data.album,
        artist: data.artist,
        image: data.image
      });
    });
    
    // Convert Map values to array and limit results
    const results = Array.from(albumsMap.values())
      // Sort alphabetically by album name
      .sort((a, b) => a.album.localeCompare(b.album))
      // Limit to maxResults
      .slice(0, maxResults);
    
    return results;
  } catch (error) {
    console.error("Error fetching album suggestions:", error);
    return [];
  }
}