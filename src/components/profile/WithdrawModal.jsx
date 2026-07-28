export default function WithdrawModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      style={{ display: "flex" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-box" role="dialog" aria-modal="true">
        <span className="modal-icon">!</span>
        <h2>회원 탈퇴를 진행할까요?</h2>
        <p>작성한 게시글과 댓글은 삭제되며 복구할 수 없습니다.</p>

        <div className="modal-actions">
          <button className="cancel-button" type="button" onClick={onClose}>
            취소
          </button>
          <button className="confirm-button" type="button" onClick={onConfirm}>
            탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}

