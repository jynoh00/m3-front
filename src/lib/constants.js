import { API_BASE_URL } from "./api";

export const FALLBACK_IMAGE = "/assets/small-logo.png";

export const resolveImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return `${API_BASE_URL}${path}`;
};

