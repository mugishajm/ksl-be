import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, RefreshCw, Users, Activity, TrendingUp, AlertTriangle, 
  Clock, CheckCircle, CalendarDays, Filter
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { getReportStats, getRecentUsers } from "@/lib/api";
import { toast } from "sonner";

type ReportStats = {
  totalInterpretations: number;
  averageAccuracy: string;
  activeUsers: number;
  interpretationsData: any[];
  accuracyData: any[];
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedLabel: string;
};

const ERROR_DATA = [
  { name: 'Omissions', value: 45, color: '#f59e0b' },
  { name: 'Substitutions', value: 30, color: '#0f74d4' },
  { name: 'Timing', value: 15, color: '#ef4444' },
  { name: 'Insertions', value: 10, color: '#8b5cf6' },
];

const RECENT_INTERPRETATIONS = [
  { id: 1, text: "I need to see a doctor", user: "John D.", time: "10 mins ago", status: "success" },
  { id: 2, text: "Where is the bus station?", user: "Sarah M.", time: "25 mins ago", status: "success" },
  { id: 3, text: "[Unclear gesture sequence]", user: "Mike R.", time: "1 hour ago", status: "error" },
  { id: 4, text: "Thank you for your help", user: "Emma W.", time: "2 hours ago", status: "success" },
  { id: 5, text: "How much does it cost?", user: "David L.", time: "3 hours ago", status: "success" },
];



const Reports = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [userType, setUserType] = useState<"All" | "Deaf" | "Hearing">("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  useEffect(() => {
    getRecentUsers()
      .then((data) => setRecentUsers(data))
      .catch(() => toast.error("Failed to load recent users"))
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchStats = async (selectedRange: "7d" | "30d" | "90d") => {
    try {
      setIsRefreshing(true);
      const data = await getReportStats(selectedRange);
      setStats(data);
    } catch (err) {
      toast.error("Failed to load report stats");
    } finally {
      setIsRefreshing(false);
    }
  };

  const chartConfig = {
    total: { label: "Interpretations", color: "#0f74d4" },
    accuracy: { label: "Accuracy", color: "#31c76a" },
  };

  const handleRangeClick = (value: "7d" | "30d" | "90d") => {
    if (value !== range) setRange(value);
  };

  const handleRefresh = () => {
    fetchStats(range);
  };

  const handleExportSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8 bg-[#0a1128] -m-6 p-6 min-h-screen text-white">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-sm text-blue-100/70 mt-1">
            Track real-time system performance and user engagement metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-blue-500/20 text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
            onClick={handleExportSummary}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/20"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Syncing..." : "Sync Data"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/10 bg-blue-900/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-200/50 mr-1" />
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Date Range</span>
          <div className="flex gap-1 bg-[#0a1128] p-1 rounded-md ml-2 border border-white/5">
            {[
              { label: "7D", value: "7d" },
              { label: "30D", value: "30d" },
              { label: "90D", value: "90d" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRangeClick(opt.value as "7d" | "30d" | "90d")}
                className={`text-xs font-bold px-3 py-1 rounded-sm transition-all ${
                  range === opt.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-200/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px w-full sm:h-6 sm:w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-200/50 mr-1" />
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">User Type</span>
          <div className="flex gap-1 bg-[#0a1128] p-1 rounded-md ml-2 border border-white/5">
            {["All", "Deaf", "Hearing"].map((type) => (
              <button
                key={type}
                onClick={() => setUserType(type as any)}
                className={`text-xs font-bold px-3 py-1 rounded-sm transition-all ${
                  userType === type
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-200/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Interpretations */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">
              Total Interpretations
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats ? parseInt(stats.totalInterpretations.toString()).toLocaleString() : "..."}
            </div>
            <p className="text-xs font-medium text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% from last {range}
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">
              Active Users
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats ? parseInt(stats.activeUsers.toString()).toLocaleString() : "..."}
            </div>
            <p className="text-xs font-medium text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.1% from last {range}
            </p>
          </CardContent>
        </Card>

        {/* Average Accuracy */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">
              Average Accuracy
            </CardTitle>
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats ? `${stats.averageAccuracy}%` : "..."}
            </div>
            <p className="text-xs font-medium text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Stable (+0.2%)
            </p>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">
              Error Rate
            </CardTitle>
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              8.4%
            </div>
            <p className="text-xs font-medium text-rose-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +1.2% from last {range}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interpretations Bar Chart */}
        <Card className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Activity Trend</CardTitle>
            <CardDescription className="text-[#D1D5DB]">Daily successful interpretations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={stats?.interpretationsData || []} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-white/10" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tick={{ fontSize: 12, fill: '#D1D5DB' }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#D1D5DB' }} />
                <ChartTooltip content={<ChartTooltipContent className="bg-[#111827] border-white/10 text-white" />} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#0f74d4" maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Error Distribution Pie Chart */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Error Distribution</CardTitle>
            <CardDescription className="text-[#D1D5DB]">Breakdown of recognition errors</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-0 pb-6">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={ERROR_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {ERROR_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 px-6 w-full">
              {ERROR_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#D1D5DB] flex-1">{item.name}</span>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Trend Line Chart */}
        <Card className="lg:col-span-3 bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Accuracy Performance</CardTitle>
            <CardDescription className="text-[#D1D5DB]">Model recognition accuracy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart data={stats?.accuracyData || []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-white/10" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tick={{ fontSize: 12, fill: '#D1D5DB' }} dy={10} />
                <YAxis domain={[85, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#D1D5DB' }} />
                <ChartTooltip content={<ChartTooltipContent className="bg-[#111827] border-white/10 text-white" />} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#31c76a"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#111827" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#31c76a" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Interpretations */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              Recent Interpretations
              <Button onClick={() => navigate("/admin/logs")} variant="ghost" size="sm" className="h-8 text-xs text-[#D1D5DB] hover:text-white">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {RECENT_INTERPRETATIONS.map((item) => (
                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4">
                  <div className={`mt-0.5 p-1.5 rounded-full ${item.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {item.status === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-white">{item.text}</p>
                    <div className="flex items-center gap-3 text-xs text-[#D1D5DB]">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.user}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users – live from MongoDB */}
        <Card className="bg-[#111827] border border-white/5 rounded-xl shadow-lg opacity-100 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              User Activity
              <Button onClick={() => navigate("/admin/users")} variant="ghost" size="sm" className="h-8 text-xs text-[#D1D5DB] hover:text-white">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="flex items-center justify-center py-10 text-blue-400 text-sm animate-pulse">
                Loading users...
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm gap-2">
                <Users className="w-8 h-8 opacity-30" />
                No users found in database
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-[#D1D5DB]">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold border-white/10 bg-transparent ${
                        user.role === "admin" ? "text-indigo-400 border-indigo-500/30" : "text-emerald-400 border-emerald-500/30"
                      }`}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                      <span className="text-[10px] text-[#D1D5DB] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {user.joinedLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

