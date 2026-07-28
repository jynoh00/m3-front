import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import MomentCard from "../components/posts/MomentCard";
import PostDetailModal from "../components/posts/PostDetailModal";
import { apiRequest } from "../lib/api";
import {
  likedStateFrom,
  normalizeComment,
  normalizePost,
} from "../lib/posts";
import "../styles/posts.css";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [active, setActive] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [checkingCommentId, setCheckingCommentId] = useState(null);
  const [liking, setLiking] = useState(false);
  const [toast, setToast] = useState("");
  const sentinel = useRef(null);
  const detailDialog = useRef(null);
  const nextPage = useRef(1);
  const requestInFlight = useRef(false);
  const hasNextPage = useRef(true);
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
      setLoadError(
        error instanceof Error
          ? error.message
          : "게시글 목록을 불러오지 못했습니다.",
      );
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

  const openDetail = async (post) => {
    setActive(post);
    setComments([]);
    setEditingId(null);

    try {
      const [detail, commentResult] = await Promise.all([
        apiRequest(`/posts/${post.post_id}`),
        apiRequest(`/posts/${post.post_id}/comments`),
      ]);
      const hasDetailLikedState = [
        "is_liked",
        "liked",
        "increase_like_count",
        "is_like",
      ].some((key) => detail.data?.[key] !== undefined);
      const nextPost = normalizePost({
        ...post,
        ...detail.data,
        is_liked: hasDetailLikedState
          ? likedStateFrom(detail.data || {})
          : post.is_liked,
      });
      const nextComments = (commentResult.data?.comments || []).map(
        normalizeComment,
      );
      nextPost.comment_count = nextComments.length;
      updatePost(nextPost);
      setComments(nextComments);
    } catch (error) {
      setActive(null);
      showToast(
        error instanceof Error ? error.message : "상세 내용을 불러오지 못했습니다.",
      );
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
      showToast(error instanceof Error ? error.message : "좋아요 처리에 실패했습니다.");
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
      const result = await apiRequest(`/posts/${active.post_id}/comments`);
      const next = (result.data?.comments || []).map(normalizeComment);
      setComments(next);
      updatePost({ ...active, comment_count: next.length });
      setComment("");
      showToast("댓글이 등록되었습니다.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.");
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
      showToast(error instanceof Error ? error.message : "댓글 수정에 실패했습니다.");
    }
  };

  const startCommentEdit = async (item) => {
    if (!active || checkingCommentId !== null) return;
    setCheckingCommentId(item.comment_id);

    try {
      const result = await apiRequest("/me/profile");
      const currentUserId = result.data?.user_id;
      const isOwner = currentUserId != null &&
        item.user_id != null &&
        String(currentUserId) === String(item.user_id);

      if (!isOwner) {
        showToast("댓글을 수정할 권한이 없습니다.");
        return;
      }

      setEditingId(item.comment_id);
      setEditingContent(item.comment_content);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "댓글 수정 권한을 확인하지 못했습니다.",
      );
    } finally {
      setCheckingCommentId(null);
    }
  };

  const deleteComment = async (commentId) => {
    if (!active || !window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await apiRequest(`/posts/${active.post_id}/comments/${commentId}`, {
        method: "DELETE",
      });
      const next = comments.filter((item) => item.comment_id !== commentId);
      setComments(next);
      updatePost({ ...active, comment_count: next.length });
      showToast("댓글이 삭제되었습니다.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.");
    }
  };

  const editPost = async () => {
    if (!active) return;

    try {
      await apiRequest(`/posts/${active.post_id}/edit`);
      navigate(`/posts/${encodeURIComponent(active.post_id)}/edit`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "수정 정보를 불러오지 못했습니다.",
      );
    }
  };

  const deletePost = async () => {
    if (!active || !window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      await apiRequest(`/posts/${active.post_id}`, { method: "DELETE" });
      setPosts((items) => items.filter((item) => item.post_id !== active.post_id));
      setActive(null);
      showToast("게시글이 삭제되었습니다.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.");
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
          comment={comment}
          editingId={editingId}
          editingContent={editingContent}
          checkingCommentId={checkingCommentId}
          liking={liking}
          toast={toast}
          onClose={() => setActive(null)}
          onEditPost={() => void editPost()}
          onDeletePost={() => void deletePost()}
          onLike={() => void like()}
          onCommentChange={setComment}
          onSubmitComment={submitComment}
          onEditingContentChange={setEditingContent}
          onSaveComment={(commentId) => void saveComment(commentId)}
          onCancelCommentEdit={() => setEditingId(null)}
          onStartCommentEdit={(item) => void startCommentEdit(item)}
          onDeleteComment={(commentId) => void deleteComment(commentId)}
        />
      )}

      {!active && (
        <div className={`post-toast${toast ? " is-visible" : ""}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
