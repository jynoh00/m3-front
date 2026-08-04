import { useEffect, useState } from "react";
import EditorPageLayout from "../components/editor/EditorPageLayout";
import DraftNoticeDialog from "../components/editor/DraftNoticeDialog";
import MusicPostEditor from "../components/MusicPostEditor";
import { apiRequest } from "../lib/api";
import "../styles/create.css";

export default function CreatePage() {
  const [draftMessage, setDraftMessage] = useState(null);
  const [draftAcknowledged, setDraftAcknowledged] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState(null);

  useEffect(() => {
    let active = true;

    apiRequest("/posts/new")
      .then((result) => {
        if (!active) return;
        if (result.data?.has_temp_post) {
          setDraftMessage(result.data.message);
        }
      })
      .catch(() => {
        // 임시저장 여부 확인에 실패해도 새 글 작성 자체는 계속 진행한다.
      });

    return () => {
      active = false;
    };
  }, []);

  const loadDraft = async () => {
    const result = await apiRequest("/posts/temp");
    setLoadedDraft({
      post_title: result.data.post_title,
      post_content: result.data.post_content,
      music: result.data.music,
    });
    setDraftAcknowledged(true);
  };

  return (
    <EditorPageLayout
      pageClassName="create-page"
      eyebrow="CREATE YOUR MOMENT"
      title="새로운 음악 순간"
      description="이야기와 함께 기억하고 싶은 음악을 골라보세요."
    >
      <DraftNoticeDialog
        open={Boolean(draftMessage) && !draftAcknowledged}
        message={draftMessage}
        onLoad={loadDraft}
        onDismiss={() => setDraftAcknowledged(true)}
      />

      <MusicPostEditor
        mode="create"
        initialPost={loadedDraft}
        onSubmit={async (payload) => {
          await apiRequest("/posts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          return "모멘트가 등록되었습니다.";
        }}
        onSaveDraft={async (payload) => {
          await apiRequest("/posts/temp", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }}
      />
    </EditorPageLayout>
  );
}
