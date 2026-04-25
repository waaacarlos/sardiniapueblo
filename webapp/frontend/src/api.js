export const API_URI = import.meta.env.VITE_API_URI || "";
export const ADMIN_CHAT_ID = import.meta.env.VITE_ADMIN_CHAT_ID || "";

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