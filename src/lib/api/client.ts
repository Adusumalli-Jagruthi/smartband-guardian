import axios from "axios";

/** Single Axios instance. Backend URL comes from VITE_API_BASE_URL — never put secrets here. */
export const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const api = axios.create({
  ...(API_BASE_URL ? { baseURL: API_BASE_URL } : {}),
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("smartband_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("smartband_token");
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  if (!API_BASE_URL) return "Backend not configured (set VITE_API_BASE_URL).";
  return err?.response?.data?.message ?? err?.message ?? "Request failed";
}
