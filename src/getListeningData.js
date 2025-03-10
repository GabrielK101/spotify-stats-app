import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";

export async function getListeningData(userId, startDate = null, endDate = null) {
  if (!userId) {
    console.error("No userId provided");
    return { rawData: [], earliestDate: null };
  }

  // Query listening history sorted by played_at in ascending order
  const q = query(
    collection(db, "users", userId, "listening_history"),
    orderBy("played_at", "asc") // Sort by played_at
  );

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

  return { rawData, earliestDate }; // Return raw data and earliest date
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