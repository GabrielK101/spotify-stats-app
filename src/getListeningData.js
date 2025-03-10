import { collection, query, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getListeningData(userId, startDate = null, endDate = null) {
  if (!userId) {
    console.error("No userId provided");
    return [];
  }

  const q = query(collection(db, "users", userId, "listening_history"));
  const querySnapshot = await getDocs(q);

  const rawData = [];

  querySnapshot.forEach((doc) => {
    const { played_at, duration_ms } = doc.data();
    const date = new Date(played_at.seconds * 1000).toISOString().split("T")[0]; // YYYY-MM-DD

    // Compare strings if dates are provided
    if (startDate && endDate) {
      if (date < startDate || date > endDate) return; // Skip if outside range
    }

    rawData.push({ date, duration_ms });
  });
  return rawData; // Return raw list of entries
}
