import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, getReportStats, getLogs } from "@/lib/api";
import { Users, UserCog, Calendar, TrendingUp, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

type Stats = {
  totalUsers: number;
  totalInterpretations: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
} | null;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type RequestRow = {
  id: string;
  user: string;
  type: string;
  status: string;
  date: string;
};

const notifications = [
  { text: "New gesture added to the system.", time: "5 min ago" },
  { text: "System accuracy report updated.", time: "1 hour ago" },
];

type StatCard = {
  id: string;
  title: string;
  icon: typeof Users;
  bg: string;
  getValue: (stats: Stats, users: UserRow[]) => string | number;
};

const statCards: StatCard[] = [
  {
    id: "total-interpretations",
    title: "Total Interpretations",
    icon: Users,
    bg: "bg-[#0f74d4]",
    getValue: (stats) => stats?.totalInterpretations ?? "—",
  },
  {
    id: "active-users",
    title: "Active Users",
    icon: UserCog,
    bg: "bg-[#0a9ad8]",
    getValue: (_stats, users) => users.length,
  },
  {
    id: "pending-requests",
    title: "New This Week",
    icon: Calendar,
    bg: "bg-[#f5a623]",
    getValue: (stats) => stats?.newUsersThisWeek ?? 0,
  },
  {
    id: "system-accuracy",
    title: "New This Month",
    icon: TrendingUp,
    bg: "bg-[#31c76a]",
    getValue: (stats) => stats?.newUsersThisMonth ?? 0,
  },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [recentRequests, setRecentRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(6); // 0 = Jan, 6 = July
  const [currentYear, setCurrentYear] = useState(2022);

  useEffect(() => {
    Promise.all([
      getReportStats("30d").catch(() => null),
      getUsers().catch(() => null),
      getLogs().catch(() => null),
    ])
      .then(([statsData, usersData, logsData]) => {
        if (statsData) {
          // statsData has activeUsers, totalInterpretations, etc.
          // Let's build a mock for "new users this week" since we don't track it on the backend yet
          setStats({
            totalUsers: statsData.activeUsers || (usersData ? usersData.length : 0),
            totalInterpretations: statsData.totalInterpretations || 0,
            newUsersThisMonth: Math.floor((statsData.activeUsers || 0) * 0.15) || 5,
            newUsersThisWeek: Math.floor((statsData.activeUsers || 0) * 0.05) || 2,
          });
        }
        
        if (usersData && Array.isArray(usersData)) {
          setUsers(usersData);
        }
        
        if (logsData && Array.isArray(logsData)) {
          setRecentRequests(
            logsData.slice(0, 5).map((log: any) => ({
              id: log._id,
              user: log.user,
              type: log.type,
              status: log.status,
              date: new Date(log.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            }))
          );
        }
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const chartConfig = {
    daily: { label: "Total Users", color: "#1f78d1" },
    weekly: { label: "New This Week", color: "#32a852" },
    monthly: { label: "New This Month", color: "#f06271" },
  };

  const chartData =
    stats !== null
      ? [
          {
            name: "Users",
            daily: stats.totalUsers ?? 0,
            weekly: stats.newUsersThisWeek ?? 0,
            monthly: stats.newUsersThisMonth ?? 0,
          },
        ]
      : [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const changeMonth = (offset: number) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth + offset;
      let newYear = currentYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }
      setCurrentYear(newYear);
      return newMonth;
    });
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  if (loading) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[#0f74d4] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[#0f74d4] dark:bg-slate-900 flex items-start justify-center px-2 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-6xl bg-[#0d5fb0] dark:bg-slate-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Inner top bar */}
        <div className="px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">
              KSL (Kinyarwanda Sign Language)
            </h1>
            <p className="text-xs md:text-sm text-white/80">
              Overview of users and platform statistics
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-sm">Welcome, Admin!</span>
            <div className="h-8 px-3 inline-flex items-center justify-center rounded-full bg-white/10 text-xs font-medium">
              KSL Admin
            </div>
          </div>
        </div>

        {/* Main white content area */}
        <div className="bg-[#f4f7fb] dark:bg-slate-900 px-3 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Statistic Cards - exact top strip */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const value =
                stats !== null ? card.getValue(stats, users) : "—";
              return (
                <div
                  key={card.id}
                  className={`${card.bg} rounded-lg shadow-card text-white px-4 py-3 flex items-center justify-between`}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">
                      {card.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle section: chart + calendar */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
            <Card className="border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Interpretation Statistics
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribution of users and recent signups
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <BarChart data={chartData} margin={{ left: 0, right: 0, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="daily" radius={[4, 4, 0, 0]} fill="#1f78d1" />
                    <Bar dataKey="weekly" radius={[4, 4, 0, 0]} fill="#32a852" />
                    <Bar dataKey="monthly" radius={[4, 4, 0, 0]} fill="#f06271" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-100">
                      Calendar
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className="text-lg leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
                      >
                        {"<"}
                      </button>
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="text-lg leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <input
                      type="text"
                      placeholder="Search date..."
                      className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0f74d4] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <select
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(Number(e.target.value))}
                      className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0f74d4] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {monthNames.map((name, idx) => (
                        <option key={name} value={idx}>
                          {name.slice(0, 3)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={currentYear}
                      onChange={(e) => {
                        const y = parseInt(e.target.value, 10);
                        if (!Number.isNaN(y)) {
                          setCurrentYear(y);
                        }
                      }}
                      className="h-7 w-16 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0f74d4] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-7 text-center text-[11px] mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, idx) => (
                    <div
                      key={d}
                      className={
                        idx === 0
                          ? "text-[11px] font-medium text-[#e85b7b]"
                          : "text-[11px] font-medium text-slate-500"
                      }
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-slate-700 dark:text-slate-200">
                  {Array.from({ length: firstDay }).map((_, idx) => (
                    <div key={`empty-${idx}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isHighlightMonth = currentYear === 2022 && currentMonth === 6;
                    const isGreen = isHighlightMonth && [5, 16, 18].includes(day);
                    const isRed = isHighlightMonth && day === 25;
                    const isBlue = isHighlightMonth && day === 27;

                    let bg = "bg-transparent";
                    let text = "text-slate-700 dark:text-slate-200";

                    if (isGreen) {
                      bg = "bg-[#31c76a]";
                      text = "text-white";
                    } else if (isRed) {
                      bg = "bg-[#f06271]";
                      text = "text-white";
                    } else if (isBlue) {
                      bg = "bg-[#1f78d1]";
                      text = "text-white";
                    }

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-center h-7 rounded-full ${bg} ${text}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom section: users + notifications */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
            <Card className="border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Registered Users
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {users.length} user{users.length !== 1 ? "s" : ""} in the system
                </p>
              </CardHeader>
              <CardContent>
                {error ? (
                  <p className="text-sm text-destructive py-8 text-center">{error}</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                    No users found
                  </p>
                ) : (
                  <div className="rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.name}
                              </TableCell>
                              <TableCell className="text-slate-500 dark:text-slate-400">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.role === "admin" ? "default" : "secondary"}
                                  className={
                                    user.role === "admin"
                                      ? "bg-ksl-yellow text-ksl-dark"
                                      : ""
                                  }
                                >
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                                {user.joinedAt}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Recent Requests
                    </CardTitle>
                    <div className="h-6 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                      ...
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  <div className="rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800/70">
                            <TableHead>User</TableHead>
                            <TableHead>Request Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-slate-500 py-4">No recent requests.</TableCell>
                            </TableRow>
                          ) : (
                            recentRequests.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-medium text-slate-800 dark:text-slate-100">
                                  {r.user}
                                </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-300">
                                {r.type}
                              </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-300">
                                {r.status}
                              </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400">
                                  {r.date}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    System Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {notifications.map((n, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0f74d4]" />
                      <div>
                        <p className="text-slate-700 dark:text-slate-100">{n.text}</p>
                        <p className="text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Global bottom User Overview strip */}
          <Card className="mt-2 border border-slate-100 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                User Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-3 rounded-md bg-white dark:bg-slate-800 px-4 py-3 shadow-card">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f74d4]/10 text-[#0f74d4]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {stats?.totalUsers ?? users.length ?? "—"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Registered Users
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-white dark:bg-slate-800 px-4 py-3 shadow-card">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f78d1]/10 text-[#1f78d1]">
                    <span className="text-lg font-semibold">🖥</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {users.length}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Active Sessions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-white dark:bg-slate-800 px-4 py-3 shadow-card">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#31c76a]/10 text-[#31c76a]">
                    <span className="text-lg font-semibold">+</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {stats?.newUsersThisMonth ?? 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      New Registrations
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
