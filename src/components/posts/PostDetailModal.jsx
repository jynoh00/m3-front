import CommentItem from "./CommentItem";
import { formatDateTime } from "../../lib/format";

export default function PostDetailModal({
  dialogRef,
  post,
  comments,
  comment,
  editingId,
  editingContent,
  liking,
  toast,
  isOwner,
  currentUserId,
  onClose,
  onEditPost,
  onDeletePost,
  onLike,
  onCommentChange,
  onSubmitComment,
  onEditingContentChange,
  onSaveComment,
  onCancelCommentEdit,
  onStartCommentEdit,
  onDeleteComment,
  onOpenReport,
}) {
  return (
    <dialog
      ref={dialogRef}
      className="post-detail-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <article className="detail-card">
        <button className="detail-close-button" type="button" onClick={onClose}>
          ×
        </button>

        <div className="detail-scroll-area">
          <header className="detail-header">
            <p className="detail-eyebrow">MUSIC MOMENT</p>
            <h2>{post.post_title}</h2>

            <div className="detail-info-row">
              <div className="detail-author">
                <span
                  className="detail-profile-image"
                  style={post.user_image ? { backgroundImage: `url(${post.user_image})` } : undefined}
                />
                <div className="detail-author-copy">
                  <strong>{post.user_nickname || "음악친구"}</strong>
                  <time>{formatDateTime(post.created_at)}</time>
                </div>
              </div>

              <div className="detail-post-actions">
                {isOwner && (
                  <>
                    <button className="detail-outline-button" type="button" onClick={onEditPost}>수정</button>
                    <button className="detail-outline-button is-delete" type="button" onClick={onDeletePost}>삭제</button>
                  </>
                )}
                <button className="detail-outline-button is-delete" type="button" onClick={onOpenReport}>신고</button>
              </div>
            </div>
          </header>

          <div className="detail-divider" />

          <section className="detail-moment">
            <figure className="detail-music-cover">
              <img src={post.cover_image} alt="추천 음악 커버 이미지" />
            </figure>
            <div className="detail-moment-copy">
              <span className="detail-track-label">NOW PLAYING</span>
              <strong>{post.music_title} · {post.artist_name}</strong>
              <p className="detail-post-body">{post.post_content}</p>
            </div>
          </section>

          <div className="detail-stat-list">
            <button
              className={`detail-stat-box detail-like-button${post.is_liked ? " is-liked" : ""}`}
              type="button"
              aria-pressed={post.is_liked}
              aria-label={post.is_liked ? "좋아요 취소" : "좋아요"}
              disabled={liking}
              onClick={onLike}
            >
              <strong>{post.like_count}</strong>
              <span>{post.is_liked ? "♥ 좋아요" : "♡ 좋아요"}</span>
            </button>
            <div className="detail-stat-box"><strong>{post.view_count}</strong><span>조회수</span></div>
            <div className="detail-stat-box"><strong>{post.comment_count}</strong><span>댓글</span></div>
          </div>

          <section className="detail-comment-area">
            <div className="detail-section-heading"><h3>COMMENTS</h3><i /></div>
            <form className="detail-comment-form" onSubmit={onSubmitComment}>
              <textarea
                className="detail-comment-textarea"
                value={comment}
                onChange={(event) => onCommentChange(event.target.value)}
                maxLength={500}
                placeholder="이 모멘트에 댓글을 남겨주세요."
              />
              <div className="detail-comment-submit-row">
                <span><b>{comment.length}</b>/500</span>
                <button className="detail-comment-submit-button" type="submit">댓글 등록</button>
              </div>
            </form>

            <div className="detail-comment-list">
              {comments.length ? comments.map((item) => (
                <CommentItem
                  key={item.comment_id}
                  item={item}
                  isOwner={currentUserId != null && String(item.user_id) === currentUserId}
                  editing={editingId === item.comment_id}
                  editingContent={editingContent}
                  onEditingContentChange={onEditingContentChange}
                  onSave={() => onSaveComment(item.comment_id)}
                  onCancel={onCancelCommentEdit}
                  onStartEdit={() => onStartCommentEdit(item)}
                  onDelete={() => onDeleteComment(item.comment_id)}
                />
              )) : (
                <p className="detail-comment-empty">첫 댓글을 남겨보세요.</p>
              )}
            </div>
          </section>
        </div>
      </article>

      <div className={`post-toast modal-post-toast${toast ? " is-visible" : ""}`}>
        {toast}
      </div>
    </dialog>
  );
}
