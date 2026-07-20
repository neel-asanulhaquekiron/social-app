import AsyncStorage from "@react-native-async-storage/async-storage";

export async function authFetch(url, options = {}) {
  const token = await AsyncStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });
}
