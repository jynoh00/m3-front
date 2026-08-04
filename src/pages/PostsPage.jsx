import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import MomentCard from "../components/posts/MomentCard";
import PostDetailModal from "../components/posts/PostDetailModal";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/api";
import { describeError } from "../lib/errorMessages";
import { normalizeComment, normalizePost } from "../lib/posts";
import "../styles/posts.css";

export default function PostsPage() {
  const { user } = useAuth();
  const currentUserId = user?.user_id != null ? String(user.user_id) : null;

  const [posts, setPosts] = useState([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [active, setActive] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsHasNext, setCommentsHasNext] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [liking, setLiking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const sentinel = useRef(null);
  const detailDialog = useRef(null);
  const reportDialog = useRef(null);
  const nextPage = useRef(1);
  const requestInFlight = useRef(false);
  const hasNextPage = useRef(true);
  const commentsLoadedPages = useRef(0);
  const commentsHasNextPage = useRef(false);
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updatePost = (next) => {
    setActive(next);
    setPosts((items) =>
      items.map((item) => item.post_id === next.post_id ? next : item),
    );
  };

  const loadPosts = useCallback(async () => {
    if (requestInFlight.current || !hasNextPage.current) return;

    const requestedPage = nextPage.current;
    requestInFlight.current = true;
    setLoading(true);
    setLoadError("");

    try {
      const result = await apiRequest(`/posts?page=${requestedPage}`);
      if (!Array.isArray(result.data?.posts)) {
        throw new Error("게시글 응답 형식이 올바르지 않습니다.");
      }

      const next = result.data.posts.map(normalizePost);
      setPosts((current) => {
        const postsById = new Map(
          current.map((post) => [post.post_id, post]),
        );
        next.forEach((post) => postsById.set(post.post_id, post));
        return [...postsById.values()];
      });

      const responsePage = Number(result.data.page ?? requestedPage);
      const totalPages = Number(result.data.total_pages ?? responsePage);
      const canLoadMore = responsePage < totalPages;

      nextPage.current = requestedPage + 1;
      hasNextPage.current = canLoadMore;
      setHasNext(canLoadMore);
    } catch (error) {
      setLoadError(describeError(error, "게시글 목록을 불러오지 못했습니다."));
      hasNextPage.current = false;
      setHasNext(false);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNext) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadPosts();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNext, loadPosts]);

  useEffect(() => {
    const dialog = detailDialog.current;
    if (active && dialog && !dialog.open) dialog.showModal();
  }, [active]);

  useEffect(() => {
    const dialog = reportDialog.current;
    if (!dialog) return;
    if (reportOpen && !dialog.open) dialog.showModal();
    if (!reportOpen && dialog.open) dialog.close();
  }, [reportOpen]);

  const fetchCommentsPages = async (postId, pageCount) => {
    let items = [];
    let lastData = null;

    for (let page = 1; page <= pageCount; page += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await apiRequest(`/posts/${postId}/comments?page=${page}`);
      lastData = result.data;
      items = items.concat((result.data?.comments || []).map(normalizeComment));
    }

    return { items, lastData };
  };

  const openDetail = async (post) => {
    setActive(post);
    setComments([]);
    setEditingId(null);
    setReportOpen(false);
    setReportReason("");
    commentsLoadedPages.current = 0;
    commentsHasNextPage.current = false;
    setCommentsHasNext(false);

    try {
      const [detail, commentResult] = await Promise.all([
        apiRequest(`/posts/${post.post_id}`),
        apiRequest(`/posts/${post.post_id}/comments?page=1`),
      ]);
      const nextPost = normalizePost({ ...post, ...detail.data });
      const nextComments = (commentResult.data?.comments || []).map(
        normalizeComment,
      );
      const totalCount = Number(commentResult.data?.total_count);
      nextPost.comment_count = Number.isFinite(totalCount) ? totalCount : nextComments.length;
      updatePost(nextPost);
      setComments(nextComments);

      commentsLoadedPages.current = 1;
      const totalPages = Number(commentResult.data?.total_pages) || 1;
      commentsHasNextPage.current = totalPages > 1;
      setCommentsHasNext(commentsHasNextPage.current);
    } catch (error) {
      setActive(null);
      showToast(describeError(error, "상세 내용을 불러오지 못했습니다."));
    }
  };

  const loadMoreComments = async () => {
    if (!active || commentsLoadingMore || !commentsHasNextPage.current) return;

    const requestedPage = commentsLoadedPages.current + 1;
    setCommentsLoadingMore(true);

    try {
      const result = await apiRequest(`/posts/${active.post_id}/comments?page=${requestedPage}`);
      const next = (result.data?.comments || []).map(normalizeComment);
      setComments((current) => [...current, ...next]);

      commentsLoadedPages.current = requestedPage;
      const totalPages = Number(result.data?.total_pages) || requestedPage;
      commentsHasNextPage.current = requestedPage < totalPages;
      setCommentsHasNext(commentsHasNextPage.current);
    } catch (error) {
      showToast(describeError(error, "댓글을 더 불러오지 못했습니다."));
    } finally {
      setCommentsLoadingMore(false);
    }
  };

  const like = async () => {
    if (!active || liking) return;
    setLiking(true);

    try {
      const result = await apiRequest(`/posts/${active.post_id}/like`, {
        method: "POST",
      });
      const responseLikeCount = Number(result.data?.like_count);
      const responseLiked = result.data?.increase_like_count;
      updatePost({
        ...active,
        like_count: Number.isFinite(responseLikeCount)
          ? responseLikeCount
          : active.like_count,
        is_liked: typeof responseLiked === "boolean"
          ? responseLiked
          : active.is_liked,
      });
    } catch (error) {
      showToast(describeError(error, "좋아요 처리에 실패했습니다."));
    } finally {
      setLiking(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!active || !comment.trim()) return;

    try {
      await apiRequest(`/posts/${active.post_id}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment_content: comment.trim() }),
      });

      const pagesToReload = Math.max(commentsLoadedPages.current, 1);
      const { items, lastData } = await fetchCommentsPages(active.post_id, pagesToReload);
      setComments(items);

      const totalCount = Number(lastData?.total_count);
      updatePost({ ...active, comment_count: Number.isFinite(totalCount) ? totalCount : items.length });

      const totalPages = Number(lastData?.total_pages) || pagesToReload;
      commentsLoadedPages.current = pagesToReload;
      commentsHasNextPage.current = pagesToReload < totalPages;
      setCommentsHasNext(commentsHasNextPage.current);

      setComment("");
      showToast("댓글이 등록되었습니다.");
    } catch (error) {
      showToast(describeError(error, "댓글 등록에 실패했습니다."));
    }
  };

  const saveComment = async (commentId) => {
    if (!active || !editingContent.trim()) return;

    try {
      await apiRequest(`/posts/${active.post_id}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ comment_content: editingContent.trim() }),
      });
      setComments((items) => items.map((item) =>
        item.comment_id === commentId
          ? {
              ...item,
              comment_content: editingContent.trim(),
              updated_at: new Date().toISOString(),
            }
          : item,
      ));
      setEditingId(null);
      showToast("댓글이 수정되었습니다.");
    } catch (error) {
      showToast(describeError(error, "댓글 수정에 실패했습니다."));
    }
  };

  const startCommentEdit = (item) => {
    if (!active) return;
    if (currentUserId == null || String(item.user_id) !== currentUserId) {
      showToast("댓글을 수정할 권한이 없습니다.");
      return;
    }
    setEditingId(item.comment_id);
    setEditingContent(item.comment_content);
  };

  const deleteComment = async (commentId) => {
    if (!active || !window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await apiRequest(`/posts/${active.post_id}/comments/${commentId}`, {
        method: "DELETE",
      });

      const pagesToReload = Math.max(commentsLoadedPages.current, 1);
      const { items, lastData } = await fetchCommentsPages(active.post_id, pagesToReload);
      setComments(items);

      const totalCount = Number(lastData?.total_count);
      updatePost({ ...active, comment_count: Number.isFinite(totalCount) ? totalCount : items.length });

      const totalPages = Number(lastData?.total_pages) || 0;
      commentsLoadedPages.current = Math.min(pagesToReload, totalPages || pagesToReload);
      commentsHasNextPage.current = commentsLoadedPages.current < totalPages;
      setCommentsHasNext(commentsHasNextPage.current);

      showToast("댓글이 삭제되었습니다.");
    } catch (error) {
      showToast(describeError(error, "댓글 삭제에 실패했습니다."));
    }
  };

  const editPost = () => {
    if (!active) return;
    navigate(`/posts/${encodeURIComponent(active.post_id)}/edit`);
  };

  const deletePost = async () => {
    if (!active || !window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      await apiRequest(`/posts/${active.post_id}`, { method: "DELETE" });
      setPosts((items) => items.filter((item) => item.post_id !== active.post_id));
      setActive(null);
      showToast("게시글이 삭제되었습니다.");
    } catch (error) {
      showToast(describeError(error, "게시글 삭제에 실패했습니다."));
    }
  };

  const openReport = () => {
    if (!active) return;
    setReportReason("");
    setReportOpen(true);
  };

  const closeReport = () => setReportOpen(false);

  const submitReport = async (event) => {
    event.preventDefault();
    if (!active || !reportReason.trim() || reportSubmitting) return;

    setReportSubmitting(true);
    try {
      await apiRequest(`/posts/${active.post_id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      setReportOpen(false);
      setReportReason("");
      showToast("신고가 접수되었습니다.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        showToast("이미 신고한 게시글입니다.");
        setReportOpen(false);
      } else {
        showToast(describeError(error, "신고 접수에 실패했습니다."));
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="posts-page">
      <UserHeader />

      <main className="board-main">
        <section className="board-section">
          <div className="board-top">
            <div className="board-copy">
              <p className="eyebrow">SHARE YOUR MOMENT</p>
              <h1>지금 당신의 음악 순간을 공유하세요</h1>
              <p className="board-description">
                오늘의 이야기와 함께 듣고 싶은 음악을 추천해보세요.
              </p>
            </div>
            <Link className="write-button" to="/posts/new">
              <span>+</span>
              모멘트 생성
            </Link>
          </div>

          <div className="list-heading"><span>RECENT MUSIC MOMENTS</span><i /></div>
          <p className="post-list-guide">
            포스트를 선택하면 상세 내용과 댓글을 한 화면에서 볼 수 있어요.
          </p>

          <div className="post-list">
            {posts.map((post) => (
              <MomentCard
                key={post.post_id}
                post={post}
                onOpen={() => void openDetail(post)}
              />
            ))}
            {!loading && loadError && (
              <p className="empty-message">{loadError}</p>
            )}
            {!loading && !loadError && !posts.length && (
              <p className="empty-message">아직 공유된 모멘트가 없습니다.</p>
            )}
            <div ref={sentinel} />
          </div>
        </section>
      </main>

      {active && (
        <PostDetailModal
          dialogRef={detailDialog}
          post={active}
          comments={comments}
          commentsHasNext={commentsHasNext}
          commentsLoadingMore={commentsLoadingMore}
          onLoadMoreComments={() => void loadMoreComments()}
          comment={comment}
          editingId={editingId}
          editingContent={editingContent}
          liking={liking}
          toast={toast}
          isOwner={currentUserId != null && String(active.user_id) === currentUserId}
          currentUserId={currentUserId}
          onClose={() => setActive(null)}
          onEditPost={editPost}
          onDeletePost={() => void deletePost()}
          onLike={() => void like()}
          onCommentChange={setComment}
          onSubmitComment={submitComment}
          onEditingContentChange={setEditingContent}
          onSaveComment={(commentId) => void saveComment(commentId)}
          onCancelCommentEdit={() => setEditingId(null)}
          onStartCommentEdit={startCommentEdit}
          onDeleteComment={(commentId) => void deleteComment(commentId)}
          onOpenReport={openReport}
        />
      )}

      {active && (
        <dialog
          ref={reportDialog}
          className="confirm-modal report-modal"
          onCancel={(event) => {
            event.preventDefault();
            closeReport();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeReport();
          }}
        >
          <form onSubmit={submitReport}>
            <span className="confirm-modal-icon">!</span>
            <h2>게시글을 신고할까요?</h2>
            <p>신고 사유를 입력해주세요. 접수된 신고는 운영자 검토 후 처리됩니다.</p>
            <textarea
              className="report-reason-textarea"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              maxLength={200}
              placeholder="예) 부적절한 내용이 포함되어 있습니다."
              required
            />
            <div className="confirm-modal-actions">
              <button className="confirm-cancel-button" type="button" onClick={closeReport}>
                취소
              </button>
              <button
                className="confirm-delete-button"
                type="submit"
                disabled={reportSubmitting || !reportReason.trim()}
              >
                {reportSubmitting ? "접수 중" : "신고하기"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {!active && (
        <div className={`post-toast${toast ? " is-visible" : ""}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
