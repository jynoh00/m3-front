import { getAccessToken, getRefreshToken, saveAccessToken, notifyAuthRequired } from "./auth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

const buildHeaders = (fetchOptions, auth, token, headers) => {
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  return {
    ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
};

// 백엔드 POST /token은 refresh token을 Authorization 헤더로 받는다. 동시에 여러 요청이 401을
// 받아도 재발급은 한 번만 일어나도록 진행 중인 재발급 Promise를 공유한다.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("no refresh token");

  const response = await fetch(`${API_BASE_URL}/token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const result = await parseResponse(response).catch(() => ({}));

  if (!response.ok || !result.data?.access_token) {
    throw new Error("token refresh failed");
  }

  saveAccessToken(result.data.access_token);
  return result.data.access_token;
};

export const apiRequest = async (path, options = {}) => {
  const { auth = true, redirectOn401 = auth, headers, ...fetchOptions } = options;
  const token = getAccessToken();

  const send = (bearer) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: buildHeaders(fetchOptions, auth, bearer, headers),
    });

  let response = await send(token);
  let result = await parseResponse(response).catch(() => ({}));

  const canRetryWithRefresh = response.status === 401 && auth && token && path !== "/token";

  if (canRetryWithRefresh) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      response = await send(newToken);
      result = await parseResponse(response).catch(() => ({}));
    } catch {
      // 재발급 실패 시 아래의 기존 401 처리(로그인 페이지 이동)로 넘어간다.
    }
  }

  if (response.status === 401 && redirectOn401) {
    notifyAuthRequired();
    throw new ApiError("로그인이 필요합니다.", 401, result);
  }
  if (!response.ok) {
    throw new ApiError(result.message || "요청을 처리하지 못했습니다.", response.status, result);
  }
  return result;
};
