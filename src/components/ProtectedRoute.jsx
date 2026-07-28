import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ApiError, apiRequest } from "../lib/api";
import { clearTokens, getAccessToken } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const token = getAccessToken();
  const [status, setStatus] = useState(token ? "checking" : "unauthenticated");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;

    let active = true;

    apiRequest("/me/profile", { redirectOn401: false })
      .then((result) => {
        if (!active) return;
        setUser(result.data || {});
        setStatus("authenticated");
      })
      .catch((error) => {
        if (!active) return;

        if (error instanceof ApiError && error.status === 401) {
          clearTokens();
          setStatus("unauthenticated");
          return;
        }

        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  const authValue = useMemo(() => ({ user, setUser }), [user]);

  if (!token || status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  if (status === "checking") return null;
  if (status === "error") {
    return <p role="alert">인증 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.</p>;
  }

  return (
    <AuthProvider value={authValue}>
      {children}
    </AuthProvider>
  );
}
