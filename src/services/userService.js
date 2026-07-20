import { API_BASE_URL } from "@/constants";

export const getUserData = async (userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error fetching user data via API:", error);
    return { success: false, error: error.message || "Something went wrong" };
  }
};
