import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

type User = { id: string; firstName?: string; lastName?: string; email?: string; role?: string };

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "allowed" | "forbidden" | "unauthenticated">("loading");

  useEffect(() => {
    const token = localStorage.getItem("ksl_token");
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    let user: User | null = null;
    try {
      const stored = localStorage.getItem("ksl_user");
      if (stored) user = JSON.parse(stored) as User;
    } catch {
      // ignore
    }

    if (user && user.role === "admin") {
      setStatus("allowed");
      return;
    }

    if (user && user.role !== "admin") {
      setStatus("forbidden");
      return;
    }

    // No user in storage: fetch /me to get role
    if (!API_URL) {
      setStatus("unauthenticated");
      return;
    }
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const u = data?.user;
        if (u && typeof u.role === "string") {
          localStorage.setItem("ksl_user", JSON.stringify(u));
          setStatus(u.role === "admin" ? "allowed" : "forbidden");
        } else {
          setStatus("unauthenticated");
        }
      })
      .catch(() => setStatus("unauthenticated"));
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-foreground mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You need an administrator account to view this page.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
