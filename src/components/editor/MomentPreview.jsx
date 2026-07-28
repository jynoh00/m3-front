import { FALLBACK_IMAGE } from "../../lib/constants";

export default function MomentPreview({ mode, title, content, selectedTrack }) {
  return (
    <aside
      className="moment-preview"
      aria-label="작성 중인 포스트 미리보기"
      aria-live="polite"
    >
      <div className="preview-label">
        <span /> {mode === "edit" ? "EDIT" : "LIVE"} PREVIEW
      </div>
      <figure className={`preview-cover${selectedTrack ? " has-image" : ""}`}>
        <img
          src={selectedTrack?.coverImage || FALLBACK_IMAGE}
          alt="선택한 음악 커버"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <span className="preview-cover-placeholder">♪</span>
      </figure>
      <div className="preview-copy">
        <h2>{title.trim() || "당신의 음악 순간"}</h2>
        <p>{content.trim() || "작성한 이야기가 이곳에 미리 표시됩니다."}</p>
        <div className="preview-track">
          <span aria-hidden="true">♪</span>
          <strong>
            {selectedTrack
              ? `${selectedTrack.title} · ${selectedTrack.artist}`
              : "아직 선택한 음악이 없습니다."}
          </strong>
        </div>
      </div>
      <footer className="preview-footer">
        <span className="preview-profile" aria-hidden="true" />
        <div>
          <strong>나의 모멘트</strong>
          <span>{mode === "edit" ? "수정 중" : "지금 작성 중"}</span>
        </div>
      </footer>
    </aside>
  );
}

