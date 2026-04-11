import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, Hand, FileSearch, Trash2, Edit, CheckCircle, Clock, 
  Archive, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, 
  RefreshCw, Layers, LayoutGrid, Download, FileJson, SpellCheck 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGestures, createGesture } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Gesture = {
  _id: string;
  name: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "Active" | "Draft" | "Archived";
  updatedAt: string;
};

const statusColor: Record<Gesture["status"], string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  Draft: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Archived: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

const difficultyColor: Record<Gesture["difficulty"], string> = {
  Beginner: "text-emerald-400 bg-emerald-500/10",
  Intermediate: "text-blue-400 bg-blue-500/10",
  Advanced: "text-indigo-400 bg-indigo-500/10",
};

const ManageGestures = () => {
  const [gestures, setGestures] = useState<Gesture[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Gesture["status"] | "All">("All");

  // Create Mode
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<Gesture["difficulty"]>("Beginner");
  const [newStatus, setNewStatus] = useState<Gesture["status"]>("Active");
  const [isAdding, setIsAdding] = useState(false);

  // Edit Mode
  const [editGesture, setEditGesture] = useState<Gesture | null>(null);

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<{ key: keyof Gesture; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchGestures();
  }, []);

  const fetchGestures = async () => {
    try {
      setLoading(true);
      const data = await getGestures();
      // Ensure we always have an _id mapped for functionality if API misses it
      const mapped = data.map((d: any, idx: number) => ({ ...d, _id: d._id || `temp-${idx}`, updatedAt: d.updatedAt || new Date().toISOString() }));
      setGestures(mapped);
    } catch (err) {
      toast.error("Failed to load gestures");
    } finally {
      setLoading(false);
    }
  };

  const filteredGestures = useMemo(() => {
    return gestures.filter((g) => {
      const matchesSearch =
        search.trim().length === 0 ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" ? true : g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [gestures, search, statusFilter]);

  const sortedGestures = useMemo(() => {
    let sortable = [...filteredGestures];
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
  }, [filteredGestures, sortConfig]);

  const totalPages = Math.ceil(sortedGestures.length / itemsPerPage);
  const paginatedGestures = sortedGestures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortConfig]);

  const handleSort = (key: keyof Gesture) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleAddGesture = async () => {
    if (!newName.trim() || !newCategory.trim()) return;
    try {
      setIsAdding(true);
      const newGesture = await createGesture({
        name: newName.trim(),
        category: newCategory.trim(),
        difficulty: newDifficulty,
        status: newStatus,
      });
      // Safety mapping if missing
      const safeGesture = { ...newGesture, _id: newGesture._id || `temp-${Date.now()}`, updatedAt: new Date().toISOString() };
      setGestures((prev) => [safeGesture, ...prev]);
      toast.success(`${newName} added to the gesture registry`);
      setNewName("");
      setNewCategory("");
      setNewDifficulty("Beginner");
      setNewStatus("Active");
      setIsAddOpen(false);
    } catch (err) {
      toast.error("Failed to add gesture database entry");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editGesture) return;
    setGestures((prev) => prev.map((g) => (g._id === editGesture._id ? { ...editGesture, updatedAt: new Date().toISOString() } : g)));
    toast.success(`${editGesture.name} successfully updated.`);
    setEditGesture(null);
  };

  const handleDelete = (id: string) => {
    setGestures((prev) => prev.filter((g) => g._id !== id));
    toast.success("Gesture securely deleted.");
  };

  const handleExportCSV = () => {
    const rows = [
      ["Gesture", "Category", "Difficulty", "Status", "Last Updated"],
      ...sortedGestures.map((g) => [
        g.name,
        g.category,
        g.difficulty,
        g.status,
        new Date(g.updatedAt).toLocaleDateString(),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ksl-gestures.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Gesture library exported successfully");
  };

  // Metrics
  const totalCount = gestures.length;
  const activeCount = gestures.filter((g) => g.status === "Active").length;
  const draftCount = gestures.filter((g) => g.status === "Draft").length;
  const advancedCount = gestures.filter((g) => g.difficulty === "Advanced").length;

  return (
    <div className="bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-slate-950 min-h-screen p-6 -mx-6 -mt-6 xl:p-10 pb-16 text-slate-50 transition-all duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 animate-in slide-in-from-top-4 duration-500">
        <div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 mb-2">
            <Hand className="w-3.5 h-3.5 mr-1.5" /> Core Machine Learning
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm pb-1">
            Gestures Library
          </h1>
          <p className="text-slate-400 mt-1 max-w-lg">
            View, search, construct and manage KSL gesture tracking definitions securely linked to your ML endpoints.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="bg-[#0f172a] border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-semibold shadow-xl">
            <Download className="mr-2 h-4 w-4" /> Export DB
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/20 font-bold border-0">
            <Plus className="mr-2 h-4 w-4" /> Add Gesture
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10 animate-in fade-in duration-700">
        <Card className="bg-[#0f172a]/80 backdrop-blur-sm border-white/5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-blue-500/10 transition-all text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Total Indexed</span>
              <Layers className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount}</div>
            <p className="text-xs text-slate-400 mt-1">Gestures in model buffer</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f172a]/80 backdrop-blur-sm border-white/5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-emerald-500/10 transition-all text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Active Deployments</span>
              <CheckCircle className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{activeCount}</div>
            <p className="text-xs text-slate-400 mt-1">Tracking live in app</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f172a]/80 backdrop-blur-sm border-white/5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-amber-500/10 transition-all text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Review Drafts</span>
              <FileJson className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{draftCount}</div>
            <p className="text-xs text-slate-400 mt-1">Requires metadata check</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f172a]/80 backdrop-blur-sm border-white/5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Advanced Signage</span>
              <SpellCheck className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-400">{advancedCount}</div>
            <p className="text-xs text-slate-400 mt-1">High-fidelity models</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table View */}
      <Card className="border border-white/10 bg-[#0f172a]/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden text-white animate-in slide-in-from-bottom-8 duration-700">
        <CardContent className="p-0">
          
          {/* Action Toolbar */}
          <div className="p-5 border-b border-white/10 bg-slate-900/40 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Lookup definitions by name or category..." 
                className="w-full bg-slate-950/80 border-white/10 pl-10 h-11 rounded-xl text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 transition-colors" 
              />
            </div>
            
            <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto">
              {(["All", "Active", "Draft", "Archived"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/60 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-slate-300 font-semibold py-4 pl-6 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('name')}>
                    Gesture Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('category')}>
                    Knowledge Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('difficulty')}>
                    Fidelity {sortConfig?.key === 'difficulty' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('status')}>
                    Engine Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white select-none transition-colors" onClick={() => handleSort('updatedAt')}>
                    Last Sync {sortConfig?.key === 'updatedAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                  </TableHead>
                  <TableHead className="text-right text-slate-300 font-semibold py-4 pr-6">Overrides</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center border-b-0">
                      <div className="flex flex-col justify-center items-center gap-3 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="font-semibold text-sm">Querying internal ML registry...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedGestures.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-900/80 flex items-center justify-center mb-5 border border-white/5 shadow-inner">
                          <FileSearch className="w-8 h-8 text-blue-500/50" />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">No Definitions Found</p>
                        <p className="text-sm text-slate-400 mb-5 max-w-sm">
                          There are currently no gesture configurations matching your active status or search filters.
                        </p>
                        <Button variant="outline" className="border-blue-500/30 bg-transparent text-blue-400 hover:bg-blue-500/10" onClick={() => { setSearch(""); setStatusFilter("All"); }}>
                          Reset Topology
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGestures.map((gesture) => (
                    <TableRow key={gesture._id} className="border-white/5 hover:bg-slate-800/80 even:bg-slate-900/30 transition-all duration-200">
                      <TableCell className="font-bold py-4 pl-6 text-white text-base">
                        {gesture.name}
                      </TableCell>
                      <TableCell className="text-slate-300 font-medium tracking-wide">
                        {gesture.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${difficultyColor[gesture.difficulty]} shadow-sm border-0 font-semibold`}>
                          {gesture.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColor[gesture.status]} uppercase tracking-wider text-[10px] font-bold`}>
                          {gesture.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400 font-medium">
                        {new Date(gesture.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right py-4 pr-6 space-x-1 whitespace-nowrap">
                        <Button variant="ghost" size="sm" className="h-8 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-bold text-xs" onClick={() => setEditGesture(gesture)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" onClick={() => handleDelete(gesture._id)} title="Delete Gesture">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Embedded Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/30">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, sortedGestures.length)}</span> of <span className="text-white font-bold">{sortedGestures.length}</span> definitions
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/10 bg-slate-800 hover:bg-slate-700 text-white shadow-md" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-bold text-white px-2">Page {currentPage} of {totalPages}</div>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/10 bg-slate-800 hover:bg-slate-700 text-white shadow-md" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adding Gesture Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-[#0f172a] border border-blue-500/20 text-white shadow-2xl shadow-blue-900/50">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
               <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><LayoutGrid className="w-6 h-6" /></div>
               Define New Gesture
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gesture Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Hello, Thank You" className="bg-slate-900/80 border-white/10 focus-visible:ring-blue-500 h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category Collection</label>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Greetings, Commands" className="bg-slate-900/80 border-white/10 focus-visible:ring-blue-500 h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complexity</label>
                <Select value={newDifficulty} onValueChange={(value) => setNewDifficulty(value as Gesture["difficulty"])}>
                  <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-11 font-semibold text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10 text-white font-medium">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engine Status</label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Gesture["status"])}>
                  <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-11 font-semibold text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10 text-white font-medium">
                    <SelectItem value="Active">Active Synced</SelectItem>
                    <SelectItem value="Draft">Draft Metadata</SelectItem>
                    <SelectItem value="Archived">Archived / Legacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 pt-4 mt-2">
            <Button variant="ghost" className="hover:bg-white/5 text-slate-300" onClick={() => setIsAddOpen(false)}>Discard</Button>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 border border-blue-500" onClick={handleAddGesture} disabled={!newName.trim() || !newCategory.trim() || isAdding}>
              {isAdding ? "Injecting..." : "Inject into Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gesture Modal */}
      <Dialog open={editGesture !== null} onOpenChange={(open) => !open && setEditGesture(null)}>
        <DialogContent className="bg-[#0f172a] border border-blue-500/20 text-white shadow-2xl shadow-blue-900/50">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
               <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><Edit className="w-6 h-6" /></div>
               Modify Gesture Params
            </DialogTitle>
          </DialogHeader>
          {editGesture && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gesture Name</label>
                <Input value={editGesture.name} onChange={(e) => setEditGesture({ ...editGesture, name: e.target.value })} className="bg-slate-900/80 border-white/10 focus-visible:ring-blue-500 h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category Collection</label>
                <Input value={editGesture.category} onChange={(e) => setEditGesture({ ...editGesture, category: e.target.value })} className="bg-slate-900/80 border-white/10 focus-visible:ring-blue-500 h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complexity</label>
                  <Select value={editGesture.difficulty} onValueChange={(value) => setEditGesture({ ...editGesture, difficulty: value as Gesture["difficulty"] })}>
                    <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-11 font-semibold text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white font-medium">
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engine Status</label>
                  <Select value={editGesture.status} onValueChange={(value) => setEditGesture({ ...editGesture, status: value as Gesture["status"] })}>
                    <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-11 font-semibold text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white font-medium">
                      <SelectItem value="Active">Active Synced</SelectItem>
                      <SelectItem value="Draft">Draft Metadata</SelectItem>
                      <SelectItem value="Archived">Archived / Legacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-white/10 pt-4 mt-2">
            <Button variant="ghost" className="hover:bg-white/5 text-slate-300" onClick={() => setEditGesture(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-lg shadow-emerald-500/20" onClick={handleSaveEdit}>Save Modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ManageGestures;
