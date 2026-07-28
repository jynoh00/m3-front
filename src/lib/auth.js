const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
export const AUTH_REQUIRED_EVENT = "auth:required";

export const getAccessToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(ACCESS_TOKEN_KEY);

export const saveTokens = (tokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem("postEditInfo");
};

export const notifyAuthRequired = () => {
  clearTokens();
  window.dispatchEvent(new window.Event(AUTH_REQUIRED_EVENT));
};
