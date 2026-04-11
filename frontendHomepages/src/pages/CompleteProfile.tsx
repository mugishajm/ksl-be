import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, User, Target, MessageSquare, Building, MapPin, FileText } from "lucide-react";
import kslLogo from "@/assets/ksl-logo.png";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

const CompleteProfile = () => {
  const navigate = useNavigate();

  // Check auth state
  const rawUser = localStorage.getItem("ksl_user");
  const token = localStorage.getItem("ksl_token");

  if (!rawUser || !token) {
    return <Navigate to="/auth" replace />;
  }

  let currentUser: { role?: string; profileCompleted?: boolean } = {};
  try {
    currentUser = JSON.parse(rawUser);
  } catch {
    return <Navigate to="/auth" replace />;
  }

  // Already completed or admin — go to dashboard
  if (currentUser.profileCompleted === true || currentUser.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const [userType, setUserType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [communicationMode, setCommunicationMode] = useState("");
  const [institution, setInstitution] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = userType !== "" && purpose !== "" && agreement;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) return;

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/api/profile/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userType,
          purpose,
          communicationMode: communicationMode || "",
          institution: institution || "",
          address: address || "",
          additionalInfo: additionalInfo || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Failed to save profile. Please try again.");
        return;
      }

      // Update local storage with the profileCompleted flag
      if (data.user) {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }

      // Store user preference for smart feature
      localStorage.setItem("ksl_user_type", userType);

      navigate("/", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClasses = (value: string) =>
    `w-full rounded-xl border transition-all duration-200 px-4 py-3 text-sm outline-none cursor-pointer appearance-none bg-no-repeat ${
      value
        ? "border-emerald-500/50 bg-slate-700/80 text-white ring-1 ring-emerald-500/20"
        : "border-slate-600 bg-slate-700/50 text-gray-400"
    } focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-slate-800`;

  const inputClasses =
    "w-full rounded-xl border border-slate-600 bg-slate-700/50 text-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-slate-800 transition-all duration-200 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-blue-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-cyan-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle animation-delay-400"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 bg-indigo-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle animation-delay-600"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-800/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-bounce-subtle animation-delay-200"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 p-6 sm:p-8">
          {/* KSL Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative animate-float">
              <img
                src={kslLogo}
                alt="KSL Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Help us personalize your experience
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 rounded-xl border-2 border-red-500 bg-red-500/20 backdrop-blur-sm shadow-lg shadow-red-500/25 p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">Error</p>
                <p className="text-sm text-red-200 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* User Type (Required) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                User Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="profile-user-type"
                  required
                  className={selectClasses(userType)}
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25em 1.25em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>Select your user type</option>
                  <option value="Deaf User" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Deaf User</option>
                  <option value="Hearing User" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Hearing User</option>
                </select>
              </div>
            </div>

            {/* Primary Purpose (Required) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                Primary Purpose <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="profile-purpose"
                  required
                  className={selectClasses(purpose)}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25em 1.25em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>Select your primary purpose</option>
                  <option value="Communication" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Communication</option>
                  <option value="Learning Sign Language" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Learning Sign Language</option>
                  <option value="Teaching" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Teaching</option>
                  <option value="Research" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Research</option>
                  <option value="Other" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Other</option>
                </select>
              </div>
            </div>

            {/* Preferred Communication Mode (Optional) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                Preferred Communication Mode
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  id="profile-communication-mode"
                  className={selectClasses(communicationMode)}
                  value={communicationMode}
                  onChange={(e) => setCommunicationMode(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25em 1.25em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>Select communication mode</option>
                  <option value="Text" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Text</option>
                  <option value="Sign Language (Video)" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Sign Language (Video)</option>
                  <option value="Both" style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>Both</option>
                </select>
              </div>
            </div>

            {/* Institution / Organization (Optional) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-blue-400" />
                Institution / Organization
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                id="profile-institution"
                type="text"
                className={inputClasses}
                placeholder="e.g. University of Kigali"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            {/* Address (Optional) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                Address
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                id="profile-address"
                type="text"
                className={inputClasses}
                placeholder="City, District, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Additional Information (Optional) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                Additional Information
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="profile-additional-info"
                className={`${inputClasses} resize-none min-h-[80px]`}
                placeholder="Tell us anything that can help improve your experience..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
              />
            </div>

            {/* User Type Smart Feature Hint */}
            {userType && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300/90">
                  {userType === "Deaf User"
                    ? "Great! We'll prioritize sign-to-text features and optimize the interface for your needs."
                    : "Great! We'll prioritize text-to-sign features to help you communicate effectively."}
                </p>
              </div>
            )}

            {/* Agreement Checkbox (Required) */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="profile-agreement"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="profile-agreement"
                className="text-xs sm:text-sm text-gray-300 leading-relaxed cursor-pointer select-none"
              >
                I confirm that the information provided is correct{" "}
                <span className="text-red-400">*</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                id="profile-submit-btn"
                className={`w-full font-medium py-3 rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base ${
                  isFormValid
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/20 transform hover:scale-[1.02]"
                    : "bg-slate-700 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving Profile...
                  </span>
                ) : (
                  "Continue to Dashboard"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
