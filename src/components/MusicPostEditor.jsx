import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MomentPreview from "./editor/MomentPreview";
import MusicSearchSection from "./editor/MusicSearchSection";
import StorySection from "./editor/StorySection";
import { apiRequest } from "../lib/api";
import { describeError } from "../lib/errorMessages";
import { FALLBACK_IMAGE } from "../lib/constants";
import { normalizePostContent, POST_CONTENT_MAX_LENGTH } from "../lib/format";

// 백엔드 MusicSearchResultDTO: { music_id, music_title, cover_image, artists: [{artist_id, artist_name}] }
const normalizeTrack = (track) => {
  const artists = (track.artists || [])
    .map((artist) => artist.artist_name)
    .filter(Boolean);

  return {
    musicId: track.music_id,
    title: track.music_title || "제목 정보 없음",
    artists: artists.length ? artists : ["아티스트 정보 없음"],
    artist: artists.length ? artists.join(", ") : "아티스트 정보 없음",
    coverImage: track.cover_image || FALLBACK_IMAGE,
  };
};

const extractTracks = (result) =>
  Array.isArray(result?.data?.results) ? result.data.results.map(normalizeTrack) : [];

// GET /posts/{id}/edit 응답(PostEditFormResponseDTO)의 music 필드도 동일한 MusicSearchResultDTO 모양이다.
const trackFromPost = (post) => (post.music ? normalizeTrack(post.music) : null);

export default function MusicPostEditor({
  mode,
  initialPost,
  onSubmit,
  onSaveDraft,
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchStatus, setSearchStatus] = useState("두 글자 이상 입력하면 검색합니다.");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
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
    setSearchStatus(`"${keyword}" 검색 중입니다.`);

    try {
      const params = new URLSearchParams({ keyword });
      const result = await apiRequest(`/musics/search?${params}`, {
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
        setSearchStatus(describeError(requestError, "음악 검색 서버에 연결할 수 없습니다."));
      }
    } finally {
      if (abortRef.current === controller) setSearching(false);
    }
  };

  const selectTrack = (track) => {
    setSelectedTrack(track);
    setResults([]);
    setSearchStatus(`"${track.title}"을 선택했습니다.`);
    setError("");
  };

  const buildPayload = () => ({
    post_title: title.trim(),
    post_content: content.trim(),
    music_title: selectedTrack?.title ?? "",
    cover_image: selectedTrack?.coverImage ?? "",
    artist_names: selectedTrack?.artists ?? [],
  });

  const validate = () => {
    if (!title.trim()) return "* 제목을 입력해주세요.";
    if (title.trim().length < 2) return "* 제목은 2글자 이상 입력해주세요.";
    if (!content.trim()) return "* 내용을 입력해주세요.";
    if (content.trim().length > POST_CONTENT_MAX_LENGTH) {
      return `* 내용은 ${POST_CONTENT_MAX_LENGTH}자 이하로 입력해주세요.`;
    }
    if (!selectedTrack) return "* 포스트에 표시할 음악을 선택해주세요.";
    return "";
  };

  // 백엔드는 POST /posts/temp, POST /posts/{id}/temp에 @Valid를 적용하지 않고,
  // TempPost.artistMusic도 nullable이라 임시저장은 음악 선택 없이도 가능하다.
  const validateDraft = () => {
    if (!title.trim()) return "* 제목을 입력해주세요.";
    if (title.trim().length < 2) return "* 제목은 2글자 이상 입력해주세요.";
    if (!content.trim()) return "* 내용을 입력해주세요.";
    if (content.trim().length > POST_CONTENT_MAX_LENGTH) {
      return `* 내용은 ${POST_CONTENT_MAX_LENGTH}자 이하로 입력해주세요.`;
    }
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setSubmitting(true);
    try {
      const message = await onSubmit(buildPayload());
      setToast(message || "모멘트가 저장되었습니다.");
      window.setTimeout(() => {
        navigate("/posts", { replace: true });
      }, 500);
    } catch (requestError) {
      setError(`* ${describeError(requestError, "서버와 연결할 수 없습니다.")}`);
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (!onSaveDraft || savingDraft) return;
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSavingDraft(true);
    try {
      await onSaveDraft(buildPayload());
      setToast("임시저장되었습니다.");
    } catch (requestError) {
      setError(`* ${describeError(requestError, "임시저장에 실패했습니다.")}`);
    } finally {
      setSavingDraft(false);
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
              {onSaveDraft && (
                <button
                  className="cancel-button"
                  type="button"
                  disabled={savingDraft || submitting}
                  onClick={() => void saveDraft()}
                >
                  {savingDraft ? "임시저장 중" : "임시저장"}
                </button>
              )}
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
