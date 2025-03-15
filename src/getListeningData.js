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
      const { played_at, duration_ms } = doc.data();
      const entryDate = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD

      // Add entry to rawData
      rawData.push({entryDate, duration_ms});
    });

    return rawData; // Consistent return type
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
