import { API_BASE_URL } from "@/constants";
import { authFetch } from "./apiClient";

export const getUserData = async (userId) => {
  try {
    const res = await authFetch(`${API_BASE_URL}/users/${userId}`);

    return await res.json();
  } catch (error) {
    console.error("Error fetching user data:", error);

    return {
      success: false,
      msg: error.message || "Something went wrong",
    };
  }
};
