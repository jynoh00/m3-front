import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { clearTokens, getRefreshToken } from "../lib/auth";

export default function UserHeader({ back = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const image = user?.user_image || "";

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // 백엔드 /logout은 refresh token을 Authorization 헤더로 기대한다.
        await apiRequest("/logout", {
          method: "POST",
          auth: false,
          redirectOn401: false,
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
      }
    } catch {
      // Local logout still completes when the server is unavailable.
    } finally {
      clearTokens();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="site-header">
      <div className="header-shell">
        <div className="header-left">
          {back && <Link className="back-button" to="/posts" aria-label="모멘트 목록으로 돌아가기" />}
          <Link className="header-brand" to="/posts" aria-label="마이 뮤직 모멘트 게시판 홈">
            <img className="brand-logo" src="/assets/small-logo.png" alt="" />
            <span>My Music Moment</span>
          </Link>
        </div>
        <nav className="profile-menu" aria-label="프로필 메뉴">
          <button
            className="header-profile"
            type="button"
            aria-label="프로필 메뉴 열기"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          >
            {!image && <span aria-hidden="true" />}
          </button>
          <ul className="profile-dropdown">
            <li><Link className="profile-link" to="/me/profile">회원정보 수정</Link></li>
            <li><Link className="password-link" to="/me/password">비밀번호 수정</Link></li>
            <li>
              <Link
                className="logout-link"
                to="/login"
                onClick={(event) => {
                  event.preventDefault();
                  void logout();
                }}
              >
                로그아웃
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
