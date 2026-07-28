export const POST_CONTENT_MAX_LENGTH = 100;

export const normalizePostContent = (content) =>
  String(content ?? "").slice(0, POST_CONTENT_MAX_LENGTH);

export const formatDateTime = (dateString) => {
  const date = new Date(dateString || "");
  if (Number.isNaN(date.getTime())) return "날짜 정보 없음";
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ];
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${parts.join("-")} ${time}`;
};