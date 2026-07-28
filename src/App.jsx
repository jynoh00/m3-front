import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { AUTH_REQUIRED_EVENT } from "./lib/auth";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const PostsPage = lazy(() => import("./pages/PostsPage"));
const CreatePage = lazy(() => import("./pages/CreatePage"));
const EditPage = lazy(() => import("./pages/EditPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const page = pathname === "/login" || pathname === "/"
      ? "login"
      : pathname === "/join"
        ? "join"
        : pathname === "/posts/new"
          ? "create"
          : /^\/posts\/[^/]+\/edit$/.test(pathname)
            ? "edit"
            : pathname === "/posts"
              ? "posts"
              : pathname === "/me/profile"
                ? "profile"
                : pathname === "/me/password"
                  ? "password"
                  : "login";

    document.body.dataset.page = page;
  }, [pathname]);

  useEffect(() => {
    const redirectToLogin = () => navigate("/login", { replace: true });
    window.addEventListener(AUTH_REQUIRED_EVENT, redirectToLogin);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, redirectToLogin);
  }, [navigate]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />}/>

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>}/>

        <Route path="/join" element={<GuestRoute><JoinPage /></GuestRoute>}/>

        <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>}/>

        <Route path="/posts/new" element={<ProtectedRoute><CreatePage /></ProtectedRoute>}/>

        <Route path="/posts/:postId/edit" element={<ProtectedRoute><EditPage /></ProtectedRoute>}/>

        <Route path="/me/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}/>

        <Route path="/me/password" element={<ProtectedRoute><PasswordPage /></ProtectedRoute>}/>

        <Route path="*" element={<Navigate to="/login" replace />}/>
      </Routes>
    </Suspense>
  );
}
