import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust the import based on your structure

const getUserData = async (userId) => {
  if (!userId) return null;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.error(`User ${userId} not found in Firestore`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export default getUserData;
