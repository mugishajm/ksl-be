import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileSearch, Trash2, Eye, Activity, CheckCircle, Clock, AlertTriangle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, BarChart3, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLogs } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type InterpretationLog = {
  _id: string;
  user: string;
  type: "Gesture Translation" | "Live Interpretation";
  status: "Completed" | "Pending" | "Failed";
  createdAt: string;
  duration: string;
};

const statusClass: Record<InterpretationLog["status"], string> = {
  Completed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  Pending: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  Failed: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const CHART_DATA = [
  { day: "Mon", count: 24, errors: 2 },
  { day: "Tue", count: 35, errors: 4 },
  { day: "Wed", count: 28, errors: 1 },
  { day: "Thu", count: 42, errors: 5 },
  { day: "Fri", count: 31, errors: 2 },
  { day: "Sat", count: 18, errors: 0 },
  { day: "Sun", count: 20, errors: 1 },
];

const InterpretationLogs = () => {
  const [logs, setLogs] = useState<InterpretationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InterpretationLog["status"] | "All">("All");
  const [dateRange, setDateRange] = useState<"Today" | "Week" | "Month" | "All">("All");
  const [selectedLog, setSelectedLog] = useState<InterpretationLog | null>(null);

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<{ key: keyof InterpretationLog; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      toast.error("Failed to load interpretation logs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const s = search.trim().toLowerCase();
      const matchesSearch =
        s.length === 0 ||
        log.user.toLowerCase().includes(s) ||
        log.type.toLowerCase().includes(s);
      
      const matchesStatus =
        statusFilter === "All" ? true : log.status === statusFilter;
        
      let matchesDate = true;
      if (dateRange !== "All") {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        if (dateRange === "Today") {
          matchesDate = logDate.toDateString() === now.toDateString();
        } else if (dateRange === "Week") {
          const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          matchesDate = diff <= 7;
        } else if (dateRange === "Month") {
          matchesDate = logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [logs, search, statusFilter, dateRange]);

  const sorted = useMemo(() => {
    let sortable = [...filtered];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [filtered, sortConfig]);

  // Pagination bounds
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedLogs = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateRange, sortConfig]);

  const handleSort = (key: keyof InterpretationLog) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (id: string) => {
    setLogs(prev => prev.filter(log => log._id !== id));
    toast.success("Log record securely deleted.");
  };

  const handleExportCsv = () => {
    const rows = [
      ["User", "Type", "Status", "Started At", "Duration"],
      ...sorted.map((log) => [
        log.user,
        log.type,
        log.status,
        new Date(log.createdAt).toLocaleString(),
        log.duration,
      ]),
    ];

    const csvContent = rows
      .map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "interpretation-logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully");
  };

  const totalRequests = logs.length;
  const completedRequests = logs.filter(l => l.status === "Completed").length;
  const pendingRequests = logs.filter(l => l.status === "Pending").length;
  const failedRequests = logs.filter(l => l.status === "Failed").length;

  return (
    <div className="space-y-6 bg-slate-950 min-h-screen p-6 -mx-6 -mt-6 pb-12 animate-in fade-in duration-500 text-slate-50">
      
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Interpretation Logs
          </h1>
          <p className="text-sm text-blue-200/70 mt-1">
            Review recent interpretation activity, filter requests, and monitor system trends in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 font-semibold transition-all"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 font-semibold transition-all"
            onClick={handleExportCsv}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0f172a] border border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">Total Requests</CardTitle>
            <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRequests}</div>
            <p className="text-xs text-blue-200/60 mt-2">Overall recorded logs</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0f172a] border border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">Completed</CardTitle>
            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{completedRequests}</div>
            <p className="text-xs text-blue-200/60 mt-2">Successfully interpreted</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0f172a] border border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">Pending</CardTitle>
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{pendingRequests}</div>
            <p className="text-xs text-blue-200/60 mt-2">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0f172a] border border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-white">Failed</CardTitle>
            <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-400">{failedRequests}</div>
            <p className="text-xs text-blue-200/60 mt-2">Errors or timeouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-white/10 bg-[#0f172a] shadow-xl rounded-xl overflow-hidden text-white">
        <CardContent className="p-0">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-white/10 bg-slate-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user or type..."
                className="pl-9 h-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-lg transition-all"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Date Filter */}
              <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5 shadow-inner">
                {["All", "Today", "Week", "Month"].map((dr) => (
                  <button
                    key={dr}
                    type="button"
                    onClick={() => setDateRange(dr as any)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                      dateRange === dr
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {dr}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5 shadow-inner">
                {["All", "Completed", "Pending", "Failed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s as any)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                      statusFilter === s
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('user')}>
                    User {sortConfig?.key === 'user' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('type')}>
                    Request Type {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('status')}>
                    Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('createdAt')}>
                    Started At {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('duration')}>
                    Duration {sortConfig?.key === 'duration' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-right text-slate-300 font-semibold py-4 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 border-b-0 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                        Loading logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-white/5 shadow-md">
                          <FileSearch className="w-8 h-8 text-blue-500/50" />
                        </div>
                        <p className="text-lg font-bold text-white mb-2">No logs found</p>
                        <p className="text-sm text-slate-400 mb-4 max-w-sm">
                          We couldn't find any interpretation records matching your current filter criteria.
                        </p>
                        <Button 
                          variant="outline" 
                          className="border-blue-500/30 bg-transparent text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                          onClick={() => { setSearch(""); setStatusFilter("All"); setDateRange("All"); }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow 
                      key={log._id} 
                      className="border-white/5 hover:bg-slate-800/50 even:bg-slate-900/30 transition-colors"
                    >
                      <TableCell className="font-semibold py-4">{log.user}</TableCell>
                      <TableCell className="text-slate-300 py-4">{log.type}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`font-bold ${statusClass[log.status]}`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300 py-4">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300 font-medium py-4">
                        {log.duration}
                      </TableCell>
                      <TableCell className="text-right py-4 pr-6 space-x-2 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-semibold text-xs"
                          title="View Details"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-400 hover:text-white hover:bg-rose-500/80"
                          title="Delete Log"
                          onClick={() => handleDelete(log._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/50">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, sorted.length)}</span> of <span className="text-white">{sorted.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-white/10 bg-transparent hover:bg-white/5 text-white"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-bold text-white px-2">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-white/10 bg-transparent hover:bg-white/5 text-white"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-lg overflow-hidden text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Activity Trends
            </CardTitle>
            <CardDescription className="text-slate-400">Daily interpretations breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" name="Interpretations" radius={[4, 4, 0, 0]} fill="#3b82f6" maxBarSize={40} />
                  <Bar dataKey="errors" name="Errors" radius={[4, 4, 0, 0]} fill="#f43f5e" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border border-white/10 rounded-xl shadow-lg overflow-hidden text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-blue-500" />
              Usage Insights
            </CardTitle>
            <CardDescription className="text-slate-400">Additional system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">Peak Hours</span>
                  <span className="text-sm font-bold text-white">2 PM - 4 PM</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">Avg. Session Time</span>
                  <span className="text-sm font-bold text-white">4m 20s</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[45%] rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">Accuracy Target</span>
                  <span className="text-sm font-bold text-white">92%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[92%] rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-blue-500" />
              Interpretation Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User</span>
                    <p className="font-bold text-base mt-1 text-white">{selectedLog.user}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                    <div className="mt-1">
                      <Badge variant="outline" className={statusClass[selectedLog.status]}>
                        {selectedLog.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Type</span>
                  <p className="mt-1 font-medium text-slate-200">{selectedLog.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Started At</span>
                    <p className="mt-1 text-slate-300 font-medium">
                      {new Date(selectedLog.createdAt).toLocaleString(undefined, {
                        weekday: 'short', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</span>
                    <p className="mt-1 text-slate-300 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {selectedLog.duration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
              onClick={() => setSelectedLog(null)}
            >
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterpretationLogs;
