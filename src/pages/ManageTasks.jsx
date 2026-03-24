import React, { useEffect, useState, useCallback } from 'react';
import API from '../api/axiosConfig';
import {
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  User,
  ChevronDown,
  ChevronUp,
  History,
  Layers,
  Repeat,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  X,
  Maximize2,
  Paperclip,
  ShieldCheck,
  ClipboardList as LucideClipboard,
  Search,
  CheckCircle2,
  ArrowRight,
  Calendar
} from 'lucide-react';
import RevisionPanel from '../components/RevisionPanel';

/**
 * MANAGE TASKS: MISSION CONTROL MODULE v1.8
 * Updated: Integrated Assigner and History Performer names for maximum accountability.
 */
const ManageTasks = ({ assignerId, tenantId }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [timeFilter, setTimeFilter] = useState('All');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const currentAssignerId = assignerId || user?._id || user?.id;
  const currentTenantId = tenantId || localStorage.getItem('tenantId');

  const applyTimeFilter = useCallback((range, allTasks = tasks) => {
    setTimeFilter(range);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filtered = allTasks.filter(task => {
      if (!task.deadline || range === 'All') return true;

      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      if (range === 'Today') {
        return deadline.getTime() === now.getTime();
      }

      if (range === 'Next 7 Days') {
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return deadline >= now && deadline <= nextWeek;
      }

      if (range === 'Pending Work') {
        return deadline.getTime() < now.getTime() && task.status !== 'Verified' && task.status !== 'Completed';
      }

      return true;
    });

    setFilteredTasks(filtered);
  }, [tasks]);

  const fetchData = useCallback(async () => {
    if (!currentAssignerId || !currentTenantId) return;
    try {
      setLoading(true);

      const isEmployee = user?.role === 'employee';
      const taskEndpoint = isEmployee
        ? `/tasks/doer/${currentAssignerId}`
        : `/tasks/assigner/${currentAssignerId}`;

      const [taskRes, empRes] = await Promise.all([
        API.get(taskEndpoint).catch(() => ({ data: [] })),
        !isEmployee
          ? API.get(`/superadmin/employees/${currentTenantId}`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] })
      ]);

      const rawTaskData = Array.isArray(taskRes.data)
        ? taskRes.data
        : (taskRes.data?.tasks || taskRes.data?.data || []);

      const employeeData = Array.isArray(empRes.data)
        ? empRes.data
        : (empRes.data?.employees || empRes.data?.data || []);

      const delegationOnly = rawTaskData.map(t => ({ ...t, taskType: 'Delegation' }));
      const sorted = delegationOnly.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setTasks(sorted);
      setEmployees(employeeData);
      setFilteredTasks(sorted);
      setTimeFilter('All');
    } catch (err) {
      console.error("Fetch error:", err);
      setTasks([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [currentAssignerId, currentTenantId, user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    applyTimeFilter(timeFilter);
  }, [timeFilter, applyTimeFilter]);

  const handleVerifyTask = async (taskId, isSatisfied) => {
    const status = isSatisfied ? 'Verified' : 'Accepted';
    const remarks = !isSatisfied ? prompt("Tactical Feedback: Identify required corrections:") : "Directive evidence verified.";

    if (!isSatisfied && !remarks) return;

    try {
      await API.put(`/tasks/respond`, {
        taskId, status, remarks, doerId: currentAssignerId
      });
      alert(isSatisfied ? "Handshake Complete: Mission Verified." : "Correction Issued: Returning to Node.");
      fetchData();
    } catch (err) {
      alert("Protocol Error: Status update failed.");
    }
  };

  const handleCancelTask = async (taskId) => {
    if (window.confirm("PERMANENT TERMINATION: Purge this mission node from the registry?")) {
      try {
        await API.delete(`/tasks/${taskId}`);
        fetchData();
      } catch (err) {
        alert("Action failed.");
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-6 bg-transparent">
      <div className="relative">
        <RefreshCcw className="animate-spin text-primary" size={48} />
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Loading...</p>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700  selection:bg-primary/30">

      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-8 right-8 bg-red-600 hover:bg-red-500 p-4 rounded-full text-white shadow-2xl transition-all active:scale-90 z-20 cursor-pointer" onClick={() => setPreviewImage(null)}><X size={28} /></button>
          <img src={previewImage} alt="Mission Evidence" className="max-w-full max-h-[90vh] rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500" />
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
        <div className="flex items-center gap-5">
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shadow-inner shrink-0">
            <LucideClipboard size={32} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none truncate">Work Monitor</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-wide mt-3 opacity-80 italic">Track assigned work and check staff progress.</p>
          </div>
        </div>
        <button onClick={fetchData} className="group w-full md:w-auto bg-card hover:bg-background border border-border px-8 py-4 rounded-2xl text-foreground font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl hover:shadow-primary/5">
          <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700 text-primary" /> Refresh
        </button>
      </div>

      {/* TIME FILTERS */}
      <div className="flex flex-wrap gap-3 mb-10">
        {['All', 'Today', 'Next 7 Days', 'Pending Work'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeFilter(range)}
            className={`px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${timeFilter === range
              ? 'bg-primary text-white dark:text-slate-950 border-primary shadow-primary/20'
              : 'bg-card text-slate-500 border-border hover:border-slate-400'
              }`}
          >
            {range}
          </button>
        ))}
      </div>



      <div className="h-[600px] flex flex-col overflow-hidden rounded-xl border border-border ">


      {/* GRID HEADER */}
      <div className="hidden lg:grid grid-cols-[2.2fr_1fr_1fr_1fr_1.5fr] 
px-10 py-6 bg-card backdrop-blur-xl 
border border-border font-black text-slate-400 
text-[11px] uppercase tracking-[0.25em] items-center 
shadow-lg sticky top-0 z-20">
        <div>Task Name</div>
        {/*<div>Description</div>*/}
        <div>Assigned To</div>
        <div>Deadline</div>
        <div>Status</div>
        <div className="text-right pr-4">Action</div>
      </div>

      {/* DATA TERMINAL */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-background lg:bg-card border border-border rounded-b-[2.5rem] shadow-2xl">
        {filteredTasks.map(task => {
          const isRevision = task.status === 'Revision Requested';
          const isExpanded = expandedTaskId === task._id;

          return (
            <div key={task._id} className="flex flex-col border-b border-border last:border-0 group transition-all duration-300">
              <div
                onClick={() => toggleExpand(task._id)}
                className={`flex flex-col lg:grid lg:grid-cols-[2.2fr_1fr_1fr_1fr_1.5fr] items-start lg:items-center px-6 py-6 lg:px-10 lg:py-7 cursor-pointer transition-all hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] ${isExpanded ? 'bg-slate-100/60 dark:bg-primary/[0.08]' : ''} ${isRevision ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-4 w-full lg:w-auto mb-3 lg:mb-0 min-w-0">
                  <div className="shrink-0">
                    {isExpanded ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-slate-400 dark:text-slate-600" />}
                  </div>
                  <span className={`font-black text-sm lg:text-base uppercase tracking-tight truncate leading-tight ${isExpanded ? 'text-primary' : 'text-foreground'}`}>{task.title}</span>
                </div>

                {/*<div className="hidden lg:block text-slate-500 dark:text-slate-400 text-xs truncate pr-12 font-bold uppercase tracking-tight opacity-70 italic">{task.description || "No tactical details."}</div>*/}

                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-black text-[13px] uppercase tracking-tight mb-3 lg:mb-0">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] shadow-sm">{task.doerId?.name?.charAt(0).toUpperCase() || "U"}</div>
                  {task.doerId?.name || 'Unassigned Node'}
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 font-bold text-[11px] mb-3 lg:mb-0">
                  <Calendar size={14} className="text-primary/40" /> {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'AWAITING'}
                </div>

                <div className="mb-4 lg:mb-0">
                  <span className={`inline-flex px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest border shadow-sm ${task.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    task.status === 'Completed' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'}`}>
                    {task.status || 'Active Node'}
                  </span>
                </div>

               
              <div className="flex justify-end gap-3 w-full lg:w-auto transition-all duration-300">
  {task.status === 'Completed' && (
    <div className="flex gap-2 w-full lg:w-auto">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleVerifyTask(task._id, true);
        }}
        className="flex-1 lg:flex-none p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white dark:hover:text-slate-950 transition-all active:scale-90 shadow-sm"
      >
        <CheckCircle size={18} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleVerifyTask(task._id, false);
        }}
        className="flex-1 lg:flex-none p-3 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
      >
        <XCircle size={18} />
      </button>
    </div>
  )}
  <button onClick={(e) => { e.stopPropagation(); handleCancelTask(task._id); }} className="flex-1 lg:flex-none p-3 bg-background border border-border text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all active:scale-90">
                  <Trash2 size={18} />
                </button>

</div>
              </div>

              {/* EXPANDED INTEL VIEW: UPDATED TO SHOW ASSIGNER AND PERFORMER NAMES */}
              {isExpanded && (
                  <div className="bg-background/80 backdrop-blur-xl border-t border-border animate-in slide-in-from-top-4 duration-500">
                    {console.log(task)}
                  {/* 🔥 HEADER INSIDE EXPAND */}
                  <div className="px-6 lg:px-10 pt-6">
                    <h3
                        className="text-lg lg:text-xl font-black uppercase tracking-tight text-foreground truncate"
                        title={task.title}
                    >
                      {task.title}
                    </h3>
                  </div>

      <div className="p-6 lg:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT */}
        <div className="space-y-6">
          <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 px-1">
            <AlertTriangle size={16} /> Task Details
          </h4>

          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-lg space-y-6">

            {/* ASSIGNER / DOER */}
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
              <div>
                <strong className="text-slate-400 block text-[8px] font-black uppercase tracking-widest">
                  Issued By
                </strong>
                <span className="text-primary text-xs font-black uppercase break-words">
                  {task.assignerId?.name || "System Registry"}
                </span>
              </div>
              <div>
                <strong className="text-slate-400 block text-[8px] font-black uppercase tracking-widest">
                  Target
                </strong>
                <span className="text-foreground text-xs font-black uppercase break-words">
                  {task.doerId?.name}
                </span>
              </div>
            </div>

            {/* 🔥 DESCRIPTION FIX */}
            <div className="space-y-3">
              <strong className="text-primary block text-[10px] font-black uppercase tracking-widest opacity-90">
                Task Description
              </strong>

              <div className="bg-background border border-border rounded-xl p-4 max-h-[140px] overflow-y-auto custom-scrollbar">
                <p className="text-slate-800 dark:text-foreground text-sm font-bold uppercase tracking-tight leading-relaxed break-words">
                  {task.description || "No supplemental directives detected."}
                </p>
              </div>
            </div>

            {/* FILES */}
            {Array.isArray(task.files) && task.files.some(f => !f.fileName.includes("Evidence")) && (
              <div className="space-y-3 pt-6 border-t border-border/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Attachments
                </p>

                <div className="flex flex-wrap gap-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {task.files
                    .filter(f => !f.fileName.includes("Evidence"))
                    .map((file, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewImage(file.fileUrl)}
                        className="bg-background border border-border px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:border-primary/40 transition-all"
                      >
                        <Paperclip size={14} /> {file.fileName}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* PROOF */}
            {(task.status === 'Completed' || task.status === 'Verified') && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h5 className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                  Execution Proof
                </h5>

                <div className="bg-background p-4 rounded-xl border border-border italic max-h-[120px] overflow-y-auto custom-scrollbar">
                  <p className="text-xs font-bold uppercase break-words">
                    "{task.remarks || "No remarks."}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {Array.isArray(task.files) &&
                    task.files
                      .filter(f => f.fileName.includes("Evidence"))
                      .map((file, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewImage(file.fileUrl)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all"
                        >
                          <Maximize2 size={14} /> View Proof
                        </button>
                      ))}
                </div>
              </div>
            )}
          </div>
          

          {isRevision && (
            <RevisionPanel
              task={task}
              employees={employees}
              assignerId={currentAssignerId}
              onSuccess={fetchData}
            />
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 px-1">
            <History size={16} /> Action History
          </h4>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-card p-6 rounded-[2rem] border border-border shadow-lg space-y-6">

            {Array.isArray(task.history) && task.history.length > 0 ? (
              [...task.history].reverse().map((log, i) => (
                <div key={i} className="relative pl-6 border-l border-border flex flex-col gap-2">

                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-primary">{log.action}</span>
                      <span className="text-slate-400">BY</span>
                      <span className="bg-muted px-2 rounded">
                        {log.performedBy?.name || "System"}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold uppercase break-words">
                    "{log.remarks || "System update"}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-[10px] font-black uppercase opacity-50">
                No History
              </p>
            )}
              

          </div>
        </div>
      </div>
    </div>
  </div>
)} 
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-6 opacity-30 grayscale transition-colors">
            < LucideClipboard size={80} className="text-primary" />
            <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">No Assigned Directives Detected</p>
          </div>
        )}
      </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.2); 
          border-radius: 20px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
      `}</style>
    </div>
  );
};

export default ManageTasks;