import { API_BASE_URL } from "./api";

export const FALLBACK_IMAGE = "/assets/small-logo.png";

// 백엔드는 사용자 이미지를 "/images/xxx.png" 같은 상대 경로로 내려준다.
// 프론트엔드 자체 오리진(Vite dev server 등)이 아닌 백엔드 오리진 기준으로 풀어줘야 한다.
export const resolveImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return `${API_BASE_URL}${path}`;
};

