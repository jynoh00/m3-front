import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EditorPageLayout from "../components/editor/EditorPageLayout";
import MusicPostEditor from "../components/MusicPostEditor";
import { ApiError, apiRequest } from "../lib/api";
import "../styles/edit.css";

export default function EditPage() {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) {
      setError("게시글 정보가 없습니다.");
      return;
    }

    const controller = new AbortController();
    setPost(null);
    setError("");

    apiRequest(`/posts/${postId}/edit`, {
      signal: controller.signal,
    })
      .then((result) => {
        setPost(result.data);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;

        setError(
          requestError instanceof ApiError && requestError.status === 403
            ? "게시글을 수정할 권한이 없습니다."
            : requestError.message ||
                "게시글 수정 정보를 불러오지 못했습니다.",
        );
      });

    return () => controller.abort();
  }, [postId]);

  return (
    <EditorPageLayout
      pageClassName="edit-page"
      eyebrow="EDIT YOUR MOMENT"
      title="음악 순간 수정"
      description="기록한 이야기와 음악을 새롭게 다듬어보세요."
    >
      {error ? (
        <p className="helper-text">{error}</p>
      ) : post ? (
        <MusicPostEditor
          mode="edit"
          initialPost={post}
          onSubmit={async (payload) => {
            await apiRequest(`/posts/${postId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
            return "모멘트가 수정되었습니다.";
          }}
        />
      ) : (
        <p className="music-search-status">수정 정보를 불러오는 중입니다.</p>
      )}
    </EditorPageLayout>
  );
}
