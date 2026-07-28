import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MomentPreview from "./editor/MomentPreview";
import MusicSearchSection from "./editor/MusicSearchSection";
import StorySection from "./editor/StorySection";
import { apiRequest } from "../lib/api";
import { FALLBACK_IMAGE } from "../lib/constants";
import { normalizePostContent, POST_CONTENT_MAX_LENGTH } from "../lib/format";

const artistName = (track) => {
  if (typeof track.artist === "string") return track.artist;
  if (track.artist_name) return track.artist_name;
  if (track.artistName) return track.artistName;
  if (Array.isArray(track.artists)) {
    return track.artists
      .map((artist) => artist.name || artist.artist_name)
      .filter(Boolean)
      .join(", ");
  }
  return track.attributes?.artistName || "아티스트 정보 없음";
};

const artworkUrl = (track) => {
  const artwork = track.cover_image ||
    track.music_cover_image ||
    track.artwork_url ||
    track.artworkUrl100 ||
    track.album?.images?.[0]?.url ||
    track.attributes?.artwork?.url ||
    FALLBACK_IMAGE;
  return artwork.replace?.("{w}", "500").replace?.("{h}", "500") || FALLBACK_IMAGE;
};

const normalizeTrack = (track, index = 0) => ({
  id: String(
    track.music_id ??
    track.track_id ??
    track.trackId ??
    track.id ??
    track.attributes?.playParams?.id ??
    `result-${index}`,
  ),
  title:
    track.music_track_title ||
    track.track_title ||
    track.music_title ||
    track.trackName ||
    track.name ||
    track.attributes?.name ||
    "제목 정보 없음",
  artist: artistName(track),
  album:
    track.album_name ||
    track.collectionName ||
    track.album?.name ||
    track.attributes?.albumName ||
    "앨범 정보 없음",
  coverImage: artworkUrl(track),
  externalUrl:
    track.external_url ||
    track.trackViewUrl ||
    track.external_urls?.spotify ||
    track.attributes?.url ||
    "",
  provider: track.provider || track.source || "music-api",
});

const extractTracks = (result) => {
  const data = result?.data ?? result;
  const candidates = data?.tracks?.items ||
    data?.results?.songs?.data ||
    data?.results?.trackmatches?.track ||
    data?.tracks ||
    data?.songs ||
    data?.items ||
    data?.results ||
    data?.data ||
    [];
  return Array.isArray(candidates) ? candidates.map(normalizeTrack) : [];
};

const trackFromPost = (post) => {
  const combined = post.music_title || "";
  const parts = combined.split(" · ");
  const title = post.music_track_title || parts[0] || "";
  if (!title && !post.music_cover_image) return null;

  return normalizeTrack({
    music_id: post.music_id || post.post_id,
    music_track_title: title,
    artist: post.music_artist || parts.slice(1).join(" · ") || "아티스트 정보 없음",
    album_name: post.music_album,
    music_cover_image: post.music_cover_image,
    external_url: post.music_external_url,
    provider: post.music_provider || "saved-post",
  });
};

export default function MusicPostEditor({ mode, initialPost, onSubmit }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchStatus, setSearchStatus] = useState("두 글자 이상 입력하면 검색합니다.");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    if (!initialPost) return;
    setTitle(initialPost.post_title || "");
    setContent(normalizePostContent(initialPost.post_content || ""));
    setSelectedTrack(trackFromPost(initialPost));
  }, [initialPost]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchStatus("두 글자 이상 입력하면 검색합니다.");
      return undefined;
    }
    const timer = window.setTimeout(() => void searchMusic(), 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchMusic = async () => {
    const keyword = query.trim();
    if (keyword.length < 2) {
      setSearchStatus("두 글자 이상 입력해주세요.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setSearchStatus(`“${keyword}” 검색 중입니다.`);

    try {
      const params = new URLSearchParams({ query: keyword, limit: "10" });
      const result = await apiRequest(`/music/search?${params}`, {
        signal: controller.signal,
      });
      const tracks = extractTracks(result);
      setResults(tracks);
      setSearchStatus(
        tracks.length
          ? `${tracks.length}개의 음악을 찾았습니다.`
          : "검색 결과가 없습니다. 다른 검색어를 입력해보세요.",
      );
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setResults([]);
        setSearchStatus(requestError.message || "음악 검색 서버에 연결할 수 없습니다.");
      }
    } finally {
      if (abortRef.current === controller) setSearching(false);
    }
  };

  const selectTrack = (track) => {
    setSelectedTrack(track);
    setResults([]);
    setSearchStatus(`“${track.title}”을 선택했습니다.`);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!title.trim()) return setError("* 제목을 입력해주세요.");
    if (title.trim().length < 2) return setError("* 제목은 2글자 이상 입력해주세요.");
    if (!content.trim()) return setError("* 내용을 입력해주세요.");
    if (content.trim().length > POST_CONTENT_MAX_LENGTH) {
      return setError(`* 내용은 ${POST_CONTENT_MAX_LENGTH}자 이하로 입력해주세요.`);
    }
    if (!selectedTrack) return setError("* 포스트에 표시할 음악을 선택해주세요.");

    setSubmitting(true);
    try {
      const message = await onSubmit({
        post_title: title.trim(),
        post_content: content.trim(),
        music_id: selectedTrack.id,
        music_title: `${selectedTrack.title} · ${selectedTrack.artist}`,
        music_track_title: selectedTrack.title,
        music_artist: selectedTrack.artist,
        music_album: selectedTrack.album,
        music_cover_image: selectedTrack.coverImage,
        music_external_url: selectedTrack.externalUrl,
        music_provider: selectedTrack.provider,
      });
      setToast(message || "모멘트가 저장되었습니다.");
      window.setTimeout(() => {
        navigate("/posts", { replace: true });
      }, 500);
    } catch (requestError) {
      setError(`* ${requestError.message || "서버와 연결할 수 없습니다."}`);
      setSubmitting(false);
    }
  };

  return (
    <>
      <form className="create-form" onSubmit={submit} noValidate>
        <div className="create-layout">
          <MomentPreview
            mode={mode}
            title={title}
            content={content}
            selectedTrack={selectedTrack}
          />

          <div className="editor-panel">
            <StorySection
              title={title}
              content={content}
              onTitleChange={(value) => {
                setTitle(value);
                setError("");
              }}
              onContentChange={(value) => {
                setContent(value);
                setError("");
              }}
            />
            <MusicSearchSection
              query={query}
              results={results}
              selectedTrack={selectedTrack}
              searchStatus={searchStatus}
              searching={searching}
              onQueryChange={setQuery}
              onSearch={() => void searchMusic()}
              onSelectTrack={selectTrack}
              onClearTrack={() => setSelectedTrack(null)}
            />

            <p className="helper-text" role="alert">{error}</p>
            <div className="form-actions">
              <Link className="cancel-button" to="/posts">취소</Link>
              <button
                className={`submit-button${submitting ? " is-loading" : ""}`}
                type="submit"
                disabled={submitting}
              >
                <span className="submit-button-label">
                  {mode === "edit" ? "수정 내용 저장" : "모멘트 등록"}
                </span>
                <span className="submit-spinner" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className={`create-toast${toast ? " is-visible" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}
