import { useEffect, useRef } from "react";

// 백엔드에는 임시저장된 글의 본문을 다시 읽어오는 API가 없다(temp_post_id만 반환).
// 따라서 "불러오기"가 아니라 임시저장 글이 존재한다는 사실과, 계속 작성 시
// 그 임시글이 최신 내용으로 덮어써진다는 점을 안내하는 용도로만 사용한다.
export default function DraftNoticeDialog({ open, message, onContinue, onDismiss }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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
        임시저장된 이전 내용은 다시 불러올 수 없어요. 계속 작성 후 임시저장하면 최신 내용으로 덮어씌워집니다.
      </p>
      <div className="draft-modal-actions">
        <button className="draft-modal-cancel" type="button" onClick={onDismiss}>
          목록으로
        </button>
        <button className="draft-modal-confirm" type="button" onClick={onContinue}>
          계속 작성
        </button>
      </div>
    </dialog>
  );
}
