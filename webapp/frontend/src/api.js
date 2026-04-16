export const API_URI = import.meta.env.VITE_API_URI || "";

export function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(API_URI + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}