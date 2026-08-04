import { useEffect, useRef, useState } from "react";
import { describeError } from "../../lib/errorMessages";

// 백엔드에 임시저장 글의 본문을 다시 읽어오는 GET /posts/temp, GET /posts/{id}/temp가
// 추가되어, 실제로 제목/내용/음악을 불러와 에디터에 채워 넣는다.
export default function DraftNoticeDialog({ open, message, onLoad, onDismiss }) {
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await onLoad();
    } catch (requestError) {
      setError(describeError(requestError, "임시저장 글을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="draft-modal"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <span className="draft-modal-icon">!</span>
      <h2>임시저장된 글이 있어요</h2>
      <p>{message || "작성 중인 임시 저장 글이 있습니다."}</p>
      <p className="draft-modal-caution">
        불러오면 지금 화면의 내용은 임시저장 글로 대체됩니다.
      </p>
      {error && <p className="draft-modal-error">{error}</p>}
      <div className="draft-modal-actions">
        <button className="draft-modal-cancel" type="button" onClick={onDismiss} disabled={loading}>
          새로 작성
        </button>
        <button className="draft-modal-confirm" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "불러오는 중" : "불러오기"}
        </button>
      </div>
    </dialog>
  );
}
