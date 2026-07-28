import { getAccessToken, notifyAuthRequired } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const parseResponse = async (response) => {
  if (response.status === 204) return {};
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  return text ? { message: text } : {};
};

export const apiRequest = async (path, options = {}) => {
  const { auth = true, redirectOn401 = auth, headers, ...fetchOptions } = options;
  const token = getAccessToken();
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const result = await parseResponse(response).catch(() => ({}));

  if (response.status === 401 && redirectOn401) {
    notifyAuthRequired();
    throw new ApiError("로그인이 필요합니다.", 401, result);
  }
  if (!response.ok) {
    throw new ApiError(result.message || "요청을 처리하지 못했습니다.", response.status, result);
  }
  return result;
};
