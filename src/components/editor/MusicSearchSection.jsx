import { FALLBACK_IMAGE } from "../../lib/constants";

export default function MusicSearchSection({
  mode,
  query,
  results,
  selectedTrack,
  searchStatus,
  searching,
  onModeChange,
  onQueryChange,
  onSearch,
  onSelectTrack,
  onClearTrack,
}) {
  const isLinkMode = mode === "link";

  return (
    <section className="form-section music-section" aria-labelledby="music-section-title">
      <div className="section-heading">
        <span>02</span>
        <div>
          <h2 id="music-section-title">추천 음악</h2>
          <p>곡명이나 가수명을 입력하거나, 유튜브/스포티파이 링크로 음악을 찾아 선택하세요.</p>
        </div>
      </div>

      <div className="music-mode-tabs" role="tablist" aria-label="음악 검색 방법">
        <button
          type="button"
          role="tab"
          aria-selected={!isLinkMode}
          className={!isLinkMode ? "is-active" : ""}
          onClick={() => onModeChange("keyword")}
        >
          일반 검색
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isLinkMode}
          className={isLinkMode ? "is-active" : ""}
          onClick={() => onModeChange("link")}
        >
          링크로 검색
        </button>
      </div>

      <div className="music-search-row">
        <label className="sr-only" htmlFor="music-search-input">
          {isLinkMode ? "음악 링크" : "음악 검색"}
        </label>
        <input
          id="music-search-input"
          type={isLinkMode ? "url" : "search"}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearch();
            }
          }}
          autoComplete="off"
          placeholder={isLinkMode ? "유튜브 또는 스포티파이 링크를 입력하세요" : "곡명 또는 가수명 검색"}
        />
        <button type="button" onClick={onSearch} disabled={searching}>
          {isLinkMode
            ? searching ? "가져오는 중" : "가져오기"
            : searching ? "검색 중" : "검색"}
        </button>
      </div>

      <p className="music-search-status" role="status">{searchStatus}</p>
      <div
        className={`music-result-list${results.length ? " has-results" : ""}`}
        role="listbox"
        aria-label="음악 검색 결과"
      >
        {results.map((track) => (
          <button
            className="music-result-item"
            type="button"
            role="option"
            key={track.id}
            onClick={() => onSelectTrack(track)}
          >
            <img
              src={track.coverImage}
              alt=""
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <span className="music-result-copy">
              <strong>{track.title}</strong>
              <span>{track.artist}</span>
            </span>
            <span className="music-result-select">선택</span>
          </button>
        ))}
      </div>

      {selectedTrack && (
        <div className="selected-music">
          <img src={selectedTrack.coverImage} alt={`${selectedTrack.title} 앨범 커버`} />
          <div>
            <span>선택한 음악</span>
            <strong>{selectedTrack.title}</strong>
            <p>{selectedTrack.artist}</p>
          </div>
          <button type="button" aria-label="선택한 음악 해제" onClick={onClearTrack}>×</button>
        </div>
      )}
    </section>
  );
}

