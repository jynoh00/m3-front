import { FALLBACK_IMAGE } from "../../lib/constants";
import { formatDateTime } from "../../lib/format";

export default function CommentItem({
  item,
  editing,
  editingContent,
  checking,
  checkingAnyComment,
  onEditingContentChange,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}) {
  return (
    <article className="detail-comment-item">
      <img
        className="detail-comment-image"
        src={item.user_image || FALLBACK_IMAGE}
        alt=""
        onError={(event) => {
          event.currentTarget.src = FALLBACK_IMAGE;
        }}
      />

      <div className="detail-comment-copy">
        <div className="detail-comment-header">
          <strong>{item.user_nickname}</strong>
          <time>{formatDateTime(item.updated_at || item.created_at)}</time>
        </div>

        {editing ? (
          <textarea
            className="detail-comment-edit-textarea"
            value={editingContent}
            onChange={(event) => onEditingContentChange(event.target.value)}
          />
        ) : (
          <p>{item.comment_content}</p>
        )}
      </div>

      <div className="detail-comment-actions">
        {editing ? (
          <>
            <button className="card-comment-action" type="button" onClick={onSave}>
              저장
            </button>
            <button className="card-comment-action" type="button" onClick={onCancel}>
              취소
            </button>
          </>
        ) : (
          <>
            <button
              className="card-comment-action"
              type="button"
              disabled={checkingAnyComment}
              onClick={onStartEdit}
            >
              {checking ? "확인 중" : "수정"}
            </button>
            <button
              className="card-comment-action is-delete"
              type="button"
              onClick={onDelete}
            >
              삭제
            </button>
          </>
        )}
      </div>
    </article>
  );
}

