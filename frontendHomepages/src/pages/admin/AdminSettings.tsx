import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Users,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Mail,
  Server,
  Activity,
  Sliders,
  Key,
  Trash2,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Cpu,
  FileText,
  Clock,
  Zap,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── Types ─────────────────────────────────────────────────── */
type Tab =
  | "general"
  | "security"
  | "notifications"
  | "system"
  | "api"
  | "audit"
  | "backup";

/* ─── Tab config ─────────────────────────────────────────────── */
const tabs: { id: Tab; label: string; icon: typeof Settings; badge?: string }[] = [
  { id: "general",       label: "General",       icon: Sliders },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "3" },
  { id: "system",        label: "System",        icon: Server },
  { id: "api",           label: "API & Keys",    icon: Key },
  { id: "audit",         label: "Audit Logs",    icon: Activity },
  { id: "backup",        label: "Backup & Data", icon: Database },
];

/* ─── Fake audit entries ─────────────────────────────────────── */
const auditLogs = [
  { id: 1, action: "Admin login",                  user: "admin@ksl.rw",    time: "2 min ago",   type: "auth"    },
  { id: 2, action: "Gesture library updated",      user: "admin@ksl.rw",    time: "18 min ago",  type: "content" },
  { id: 3, action: "User role changed → admin",    user: "admin@ksl.rw",    time: "1 hour ago",  type: "user"    },
  { id: 4, action: "API rate-limit modified",      user: "admin@ksl.rw",    time: "3 hours ago", type: "api"     },
  { id: 5, action: "Backup triggered manually",    user: "system",          time: "Yesterday",   type: "system"  },
  { id: 6, action: "Email template updated",       user: "admin@ksl.rw",    time: "2 days ago",  type: "content" },
  { id: 7, action: "New admin account created",    user: "superadmin",      time: "3 days ago",  type: "user"    },
  { id: 8, action: "System maintenance scheduled", user: "system",          time: "4 days ago",  type: "system"  },
];

const auditTypeColor: Record<string, string> = {
  auth:    "bg-blue-500/15 text-blue-300 border-blue-500/20",
  content: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  user:    "bg-purple-500/15 text-purple-300 border-purple-500/20",
  api:     "bg-amber-500/15 text-amber-300 border-amber-500/20",
  system:  "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

/* ─── Toggle Switch ──────────────────────────────────────────── */
const Toggle = ({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
      checked ? "bg-indigo-500" : "bg-slate-700"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

/* ─── Section card wrapper ───────────────────────────────────── */
const Section = ({
  title,
  description,
  icon: Icon,
  children,
  accent = "indigo",
}: {
  title: string;
  description?: string;
  icon: typeof Settings;
  children: React.ReactNode;
  accent?: string;
}) => {
  const accentMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    rose:   "text-rose-400 bg-rose-500/10 border-rose-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky:    "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl border ${accentMap[accent] ?? accentMap.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">{title}</h3>
          {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

/* ─── Field row: label + control ─────────────────────────────── */
const Field = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-t border-white/5 first:border-0 first:pt-0">
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-slate-200">{label}</div>
      {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);

  /* ── General ── */
  const [siteName,       setSiteName]       = useState("KSL Design Studio");
  const [siteTagline,    setSiteTagline]    = useState("Kinyarwanda Sign Language Platform");
  const [maintenanceMode,setMaintenanceMode]= useState(false);
  const [debugMode,      setDebugMode]      = useState(false);
  const [language,       setLanguage]       = useState("en");
  const [timezone,       setTimezone]       = useState("Africa/Kigali");

  /* ── Security ── */
  const [twoFactor,          setTwoFactor]          = useState(true);
  const [sessionTimeout,     setSessionTimeout]     = useState("30");
  const [maxLoginAttempts,   setMaxLoginAttempts]   = useState("5");
  const [requireStrongPwd,   setRequireStrongPwd]   = useState(true);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [ipWhitelist,        setIpWhitelist]        = useState("");
  const [showCurrentPwd,     setShowCurrentPwd]     = useState(false);
  const [currentPwd,         setCurrentPwd]         = useState("");
  const [newPwd,             setNewPwd]             = useState("");
  const [confirmPwd,         setConfirmPwd]         = useState("");

  /* ── Notifications ── */
  const [emailOnNewUser,   setEmailOnNewUser]   = useState(true);
  const [emailOnReport,    setEmailOnReport]    = useState(true);
  const [emailOnError,     setEmailOnError]     = useState(true);
  const [emailOnLogin,     setEmailOnLogin]     = useState(false);
  const [slackWebhook,     setSlackWebhook]     = useState("");
  const [notifEmail,       setNotifEmail]       = useState("admin@ksl.rw");
  const [digestFrequency,  setDigestFrequency]  = useState("daily");

  /* ── System ── */
  const [maxUploadSize,     setMaxUploadSize]     = useState("10");
  const [cacheEnabled,      setCacheEnabled]      = useState(true);
  const [cacheTTL,          setCacheTTL]          = useState("3600");
  const [rateLimitEnabled,  setRateLimitEnabled]  = useState(true);
  const [rateLimitReqs,     setRateLimitReqs]     = useState("100");
  const [autoBackup,        setAutoBackup]        = useState(true);
  const [logRetentionDays,  setLogRetentionDays]  = useState("90");

  /* ── API ── */
  const [apiKeyVisible,  setApiKeyVisible]  = useState(false);
  const [apiKey]                            = useState("sk-ksl-••••••••••••••••••••••••••••••");
  const [apiKeyReal]                        = useState("sk-ksl-a1b2c3d4e5f6-DEMO-KEY-ONLY");
  const [webhookUrl,     setWebhookUrl]     = useState("");
  const [apiRateLimit,   setApiRateLimit]   = useState("1000");
  const [corsOrigins,    setCorsOrigins]    = useState("https://ksl.rw");

  /* ── Audit filter ── */
  const [auditFilter, setAuditFilter] = useState<"all" | "auth" | "content" | "user" | "api" | "system">("all");

  const filteredLogs = auditFilter === "all"
    ? auditLogs
    : auditLogs.filter((l) => l.type === auditFilter);

  /* ── Save handler ── */
  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast.success("Admin settings saved successfully!", {
      description: "Changes are now active across the platform.",
    });
  };

  const handlePasswordChange = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    toast.success("Admin password updated securely.");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const handleRegenerateKey = () => {
    toast.success("API key regenerated. Copy it now — it won't be shown again.", {
      duration: 6000,
    });
  };

  const handleExportData = () => {
    toast.info("Data export started. You'll receive an email when it's ready.");
  };

  const handleClearCache = () => {
    toast.success("System cache cleared successfully.");
  };

  /* ── Tab content renderer ── */
  const renderTab = () => {
    switch (activeTab) {
      /* ─── GENERAL ─────────────────────────────────────────── */
      case "general":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Platform Identity" description="Name and branding visible across the platform." icon={Globe} accent="indigo">
              <Field label="Site Name" description="Displayed in browser tabs and emails.">
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Tagline" description="Short description shown on landing page.">
                <Input value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Default Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-10 rounded-lg bg-slate-800 border border-white/10 text-white text-sm px-3 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                  <option value="fr">French</option>
                </select>
              </Field>
              <Field label="Timezone" description="Used for scheduling and log timestamps.">
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-10 rounded-lg bg-slate-800 border border-white/10 text-white text-sm px-3 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Africa/Kigali">Africa/Kigali (UTC+2)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </Field>
            </Section>

            <Section title="Platform Modes" description="Control platform availability and diagnostics." icon={Cpu} accent="amber">
              <Field label="Maintenance Mode" description="Prevent user access while performing updates.">
                <Toggle id="toggle-maintenance" checked={maintenanceMode} onChange={setMaintenanceMode} />
              </Field>
              {maintenanceMode && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Maintenance mode is active. Only admins can access the platform.</span>
                </div>
              )}
              <Field label="Debug Mode" description="Enable verbose logging. Do not use in production.">
                <Toggle id="toggle-debug" checked={debugMode} onChange={setDebugMode} />
              </Field>
            </Section>

            <Section title="User Registration" description="Control how new users join the platform." icon={Users} accent="emerald">
              <Field label="Allow Public Registration" description="Users can create accounts on their own.">
                <Toggle id="toggle-registration" checked={true} onChange={() => {}} />
              </Field>
              <Field label="Email Verification Required" description="New accounts must verify email before access.">
                <Toggle id="toggle-email-verify" checked={true} onChange={() => {}} />
              </Field>
              <Field label="Default User Role" description="Role assigned to new registrations.">
                <select className="h-10 rounded-lg bg-slate-800 border border-white/10 text-white text-sm px-3 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>User</option>
                  <option>Viewer</option>
                  <option>Moderator</option>
                </select>
              </Field>
            </Section>
          </div>
        );

      /* ─── SECURITY ─────────────────────────────────────────── */
      case "security":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Authentication Controls" description="Configure how admins and users authenticate." icon={Lock} accent="rose">
              <Field label="Two-Factor Authentication" description="Require 2FA for all admin accounts.">
                <Toggle id="toggle-2fa" checked={twoFactor} onChange={setTwoFactor} />
              </Field>
              <Field label="Session Timeout" description="Auto-logout after inactivity (minutes).">
                <Input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="bg-slate-800 border-white/10 text-white w-24 focus-visible:ring-indigo-500" min="5" max="480" />
              </Field>
              <Field label="Max Login Attempts" description="Lock account after this many failed tries.">
                <Input type="number" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} className="bg-slate-800 border-white/10 text-white w-24 focus-visible:ring-indigo-500" min="3" max="20" />
              </Field>
              <Field label="Require Strong Passwords" description="Enforce complexity rules (uppercase, symbols, length ≥8).">
                <Toggle id="toggle-strong-pwd" checked={requireStrongPwd} onChange={setRequireStrongPwd} />
              </Field>
            </Section>

            <Section title="IP Access Control" description="Restrict admin panel access by IP address." icon={Shield} accent="purple">
              <Field label="IP Whitelist" description="When enabled, only listed IPs can access admin.">
                <Toggle id="toggle-ip-whitelist" checked={ipWhitelistEnabled} onChange={setIpWhitelistEnabled} />
              </Field>
              {ipWhitelistEnabled && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Allowed IPs (one per line)</label>
                  <textarea
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    placeholder={"192.168.1.1\n10.0.0.0/24"}
                    className="w-full rounded-xl bg-slate-800 border border-white/10 text-white text-sm px-4 py-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </Section>

            <Section title="Change Admin Password" description="Update the master admin account password." icon={Key} accent="amber">
              <Field label="Current Password">
                <div className="relative">
                  <Input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-800 border-white/10 text-white w-60 pr-10 focus-visible:ring-indigo-500"
                  />
                  <button onClick={() => setShowCurrentPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="••••••••" className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
              <div className="pt-2">
                <Button onClick={handlePasswordChange} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 shadow-lg shadow-rose-500/20 border-0">
                  <Lock className="w-4 h-4 mr-2" /> Update Password
                </Button>
              </div>
            </Section>
          </div>
        );

      /* ─── NOTIFICATIONS ──────────────────────────────────────── */
      case "notifications":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Email Notifications" description="Choose which platform events trigger admin emails." icon={Mail} accent="sky">
              <Field label="Admin Notification Email">
                <Input type="email" value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="New User Registration" description="Email when a new user signs up.">
                <Toggle id="toggle-notif-newuser" checked={emailOnNewUser} onChange={setEmailOnNewUser} />
              </Field>
              <Field label="System Error Alerts" description="Immediate alert on critical errors.">
                <Toggle id="toggle-notif-error" checked={emailOnError} onChange={setEmailOnError} />
              </Field>
              <Field label="Weekly Reports" description="Receive automated weekly platform reports.">
                <Toggle id="toggle-notif-report" checked={emailOnReport} onChange={setEmailOnReport} />
              </Field>
              <Field label="Admin Login Alerts" description="Email whenever an admin logs in.">
                <Toggle id="toggle-notif-login" checked={emailOnLogin} onChange={setEmailOnLogin} />
              </Field>
            </Section>

            <Section title="Digest Schedule" description="Aggregate summary frequency." icon={Clock} accent="emerald">
              <Field label="Digest Frequency">
                <div className="flex gap-2">
                  {(["realtime", "daily", "weekly"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDigestFrequency(f)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                        digestFrequency === f
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Slack Integration" description="Post admin alerts to a Slack channel." icon={MessageSquare} accent="purple">
              <Field label="Webhook URL" description="Slack incoming webhook for admin notifications.">
                <Input value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="bg-slate-800 border-white/10 text-white w-72 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Test Notification">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-slate-700 text-slate-200"
                  onClick={() => toast.info("Test notification sent to Slack!")}
                  disabled={!slackWebhook}
                >
                  Send Test
                </Button>
              </Field>
            </Section>
          </div>
        );

      /* ─── SYSTEM ─────────────────────────────────────────────── */
      case "system":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Performance & Cache" description="Control caching behavior for faster responses." icon={Zap} accent="amber">
              <Field label="Enable Response Cache">
                <Toggle id="toggle-cache" checked={cacheEnabled} onChange={setCacheEnabled} />
              </Field>
              <Field label="Cache TTL (seconds)" description="How long cached items are kept.">
                <Input type="number" value={cacheTTL} onChange={(e) => setCacheTTL(e.target.value)} className="bg-slate-800 border-white/10 text-white w-28 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Clear Cache Now">
                <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10" onClick={handleClearCache}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Clear Cache
                </Button>
              </Field>
            </Section>

            <Section title="Rate Limiting" description="Protect the platform from abuse." icon={Shield} accent="rose">
              <Field label="Enable Rate Limiting">
                <Toggle id="toggle-rate" checked={rateLimitEnabled} onChange={setRateLimitEnabled} />
              </Field>
              <Field label="Requests per Minute" description="Max requests per IP per minute.">
                <Input type="number" value={rateLimitReqs} onChange={(e) => setRateLimitReqs(e.target.value)} className="bg-slate-800 border-white/10 text-white w-28 focus-visible:ring-indigo-500" />
              </Field>
            </Section>

            <Section title="File Uploads" description="Control upload sizes and types." icon={Upload} accent="sky">
              <Field label="Max Upload Size (MB)">
                <Input type="number" value={maxUploadSize} onChange={(e) => setMaxUploadSize(e.target.value)} className="bg-slate-800 border-white/10 text-white w-28 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Allowed File Types">
                <Input defaultValue="jpg, png, mp4, webm" className="bg-slate-800 border-white/10 text-white w-60 focus-visible:ring-indigo-500" />
              </Field>
            </Section>

            <Section title="Log Management" description="Configure platform log retention." icon={FileText} accent="emerald">
              <Field label="Log Retention (days)" description="Logs older than this are purged automatically.">
                <Input type="number" value={logRetentionDays} onChange={(e) => setLogRetentionDays(e.target.value)} className="bg-slate-800 border-white/10 text-white w-28 focus-visible:ring-indigo-500" />
              </Field>
            </Section>

            {/* System Status strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "CPU",     value: "18%",   ok: true },
                { label: "Memory",  value: "42%",   ok: true },
                { label: "Storage", value: "67%",   ok: true },
                { label: "Uptime",  value: "99.8%", ok: true },
              ].map((m) => (
                <div key={m.label} className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-extrabold ${m.ok ? "text-emerald-400" : "text-rose-400"}`}>{m.value}</div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      /* ─── API & KEYS ─────────────────────────────────────────── */
      case "api":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Platform API Key" description="Master API key used by integrations. Keep this secret." icon={Key} accent="amber">
              <Field label="API Key">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-300 flex-1 truncate max-w-xs">
                    {apiKeyVisible ? apiKeyReal : apiKey}
                  </div>
                  <button onClick={() => setApiKeyVisible((v) => !v)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
                    {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(apiKeyReal); toast.success("API key copied!"); }}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>
              </Field>
              <Field label="Regenerate Key" description="Invalidates the current key immediately.">
                <Button variant="outline" className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10" onClick={handleRegenerateKey}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                </Button>
              </Field>
            </Section>

            <Section title="Webhook" description="Receive real-time events at your endpoint." icon={Globe} accent="sky">
              <Field label="Webhook URL" description="POST requests are sent on platform events.">
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://yourapp.com/webhook" className="bg-slate-800 border-white/10 text-white w-72 focus-visible:ring-indigo-500" />
              </Field>
              <Field label="Test Webhook">
                <Button variant="outline" className="border-white/10 hover:bg-slate-700 text-slate-200" onClick={() => toast.info("Test payload sent to webhook!")} disabled={!webhookUrl}>
                  Send Test Payload
                </Button>
              </Field>
            </Section>

            <Section title="API Rate Limit" description="Limit external API consumers." icon={Zap} accent="purple">
              <Field label="Requests per Hour" description="Applied per API key.">
                <Input type="number" value={apiRateLimit} onChange={(e) => setApiRateLimit(e.target.value)} className="bg-slate-800 border-white/10 text-white w-28 focus-visible:ring-indigo-500" />
              </Field>
            </Section>

            <Section title="CORS Policy" description="Define allowed origins for cross-origin requests." icon={Globe} accent="emerald">
              <Field label="Allowed Origins" description="Comma-separated domains.">
                <Input value={corsOrigins} onChange={(e) => setCorsOrigins(e.target.value)} placeholder="https://ksl.rw" className="bg-slate-800 border-white/10 text-white w-72 focus-visible:ring-indigo-500" />
              </Field>
            </Section>
          </div>
        );

      /* ─── AUDIT LOGS ─────────────────────────────────────────── */
      case "audit":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Admin Audit Trail</h2>
                <p className="text-slate-400 text-sm">A tamper-evident record of all privileged actions.</p>
              </div>
              <Button variant="outline" className="border-white/10 hover:bg-slate-800 text-slate-300" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" /> Export Logs
              </Button>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", "auth", "content", "user", "api", "system"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all capitalize ${
                    auditFilter === f
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 bg-slate-900/50 border border-white/5 rounded-xl px-5 py-4 hover:border-white/10 hover:bg-slate-900 transition-all group">
                  <div className={`flex-shrink-0 p-2 rounded-lg border ${auditTypeColor[log.type]}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">{log.action}</div>
                    <div className="text-xs text-slate-500 mt-0.5">By <span className="text-slate-400">{log.user}</span></div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className={`${auditTypeColor[log.type]} text-xs font-semibold capitalize`}>{log.type}</Badge>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{log.time}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      /* ─── BACKUP & DATA ──────────────────────────────────────── */
      case "backup":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Section title="Automated Backups" description="Scheduled database and file backups." icon={Database} accent="emerald">
              <Field label="Enable Auto Backup" description="Daily snapshots of all platform data.">
                <Toggle id="toggle-autobackup" checked={autoBackup} onChange={setAutoBackup} />
              </Field>
              <Field label="Backup Frequency">
                <select className="h-10 rounded-lg bg-slate-800 border border-white/10 text-white text-sm px-3 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Daily</option>
                  <option>Every 6 hrs</option>
                  <option>Weekly</option>
                </select>
              </Field>
              <Field label="Retention Period" description="How many backups to keep.">
                <select className="h-10 rounded-lg bg-slate-800 border border-white/10 text-white text-sm px-3 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>90 days</option>
                </select>
              </Field>
            </Section>

            <Section title="Manual Backup" description="Download a full platform data export." icon={Download} accent="sky">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Users & Roles",       size: "2.4 MB",  icon: Users },
                  { label: "Gesture Library",      size: "18.2 MB", icon: Activity },
                  { label: "Interpretation Logs",  size: "5.8 MB",  icon: FileText },
                  { label: "System Config",        size: "0.3 MB",  icon: Settings },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between bg-slate-900 border border-white/5 rounded-xl p-4 group hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-lg">
                          <ItemIcon className="w-4 h-4 text-sky-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.label}</div>
                          <div className="text-xs text-slate-500">{item.size}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-sky-300 hover:bg-sky-500/10" onClick={handleExportData}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Danger Zone" description="Irreversible actions — proceed with extreme caution." icon={AlertTriangle} accent="rose">
              <div className="grid gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                  <div>
                    <div className="font-semibold text-rose-300 text-sm">Purge Interpretation Logs</div>
                    <div className="text-xs text-slate-500 mt-0.5">Permanently delete all session logs older than 90 days.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                    onClick={() => toast.error("Action blocked — confirm via email first.")}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Purge Logs
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                  <div>
                    <div className="font-semibold text-rose-300 text-sm">Reset Platform to Defaults</div>
                    <div className="text-xs text-slate-500 mt-0.5">Wipes all user data, gestures, and configurations.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                    onClick={() => toast.error("Requires superadmin confirmation.")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Factory Reset
                  </Button>
                </div>
              </div>
            </Section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-950 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 min-h-screen p-6 -mx-6 -mt-6 xl:p-10 pb-20 text-slate-50 transition-all duration-300">

      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-2">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Admin Control Panel
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 pb-1">
            Admin Settings
          </h1>
          <p className="text-slate-400 max-w-lg">
            Centralized configuration for platform behavior, security, integrations, and data management.
            <span className="text-rose-400 font-medium"> Admin-only.</span>
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 border-0 font-bold text-sm hover:scale-105 transition-transform"
        >
          {saving ? (
            <><RefreshCw className="w-4 h-4 mr-2.5 animate-spin" />Saving…</>
          ) : (
            <><Save className="w-4 h-4 mr-2.5" />Save All Changes</>
          )}
        </Button>
      </div>

      {/* ── Layout: Sidebar Tabs + Content ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar Nav */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible sticky top-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:w-full text-left ${
                    active
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-indigo-400" : ""}`} />
                  <span className="hidden sm:block">{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-auto hidden sm:flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold flex-shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {renderTab()}

          {/* Save button (bottom) */}
          {activeTab !== "audit" && (
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                All changes are encrypted and version-controlled.
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold border-0 shadow-lg shadow-indigo-500/20"
              >
                {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
