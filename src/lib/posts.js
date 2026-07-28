import { FALLBACK_IMAGE } from "./constants";
import { normalizePostContent } from "./format";

const asBoolean = (value) =>
  value === true || value === 1 || value === "true";

export const likedStateFrom = (post) =>
  post.is_liked ??
  post.liked ??
  post.increase_like_count ??
  post.is_like ??
  false;

export const normalizePost = (post) => ({
  ...post,
  post_id: String(post.post_id),
  post_title: post.post_title || "제목 없는 모멘트",
  post_content: normalizePostContent(
    post.post_content || post.content || "공유된 내용이 없습니다.",
  ),
  music_title:
    post.music_title || post.recommended_music_title || "추천 음악 미등록",
  music_cover_image:
    post.music_cover_image || post.recommended_music_cover || FALLBACK_IMAGE,
  like_count: Number(post.like_count) || 0,
  is_liked: asBoolean(likedStateFrom(post)),
  comment_count: Number(post.comment_count) || 0,
  view_count: Number(post.view_count) || 0,
});

export const normalizeComment = (comment) => ({
  comment_id: String(comment.comment_id ?? comment.id),
  comment_content: comment.comment_content ?? comment.content ?? "",
  user_id: comment.user_id ?? comment.userId ?? null,
  user_nickname: comment.user_nickname ?? comment.nickname ?? "음악친구",
  user_image: comment.user_image ?? comment.profile_image ?? FALLBACK_IMAGE,
  created_at: comment.created_at ?? new Date().toISOString(),
  updated_at: comment.updated_at ?? null,
});
