import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProfileGuardProps {
  children: ReactNode;
}

/**
 * Route guard that redirects logged-in users to /complete-profile
 * if they haven't completed their profile yet.
 * Admin users bypass this check entirely.
 * Non-logged-in users pass through (public pages remain accessible).
 */
export const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const raw = localStorage.getItem("ksl_user");
  if (!raw) {
    // Not logged in — let normal page render (public pages work, protected pages have their own guards)
    return <>{children}</>;
  }

  try {
    const user = JSON.parse(raw);
    // Admins bypass the profile gate
    if (user.role === "admin") {
      return <>{children}</>;
    }
    // Regular users must complete profile
    if (user.profileCompleted === false) {
      return <Navigate to="/complete-profile" replace />;
    }
  } catch {
    // Corrupted localStorage — let it pass, login will handle it
  }

  return <>{children}</>;
};

export default ProfileGuard;
