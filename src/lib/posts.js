import { FALLBACK_IMAGE } from "./constants";
import { normalizePostContent } from "./format";

const asBoolean = (value) => value === true || value === 1 || value === "true";

// 목록(PostSummaryDTO)은 music_title/cover_image/artist_name을 최상위 필드로 주고,
// 상세(PostDetailResponseDTO)는 music: { music_title, cover_image, artists } 로 준다.
// PostsPage는 목록 아이템에 상세 응답을 덮어씌워 사용하므로 두 모양을 모두 흡수한다.
export const normalizePost = (post) => {
  const music = post.music || null;
  const artistNames = music?.artists?.length
    ? music.artists.map((artist) => artist.artist_name).filter(Boolean).join(", ")
    : post.artist_name || "";

  return {
    ...post,
    post_id: String(post.post_id),
    post_title: post.post_title || "제목 없는 모멘트",
    post_content: normalizePostContent(post.post_content ?? "공유된 내용이 없습니다."),
    music_title: music?.music_title || post.music_title || "추천 음악 미등록",
    cover_image: music?.cover_image || post.cover_image || FALLBACK_IMAGE,
    artist_name: artistNames || "아티스트 정보 없음",
    like_count: Number(post.like_count) || 0,
    is_liked: asBoolean(post.is_liked),
    comment_count: Number(post.comment_count) || 0,
    view_count: Number(post.view_count) || 0,
    report_count: Number(post.report_count) || 0,
    blinded_at: post.blinded_at ?? null,
  };
};

export const normalizeComment = (comment) => ({
  comment_id: String(comment.comment_id),
  comment_content: comment.comment_content,
  user_id: comment.user_id,
  user_nickname: comment.user_nickname || "음악친구",
  user_image: comment.user_image || FALLBACK_IMAGE,
  created_at: comment.created_at,
  updated_at: comment.updated_at,
});
