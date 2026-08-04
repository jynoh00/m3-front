import { ApiError } from "./api";

// 백엔드 common/ExceptionMessage.java, ValidationMessage.java 의 snake_case 코드 → 한국어 UI 문구.
const MESSAGES = {
  // 인증/인가
  password_failed: "비밀번호가 올바르지 않습니다.",
  user_email_not_found: "존재하지 않는 계정입니다.",
  invalid_refresh_token: "로그인이 만료되었습니다. 다시 로그인해주세요.",
  expired_refresh_token: "로그인이 만료되었습니다. 다시 로그인해주세요.",
  unauthorized: "로그인이 필요합니다.",

  // 사용자
  user_not_found: "사용자를 찾을 수 없습니다.",
  duplicated_user_email: "이미 사용 중인 이메일입니다.",
  duplicated_user_nickname: "이미 사용 중인 닉네임입니다.",
  mismatch_user_password: "비밀번호가 일치하지 않습니다.",
  no_user_update_changes: "변경된 내용이 없습니다.",

  // 게시글
  post_not_found: "존재하지 않거나 삭제된 게시글입니다.",
  post_deleted: "삭제된 게시글입니다.",
  post_create_limit_exceeded: "짧은 시간 내에 너무 많은 게시글을 작성했습니다. 잠시 후 다시 시도해주세요.",
  post_update_forbidden: "게시글을 수정할 권한이 없습니다.",
  post_delete_forbidden: "게시글을 삭제할 권한이 없습니다.",
  post_report_already_exists: "이미 신고한 게시글입니다.",
  already_blinded_post: "이미 숨김 처리된 게시글입니다.",
  "can't_access_to_blinded_post": "관리자에 의해 숨김 처리된 게시글입니다.",

  // 음악
  music_not_selected: "음악을 선택해주세요.",
  search_keyword_required: "검색어를 입력해주세요.",

  // 댓글
  comment_not_found: "존재하지 않는 댓글입니다.",
  comment_not_in_post: "해당 게시글의 댓글이 아닙니다.",
  comment_edit_forbidden: "댓글을 수정할 권한이 없습니다.",
  comment_delete_forbidden: "댓글을 삭제할 권한이 없습니다.",

  // 신고
  report_reason_required: "신고 사유를 입력해주세요.",

  // 공통 HTTP
  invalid_request_body: "요청 형식이 올바르지 않습니다.",
  invalid_input_format: "입력값을 다시 확인해주세요.",
  not_found_url: "요청하신 페이지를 찾을 수 없습니다.",
  invalid_page: "잘못된 페이지 요청입니다.",
  internal_server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export const translateMessage = (code) => (code && MESSAGES[code]) || null;

// ApiError는 message가 백엔드의 snake_case 코드이므로 사전에서 변환하고,
// 직접 작성한 Error는 이미 한국어 문구이므로 그대로 사용한다.
export const describeError = (error, fallback) => {
  if (error instanceof ApiError) return translateMessage(error.message) || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
