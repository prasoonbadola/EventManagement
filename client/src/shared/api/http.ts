import axios from "axios";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;
  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TOKEN_KEY = "gathr.token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") || "/api";

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT authorization header
axiosInstance.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to normalize errors into ApiError
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return Promise.reject(
          new ApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again.")
        );
      }
      const data = error.response.data as {
        error?: { code?: string; message?: string; details?: Record<string, string[]> };
      };
      const e = data?.error;
      return Promise.reject(
        new ApiError(
          error.response.status,
          e?.code ?? "UNKNOWN",
          e?.message ?? "Something went wrong.",
          e?.details
        )
      );
    }
    return Promise.reject(
      new ApiError(0, "UNKNOWN", (error as Error)?.message ?? "An unexpected error occurred.")
    );
  }
);

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; params?: unknown } = {}
): Promise<T> {
  const res = await axiosInstance.request<T>({
    url: path,
    method: opts.method ?? "GET",
    data: opts.body,
    params: opts.params,
  });
  return res.data;
}
