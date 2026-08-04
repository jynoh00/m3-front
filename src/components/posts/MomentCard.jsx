import { FALLBACK_IMAGE } from "../../lib/constants";
import { formatDateTime } from "../../lib/format";

export default function MomentCard({ post, onOpen }) {
  const openWithKeyboard = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };

  return (
    <article
      className="post-card"
      tabIndex={0}
      role="button"
      aria-label={`${post.post_title} 상세 모달 열기`}
      onClick={onOpen}
      onKeyDown={openWithKeyboard}
    >
      <div className="post-card-body">
        <figure className="music-cover">
          <img
            className="music-cover-image"
            src={post.cover_image}
            alt={`${post.music_title} 커버 이미지`}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </figure>

        <div className="post-copy">
          <h2>{post.post_title}</h2>
          {post.post_content && <p className="post-excerpt">{post.post_content}</p>}
          <div className="recommended-track">
            <span className="track-title">{post.music_title}</span>
          </div>
        </div>
      </div>

      <footer className="post-card-footer">
        <div className="post-author">
          <img
            className="author-image"
            src={post.user_image || FALLBACK_IMAGE}
            alt={`${post.user_nickname || "음악친구"} 프로필 이미지`}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="author-copy">
            <strong>{post.user_nickname || "음악친구"}</strong>
            <time dateTime={post.created_at}>
              {formatDateTime(post.created_at)}
            </time>
          </div>
        </div>

        <div className="post-stats" aria-label="게시글 통계">
          <span title="좋아요"><b aria-hidden="true">♥</b> <em className="like-stat-value">{post.like_count}</em></span>
          <span title="조회수"><b aria-hidden="true">◉</b> <em className="view-stat-value">{post.view_count}</em></span>
          <span title="댓글"><b aria-hidden="true">●</b> <em className="comment-stat-value">{post.comment_count}</em></span>
        </div>
      </footer>

      <section className="card-comment-list" aria-label="내가 작성한 댓글" />
    </article>
  );
}
