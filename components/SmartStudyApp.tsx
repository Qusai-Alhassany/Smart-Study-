"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen,
  BrainCircuit, Calendar, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Circle, Clock3, Code2, Flame, GraduationCap,
  LayoutDashboard, ListTodo, Menu, MessageCircle, MoreHorizontal, Pause,
  Play, Plus, RotateCcw, Search, Send, Settings2, ShieldCheck, Sigma,
  SlidersHorizontal, Sparkles, Target, Timer, Trash2, TrendingUp, Trophy,
  WandSparkles, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FocusSession, PlanSession, Priority, QuizPayload, StudyData, StudyTask, Subject, TaskType } from "@/lib/types";
import {
  STORAGE_KEY, SUBJECT_COLORS, addDays, createDemoData, daysFromToday,
  deadlineLabel, durationLabel, formatDate, fromISO, generateWeeklyPlan,
  localISO, makeId, minutesOnDate, startOfWeek, studyStreak, subjectFor, totalMinutes,
} from "@/lib/study";

type View = "dashboard" | "planner" | "tasks" | "subjects" | "practice" | "coach" | "analytics" | "settings";
type NavItem = { view: View; label: string; icon: LucideIcon };
const menuPrimary: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "planner", label: "Study Planner", icon: CalendarDays },
  { view: "tasks", label: "My Tasks", icon: ListTodo },
  { view: "subjects", label: "Subjects", icon: BookOpen },
];
const menuTools: NavItem[] = [
  { view: "practice", label: "Practice Quiz", icon: BrainCircuit },
  { view: "coach", label: "AI Study Coach", icon: MessageCircle },
  { view: "analytics", label: "Analytics", icon: Activity },
];
const sectionNames: Record<View, string> = {
  dashboard: "Overview", planner: "Study planner", tasks: "My tasks", subjects: "Subjects",
  practice: "Practice quiz", coach: "AI study coach", analytics: "Learning insights", settings: "Settings",
};
const typeLabels: Record<TaskType, string> = { assignment: "Assignment", exam: "Exam", revision: "Revision" };

function SubjectGlyph({ subject, size = 19 }: { subject: Subject; size?: number }) {
  const Icon = subject.icon === "code" ? Code2 : subject.icon === "sigma" ? Sigma : subject.icon === "brain" ? BrainCircuit : BookOpen;
  return <Icon size={size} strokeWidth={2} />;
}

function SubjectMark({ subject, size = "md" }: { subject: Subject; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`subject-mark subject-mark-${size}`} style={{ background: `${subject.color}1c`, color: subject.color }}>
      <SubjectGlyph subject={subject} size={size === "lg" ? 25 : size === "sm" ? 16 : 20} />
    </span>
  );
}

function StatusTag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "lavender" | "orange" | "green" | "red" }) {
  return <span className={`status-tag tag-${tone}`}>{children}</span>;
}

function SectionHead({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, description, action }: { icon?: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={25} /></span>
      <h3>{title}</h3><p>{description}</p>{action}
    </div>
  );
}

function Dialog({ title, onClose, children, width = "normal" }: { title: string; onClose: () => void; children: ReactNode; width?: "normal" | "wide" }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`dialog dialog-${width}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ subjects, onSave, onClose, task }: { subjects: Subject[]; onSave: (task: StudyTask) => void; onClose: () => void; task?: StudyTask }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [subjectId, setSubjectId] = useState(task?.subjectId ?? subjects[0]?.id ?? "");
  const [type, setType] = useState<TaskType>(task?.type ?? "assignment");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? localISO(addDays(new Date(), 3)));
  const [estimateMinutes, setEstimateMinutes] = useState(task?.estimateMinutes ?? 60);
  const [notes, setNotes] = useState(task?.notes ?? "");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !subjectId || !dueDate) return;
    onSave({ id: task?.id ?? makeId(), title: title.trim(), subjectId, type, priority, dueDate, estimateMinutes: Math.max(20, Number(estimateMinutes) || 30), notes: notes.trim(), completed: task?.completed ?? false, createdAt: task?.createdAt ?? localISO(new Date()) });
  };
  return (
    <Dialog title={task ? "Edit task" : "Add a new task"} onClose={onClose}>
      <form onSubmit={submit} className="dialog-form">
        <label className="field"><span>Task title</span><input required maxLength={100} autoFocus placeholder="e.g. Finish biology assignment" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="form-row">
          <label className="field"><span>Subject</span><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="field"><span>Task type</span><select value={type} onChange={(e) => setType(e.target.value as TaskType)}><option value="assignment">Assignment</option><option value="exam">Exam</option><option value="revision">Revision</option></select></label>
        </div>
        <div className="form-row">
          <label className="field"><span>Due date</span><input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          <label className="field"><span>Priority</span><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></label>
        </div>
        <label className="field"><span>Estimated study time</span><select value={estimateMinutes} onChange={(e) => setEstimateMinutes(Number(e.target.value))}>{[25, 30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)}</option>)}</select></label>
        <label className="field"><span>Notes <small>(optional)</small></span><textarea rows={3} maxLength={500} placeholder="Add helpful details..." value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="dialog-footer"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Check size={17} /> {task ? "Save changes" : "Add task"}</button></div>
      </form>
    </Dialog>
  );
}

function SubjectForm({ onSave, onClose }: { onSave: (subject: Subject) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [weeklyGoal, setWeeklyGoal] = useState(180);
  return (
    <Dialog title="Add a subject" onClose={onClose}>
      <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; onSave({ id: makeId(), name: name.trim(), code: code.trim() || "COURSE", color, icon: "book", weeklyGoalMinutes: weeklyGoal }); }}>
        <label className="field"><span>Subject name</span><input autoFocus maxLength={60} required placeholder="e.g. Organic Chemistry" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="form-row">
          <label className="field"><span>Course code</span><input maxLength={20} placeholder="e.g. CHEM 201" value={code} onChange={(e) => setCode(e.target.value)} /></label>
          <label className="field"><span>Weekly study goal</span><select value={weeklyGoal} onChange={(e) => setWeeklyGoal(Number(e.target.value))}>{[60, 120, 180, 240, 300, 420, 600].map((m) => <option value={m} key={m}>{durationLabel(m)}</option>)}</select></label>
        </div>
        <div className="field"><span>Choose a color</span><div className="color-options">{SUBJECT_COLORS.map((c) => <button type="button" className={`color-swatch ${c === color ? "selected" : ""}`} style={{ background: c }} aria-label={`Choose ${c}`} aria-pressed={c === color} key={c} onClick={() => setColor(c)}>{c === color && <Check size={17} />}</button>)}</div></div>
        <div className="dialog-footer"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={17} /> Add subject</button></div>
      </form>
    </Dialog>
  );
}

type FocusTimer = { taskId?: string; subjectId: string; title: string; initialSeconds: number; secondsLeft: number; running: boolean };
function FocusDialog({ focus, setFocus, onSave, onClose }: { focus: FocusTimer; setFocus: Dispatch<SetStateAction<FocusTimer | null>>; onSave: (minutes: number, subjectId: string, taskId?: string) => void; onClose: () => void }) {
  useEffect(() => {
    if (!focus.running || focus.secondsLeft <= 0) return;
    const interval = window.setInterval(() => setFocus((previous) => previous ? { ...previous, secondsLeft: Math.max(0, previous.secondsLeft - 1), running: previous.secondsLeft > 1 } : null), 1000);
    return () => window.clearInterval(interval);
  }, [focus.running, focus.secondsLeft <= 0, setFocus]);
  const finished = focus.initialSeconds - focus.secondsLeft;
  const progress = Math.round((finished / focus.initialSeconds) * 100);
  const mm = String(Math.floor(focus.secondsLeft / 60)).padStart(2, "0");
  const ss = String(focus.secondsLeft % 60).padStart(2, "0");
  return (
    <Dialog title="Focus session" onClose={onClose}>
      <div className="focus-dialog-content">
        <div className="focus-ring" style={{ background: `conic-gradient(#7167db ${progress}%, #e9e8f8 ${progress}% 100%)` }}><div className="focus-ring-center"><Timer size={22} /><strong>{mm}:{ss}</strong><span>{focus.secondsLeft === 0 ? "Session complete!" : focus.running ? "Stay in the zone" : "Paused"}</span></div></div>
        <h3>{focus.title}</h3><p>One thing at a time. You&apos;ve got this.</p>
        <div className="focus-controls">
          <button className="button button-outline" onClick={() => setFocus((current) => current ? { ...current, running: false, secondsLeft: current.initialSeconds } : null)}><RotateCcw size={17} /> Reset</button>
          <button className="button button-primary" onClick={() => setFocus((current) => current ? { ...current, running: !current.running } : null)} disabled={focus.secondsLeft === 0}>{focus.running ? <Pause size={17} /> : <Play size={17} />}{focus.running ? "Pause" : "Resume"}</button>
        </div>
        <button className="button button-soft full-width" onClick={() => onSave(Math.max(1, Math.ceil(finished / 60)), focus.subjectId, focus.taskId)}><CheckCircle2 size={18} /> Save {finished >= 60 ? `${Math.ceil(finished / 60)}m` : "session"} & finish</button>
        <p className="microcopy">Study time is logged when you click Save & finish. Your timer stays on this page.</p>
      </div>
    </Dialog>
  );
}

function TaskListItem({ task, subject, onToggle, onEdit, onDelete, onFocus, compact = false }: { task: StudyTask; subject?: Subject; onToggle: (id: string) => void; onEdit?: (task: StudyTask) => void; onDelete?: (id: string) => void; onFocus?: (task: StudyTask) => void; compact?: boolean }) {
  return (
    <div className={`task-list-item ${task.completed ? "task-is-done" : ""} ${compact ? "task-compact" : ""}`}>
      <button className={`task-check ${task.completed ? "is-checked" : ""}`} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} title={task.completed ? "Mark incomplete" : "Mark completed"} onClick={() => onToggle(task.id)}>{task.completed && <Check size={15} strokeWidth={3} />}</button>
      {subject && <SubjectMark subject={subject} size="sm" />}
      <div className="task-main"><strong>{task.title}</strong><div className="task-subline"><span>{subject?.name ?? "Other"}</span><span className="subline-dot">·</span><span>{typeLabels[task.type]}</span></div></div>
      {!compact && <StatusTag tone={task.priority === "high" ? "orange" : "neutral"}>{task.priority === "high" ? "High priority" : task.priority === "medium" ? "Medium" : "Low"}</StatusTag>}
      <div className={`due-meta ${!task.completed && daysFromToday(task.dueDate) <= 1 ? "due-soon" : ""}`}><Calendar size={14} /><span>{task.completed ? "Completed" : deadlineLabel(task.dueDate)}</span></div>
      {(onFocus || onEdit || onDelete) && <div className="task-actions">
        {onFocus && !task.completed && <button className="icon-button task-action" onClick={() => onFocus(task)} title="Start focus session" aria-label={`Focus on ${task.title}`}><Play size={17} /></button>}
        {onEdit && <button className="icon-button task-action" onClick={() => onEdit(task)} title="Edit task" aria-label={`Edit ${task.title}`}><MoreHorizontal size={18} /></button>}
        {onDelete && <button className="icon-button task-action delete-action" onClick={() => onDelete(task.id)} title="Delete task" aria-label={`Delete ${task.title}`}><Trash2 size={17} /></button>}
      </div>}
    </div>
  );
}

function Dashboard({ data, plan, navigate, addTask, toggleTask, startFocus }: { data: StudyData; plan: PlanSession[]; navigate: (view: View) => void; addTask: () => void; toggleTask: (id: string) => void; startFocus: (task: StudyTask) => void }) {
  const todayISO = localISO(new Date());
  const weekStart = startOfWeek(new Date());
  const weeklySessions = data.sessions.filter((s) => s.date >= localISO(weekStart) && s.date <= localISO(addDays(weekStart, 6)));
  const weekMinutes = totalMinutes(weeklySessions);
  const todayMinutes = minutesOnDate(data.sessions, todayISO);
  const completed = data.tasks.filter((t) => t.completed).length;
  const pending = data.tasks.filter((t) => !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const exams = pending.filter((t) => t.type === "exam").length;
  const todayPlan = plan.filter((item) => item.date === todayISO);
  const weeklyValues = Array.from({ length: 7 }, (_, i) => ({ date: localISO(addDays(weekStart, i)), minutes: minutesOnDate(data.sessions, localISO(addDays(weekStart, i))), label: formatDate(addDays(weekStart, i), { weekday: "short" }) }));
  const maxBar = Math.max(data.dailyGoalMinutes, ...weeklyValues.map((v) => v.minutes), 1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <>
      <div className="page-intro"><div><p className="eyebrow">YOUR LEARNING SPACE <span className="eyebrow-line" /></p><h1>{greeting}, {data.studentName}! <span className="wave-emoji">✳</span></h1><p>Here&apos;s what&apos;s happening with your studies today.</p></div><button className="button button-primary intro-add" onClick={addTask}><Plus size={18} /> Add new task</button></div>
      <div className="hero-banner">
        <div className="hero-copy"><div className="hero-badge"><Sparkles size={14} /> YOUR PERSONAL STUDY COMPANION</div><h2>Small steps today.<br /><em>Big results tomorrow.</em></h2><p>Your personalized study plan is ready. Stay focused, follow your rhythm, and make every session count.</p><button onClick={() => navigate("planner")} className="button button-hero">Explore my study plan <ArrowRight size={17} /></button></div>
        <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-art-card card-back"><BookOpen size={39} /></div><div className="hero-art-card card-front"><BrainCircuit size={57} strokeWidth={1.6} /><span className="hero-star hero-star-a">✦</span><span className="hero-star hero-star-b">✧</span></div><span className="art-spark art-spark-a">✦</span><span className="art-spark art-spark-b">✦</span><div className="art-floating-check"><Check size={19} /></div></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-purple"><Clock3 size={21} /></span><ArrowUpRight size={17} className="muted-icon" /></div><div className="stat-value">{(weekMinutes / 60).toFixed(1)}<small>h</small></div><div className="stat-label">Study time <span>this week</span></div></div>
        <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-green"><CheckCircle2 size={22} /></span><ArrowUpRight size={17} className="muted-icon" /></div><div className="stat-value">{completed}<small>/{data.tasks.length}</small></div><div className="stat-label">Tasks completed <span>all time</span></div></div>
        <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-orange"><CalendarDays size={21} /></span><ArrowUpRight size={17} className="muted-icon" /></div><div className="stat-value">{exams.toString().padStart(2, "0")}</div><div className="stat-label">Upcoming exams <span>stay prepared</span></div></div>
        <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-pink"><Flame size={22} /></span><ArrowUpRight size={17} className="muted-icon" /></div><div className="stat-value">{studyStreak(data.sessions)}<small>days</small></div><div className="stat-label">Study streak <span>keep it going!</span></div></div>
      </div>
      <div className="dashboard-columns">
        <section className="panel today-panel"><SectionHead title="Today’s study plan" detail="A little progress adds up every day." action={<button className="text-link" onClick={() => navigate("planner")}>View planner <ArrowRight size={16} /></button>} />
          <div className="study-timeline">
            {todayPlan.length ? todayPlan.map((item, index) => {
              const subject = subjectFor(data.subjects, item.subjectId);
              const task = data.tasks.find((t) => t.id === item.taskId);
              return <div className="timeline-item" key={item.id}><div className="timeline-axis"><span className={`timeline-dot ${index === 0 ? "timeline-current" : ""}`} />{index < todayPlan.length - 1 && <span className="timeline-line" />}</div><div className="timeline-hour">{item.startTime}</div>{subject && <SubjectMark subject={subject} />}<div className="timeline-info"><strong>{item.title}</strong><p>{subject?.name} <span>·</span> {durationLabel(item.durationMinutes)}</p></div>{task && <button className="timeline-play" onClick={() => startFocus(task)} title={`Start focusing on ${task.title}`} aria-label={`Start ${task.title}`}><Play size={16} fill="currentColor" /></button>}</div>;
            }) : <EmptyState icon={CalendarDays} title="Your day is clear" description="Add tasks with future deadlines to generate a study plan." action={<button className="button button-soft" onClick={addTask}><Plus size={16} /> Add task</button>} />}
          </div>
          <div className="today-bottom"><span><Target size={16} /> Daily focus goal</span><strong>{durationLabel(todayMinutes)} <span>/ {durationLabel(data.dailyGoalMinutes)}</span></strong><div className="progress-track"><div style={{ width: `${Math.min(100, todayMinutes / data.dailyGoalMinutes * 100)}%` }} /></div></div>
        </section>
        <section className="panel deadline-panel"><SectionHead title="Upcoming deadlines" detail="Keep these on your radar." action={<button className="icon-button" onClick={() => navigate("tasks")} aria-label="Go to tasks"><ArrowUpRight size={19} /></button>} />
          <div className="deadline-list">{pending.slice(0, 4).map((task) => { const subject = subjectFor(data.subjects, task.subjectId); return <div className="deadline-item" key={task.id}>{subject && <span className="deadline-color" style={{ background: subject.color }} />}<div className="deadline-info"><strong>{task.title}</strong><p>{subject?.name}</p></div><span className={`deadline-pill ${daysFromToday(task.dueDate) <= 1 ? "deadline-urgent" : ""}`}>{deadlineLabel(task.dueDate)}</span></div>; })}{!pending.length && <EmptyState icon={CheckCircle2} title="All caught up!" description="You have no outstanding deadlines." />}</div>
          <button className="deadline-footer" onClick={() => navigate("tasks")}>See all assignments <ArrowRight size={16} /></button>
        </section>
      </div>
      <div className="dashboard-columns lower-columns">
        <section className="panel activity-panel"><SectionHead title="Weekly study activity" detail="Every minute of learning matters." action={<StatusTag tone="lavender">This week</StatusTag>} />
          <div className="activity-chart"><div className="chart-y-labels"><span>{durationLabel(maxBar)}</span><span>{durationLabel(Math.round(maxBar / 2))}</span><span>0m</span></div><div className="chart-body"><div className="chart-gridline chart-gridline-top" /><div className="chart-gridline chart-gridline-mid" /><div className="chart-gridline chart-gridline-bottom" /><div className="bar-columns">{weeklyValues.map((entry) => <div className="bar-column" key={entry.date}><div className={`bar-shape ${entry.date === todayISO ? "bar-today" : ""}`} style={{ height: `${entry.minutes ? Math.max(8, entry.minutes / maxBar * 100) : 3}%` }} title={`${entry.label}: ${durationLabel(entry.minutes)}`} /><span>{entry.label}</span></div>)}</div></div></div>
        </section>
        <section className="panel coach-teaser"><div className="coach-teaser-top"><span className="coach-teaser-icon"><Sparkles size={23} /></span><StatusTag tone="lavender">SMART TIP</StatusTag></div><h3>A smarter way to study</h3><p>Try 25 minutes of focused learning followed by a 5-minute break. Small, consistent sessions can make a big difference.</p><button onClick={() => navigate("coach")} className="text-link">Talk to your study coach <ArrowRight size={17} /></button><div className="teaser-decor"><span>✳</span><span>✦</span></div></section>
      </div>
    </>
  );
}

function Planner({ data, plan, weekStart, setWeekStart, startFocus, addTask }: { data: StudyData; plan: PlanSession[]; weekStart: Date; setWeekStart: (date: Date) => void; startFocus: (task: StudyTask) => void; addTask: () => void }) {
  const todayISO = localISO(new Date());
  const weekEnd = addDays(weekStart, 6);
  return (
    <><div className="page-intro"><div><p className="eyebrow">PLAN WITH PURPOSE</p><h1>Your weekly study planner</h1><p>Study sessions arranged around your tasks and deadlines.</p></div><button className="button button-primary" onClick={addTask}><Plus size={18} /> Add a task</button></div>
      <div className="planner-summary"><div className="planner-summary-icon"><WandSparkles size={23} /></div><div><strong>Your week, planned for you</strong><p>SmartStudy creates a deadline-aware schedule, balanced around your {durationLabel(data.dailyGoalMinutes)} daily goal. Complete or add tasks and your plan updates automatically.</p></div><span className="planner-summary-pill"><Sparkles size={14} /> Auto-planned</span></div>
      <section className="panel planner-panel"><div className="planner-toolbar"><div><h2>{formatDate(weekStart, { month: "long", day: "numeric" })} – {formatDate(weekEnd, { month: "short", day: "numeric", year: "numeric" })}</h2><p>Click a study block to start a focus session.</p></div><div className="planner-controls"><button className="button button-outline small" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button><button className="icon-button framed" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={19} /></button><button className="icon-button framed" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={19} /></button></div></div>
        <div className="weekly-calendar">{Array.from({ length: 7 }, (_, index) => {
          const date = addDays(weekStart, index);
          const iso = localISO(date);
          const items = plan.filter((item) => item.date === iso);
          const pastSessions = data.sessions.filter((session) => session.date === iso);
          const isPast = iso < todayISO;
          return <div className={`calendar-day ${iso === todayISO ? "calendar-day-today" : ""}`} key={iso}><div className="calendar-day-head"><span>{formatDate(date, { weekday: "short" })}</span><strong>{date.getDate()}</strong></div><div className="calendar-day-content">{isPast ? pastSessions.map((session) => { const subject = subjectFor(data.subjects, session.subjectId); return <div key={session.id} className="calendar-block calendar-past" style={{ borderColor: subject?.color }}><span className="calendar-time">Logged focus</span><strong>{subject?.name ?? "Study session"}</strong><small><Check size={12} /> {durationLabel(session.minutes)}</small></div>; }) : items.map((item) => { const subject = subjectFor(data.subjects, item.subjectId); const task = data.tasks.find((t) => t.id === item.taskId); return <button key={item.id} className="calendar-block" style={{ borderColor: subject?.color, backgroundColor: subject ? `${subject.color}10` : "#f5f4fb" }} onClick={() => task && startFocus(task)} title={`Start focus: ${item.title}`}><span className="calendar-time">{item.startTime}</span><strong>{item.title}</strong><small><Clock3 size={12} /> {durationLabel(item.durationMinutes)}</small></button>; })}{(isPast ? !pastSessions.length : !items.length) && <span className="calendar-empty">{isPast ? "No sessions" : "Free time"}</span>}</div></div>;
        })}</div>
      </section>
      <div className="planner-legend"><span><i style={{ background: "#7065dd" }} /> Personalized study blocks</span><span><i style={{ background: "#b5c1bb" }} /> Logged study sessions</span><span><i style={{ background: "#ece9e4" }} /> Free time</span></div>
    </>
  );
}

function Tasks({ data, addTask, toggleTask, editTask, deleteTask, startFocus, search, setSearch }: { data: StudyData; addTask: () => void; toggleTask: (id: string) => void; editTask: (task: StudyTask) => void; deleteTask: (id: string) => void; startFocus: (task: StudyTask) => void; search: string; setSearch: (v: string) => void }) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "exams">("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const filtered = data.tasks.filter((task) => {
    if (filter === "pending" && task.completed) return false;
    if (filter === "completed" && !task.completed) return false;
    if (filter === "exams" && task.type !== "exam") return false;
    if (subjectFilter !== "all" && task.subjectId !== subjectFilter) return false;
    return `${task.title} ${subjectFor(data.subjects, task.subjectId)?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
  return <><div className="page-intro"><div><p className="eyebrow">STAY ON TOP OF IT</p><h1>Assignments & tasks</h1><p>Everything you need to do, organized in one place.</p></div><button className="button button-primary" onClick={addTask}><Plus size={18} /> New task</button></div>
    <div className="task-overview-strip"><div><span className="overview-icon"><ListTodo size={20} /></span><span><strong>{data.tasks.filter((t) => !t.completed).length}</strong><small>To do</small></span></div><div><span className="overview-icon orange"><CalendarDays size={20} /></span><span><strong>{data.tasks.filter((t) => !t.completed && daysFromToday(t.dueDate) <= 3).length}</strong><small>Due in 3 days</small></span></div><div><span className="overview-icon green"><CheckCircle2 size={20} /></span><span><strong>{data.tasks.filter((t) => t.completed).length}</strong><small>Completed</small></span></div></div>
    <section className="panel tasks-panel"><div className="task-toolbar"><div className="filter-tabs">{([{ key: "all", label: "All tasks" }, { key: "pending", label: "To do" }, { key: "completed", label: "Completed" }, { key: "exams", label: "Exams" }] as const).map((item) => <button key={item.key} className={filter === item.key ? "selected" : ""} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div><div className="task-filters"><div className="search-control"><Search size={17} /><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{data.subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></div></div>
      <div className="task-items">{filtered.map((task) => <TaskListItem key={task.id} task={task} subject={subjectFor(data.subjects, task.subjectId)} onToggle={toggleTask} onEdit={editTask} onDelete={deleteTask} onFocus={startFocus} />)}{!filtered.length && <EmptyState icon={ListTodo} title="No matching tasks" description="Try another filter, or create a new task to get started." action={<button className="button button-soft" onClick={addTask}><Plus size={16} /> Add task</button>} />}</div>
    </section></>;
}

function Subjects({ data, addSubject, removeSubject, navigate }: { data: StudyData; addSubject: () => void; removeSubject: (id: string) => void; navigate: (view: View) => void }) {
  return <><div className="page-intro"><div><p className="eyebrow">YOUR COURSES</p><h1>Subjects you&apos;re learning</h1><p>Set goals and keep all your courses organized.</p></div><button className="button button-primary" onClick={addSubject}><Plus size={18} /> Add subject</button></div>
    <div className="subject-grid">{data.subjects.map((subject) => {
      const tasks = data.tasks.filter((task) => task.subjectId === subject.id);
      const done = tasks.filter((task) => task.completed).length;
      const currentWeek = localISO(startOfWeek(new Date()));
      const minutes = totalMinutes(data.sessions.filter((session) => session.subjectId === subject.id && session.date >= currentWeek));
      return <article className="subject-card" key={subject.id}><div className="subject-card-top"><SubjectMark subject={subject} size="lg" /><button className="icon-button delete-subject" title="Delete subject" aria-label={`Delete ${subject.name}`} onClick={() => removeSubject(subject.id)}><Trash2 size={16} /></button></div><div className="subject-code">{subject.code}</div><h2>{subject.name}</h2><p>{tasks.length} total tasks <span>·</span> {done} completed</p><div className="subject-progress-label"><span>Weekly study goal</span><strong>{durationLabel(minutes)} / {durationLabel(subject.weeklyGoalMinutes)}</strong></div><div className="progress-track"><div style={{ width: `${Math.min(100, minutes / Math.max(subject.weeklyGoalMinutes, 1) * 100)}%`, background: subject.color }} /></div><button className="subject-card-link" onClick={() => navigate("tasks")}>View tasks <ArrowRight size={16} /></button></article>;
    })}<button className="subject-add-card" onClick={addSubject}><span><Plus size={26} /></span><strong>Add another subject</strong><small>Keep your learning organized</small></button></div>
    <div className="soft-info"><ShieldCheck size={20} /><p>Your subjects, tasks, and progress are saved in this browser. No account is needed to get started.</p></div>
  </>;
}

function QuizPage({ data, navigate }: { data: StudyData; navigate: (view: View) => void }) {
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const subject = subjectFor(data.subjects, subjectId);
  const begin = async () => {
    if (!subject) { setError("Add a subject first to create a quiz."); return; }
    setError(""); setLoading(true); setQuiz(null); setQuestionIndex(0); setAnswers({}); setRevealed(false); setFinished(false);
    try {
      const response = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject.name, topic, difficulty }) });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.questions) || !result.questions.length) throw new Error(result.error ?? "Could not generate a quiz.");
      setQuiz(result as QuizPayload);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load questions. Please try again."); }
    finally { setLoading(false); }
  };
  const questions = quiz?.questions ?? [];
  const current = questions[questionIndex];
  const score = questions.reduce((sum, q, index) => sum + (answers[index] === q.answerIndex ? 1 : 0), 0);
  const restart = () => { setQuiz(null); setFinished(false); setAnswers({}); setRevealed(false); setQuestionIndex(0); };
  return <><div className="page-intro"><div><p className="eyebrow">LEARN BY DOING</p><h1>Practice makes progress <span className="wave-emoji">✳</span></h1><p>Test your knowledge with short practice quizzes.</p></div>{quiz && <button className="button button-outline" onClick={restart}><ArrowLeft size={17} /> New quiz</button>}</div>
    {!quiz && <div className="quiz-builder"><div className="quiz-builder-copy"><div className="quiz-builder-icon"><BrainCircuit size={31} /></div><StatusTag tone="lavender"><Sparkles size={13} /> LEARNING LAB</StatusTag><h2>Challenge your brain.<br />Strengthen what you know.</h2><p>Choose your subject and a topic. SmartStudy creates a short quiz to help you identify what to review next.</p><div className="quiz-feature"><CheckCircle2 size={18} /> Five quick multiple-choice questions</div><div className="quiz-feature"><CheckCircle2 size={18} /> Instant answers and explanations</div><div className="quiz-feature"><CheckCircle2 size={18} /> Questions tailored to a topic when AI is connected</div></div><div className="quiz-builder-form panel"><h3>Set up your quiz</h3><p>What would you like to practice today?</p><label className="field"><span>Choose a subject</span><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{data.subjects.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label className="field"><span>Topic <small>(optional)</small></span><input placeholder="e.g. Binary search trees" maxLength={140} value={topic} onChange={(e) => setTopic(e.target.value)} /></label><label className="field"><span>Difficulty</span><div className="choice-buttons">{["Easy", "Medium", "Hard"].map((level) => <button key={level} className={difficulty === level ? "chosen" : ""} onClick={() => setDifficulty(level)}>{level}</button>)}</div></label><button className="button button-primary full-width quiz-generate" disabled={!subject || loading} onClick={begin}>{loading ? <span className="spinner" /> : <Sparkles size={18} />}{loading ? "Preparing questions..." : "Generate practice quiz"}<ArrowRight size={17} /></button>{error && <p className="error-text">{error}</p>}<p className="microcopy"><ShieldCheck size={14} /> Works offline with a sample question bank. Add an API key for AI-generated, topic-specific questions.</p></div></div>}
    {quiz && !finished && current && <div className="quiz-taking panel"><div className="quiz-taking-top"><div><StatusTag tone={quiz.source === "ai" ? "lavender" : "neutral"}>{quiz.source === "ai" ? "AI-generated quiz" : "Sample question bank"}</StatusTag><p>{subject?.name} {topic && quiz.source === "ai" ? `· ${topic}` : ""}</p></div><div className="quiz-count">Question {questionIndex + 1} of {questions.length}</div></div><div className="quiz-progress"><span style={{ width: `${(questionIndex + 1) / questions.length * 100}%` }} /></div><h2>{current.question}</h2><div className="quiz-options">{current.options.map((option, index) => { const selected = answers[questionIndex] === index; const correct = current.answerIndex === index; return <button key={index} className={`quiz-option ${selected ? "is-selected" : ""} ${revealed && correct ? "is-correct" : ""} ${revealed && selected && !correct ? "is-wrong" : ""}`} onClick={() => !revealed && setAnswers((old) => ({ ...old, [questionIndex]: index }))} disabled={revealed}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{revealed && correct && <CheckCircle2 size={21} />}{revealed && selected && !correct && <X size={20} />}</button>; })}</div>{revealed && <div className="quiz-explanation"><strong><Sparkles size={17} /> {answers[questionIndex] === current.answerIndex ? "That's correct!" : "Here's the explanation"}</strong><p>{current.explanation}</p></div>}<div className="quiz-actions"><button className="button button-outline" onClick={restart}>Exit quiz</button>{!revealed ? <button className="button button-primary" disabled={answers[questionIndex] === undefined} onClick={() => setRevealed(true)}>Check answer <ArrowRight size={17} /></button> : <button className="button button-primary" onClick={() => { if (questionIndex + 1 >= questions.length) setFinished(true); else { setQuestionIndex((i) => i + 1); setRevealed(false); } }}>{questionIndex + 1 >= questions.length ? "See my results" : "Next question"} <ArrowRight size={17} /></button>}</div></div>}
    {quiz && finished && <div className="quiz-result panel"><div className="result-trophy"><Trophy size={43} /></div><p className="eyebrow">QUIZ COMPLETE</p><h2>Nicely done!</h2><div className="result-score">{score}<span>/{questions.length}</span></div><p>You got {Math.round((score / questions.length) * 100)}% correct. {score === questions.length ? "Outstanding work—keep challenging yourself!" : "Every question is a chance to learn. Review the explanations and try again."}</p><div className="result-actions"><button className="button button-outline" onClick={restart}><RotateCcw size={17} /> Try a new quiz</button><button className="button button-primary" onClick={() => navigate("planner")}>Back to study plan <ArrowRight size={17} /></button></div></div>}
  </>;
}

type ChatMessage = { id: string; role: "assistant" | "user"; content: string; source?: "ai" | "offline" };
function FormattedChat({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}</>;
}
function CoachPage({ data }: { data: StudyData }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: "Hey there! ✨ I’m your SmartStudy coach. I can help you prioritize tasks, plan exam revision, and build better study habits. What would you like help with today?" }]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, sending]);
  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    const history = messages.slice(-8).filter((m) => m.id !== "welcome").map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { id: makeId(), role: "user", content: question }]);
    setMessage(""); setSending(true);
    try {
      const response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question, history, context: { subjects: data.subjects.map((s) => s.name), tasks: data.tasks.filter((t) => !t.completed).map((t) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority, subject: subjectFor(data.subjects, t.subjectId)?.name ?? "Other" })), goalMinutes: data.dailyGoalMinutes, todayMinutes: minutesOnDate(data.sessions, localISO(new Date())) } }) });
      const result = await response.json();
      if (!response.ok || !result.reply) throw new Error("Unable to get a response.");
      setMessages((current) => [...current, { id: makeId(), role: "assistant", content: String(result.reply), source: result.source === "ai" ? "ai" : "offline" }]);
    } catch { setMessages((current) => [...current, { id: makeId(), role: "assistant", content: "I couldn't connect just now. Try asking again, or check your study planner for upcoming priorities.", source: "offline" }]); }
    finally { setSending(false); }
  };
  return <><div className="page-intro"><div><p className="eyebrow">YOUR STUDY SIDEKICK</p><h1>Ask your study coach <span className="wave-emoji">✳</span></h1><p>Personalized guidance based on your subjects and deadlines.</p></div><StatusTag tone="lavender"><Sparkles size={13} /> Here to help</StatusTag></div>
    <div className="coach-layout"><aside className="coach-sidebar panel"><div className="coach-profile-icon"><BrainCircuit size={29} /></div><h2>SmartStudy Coach</h2><p>Your friendly study companion, here to help you make a plan and keep moving forward.</p><div className="coach-divider" /><strong>TRY ASKING</strong><div className="suggestions">{["What should I focus on today?", "Help me prepare for my exams", "I'm feeling overwhelmed", "How can I remember more?"].map((item) => <button key={item} onClick={() => send(item)} disabled={sending}><Sparkles size={14} /> {item}</button>)}</div><div className="coach-privacy"><ShieldCheck size={16} /><span>Advice uses the study details you&apos;ve saved in this browser.</span></div></aside>
      <section className="chat-panel panel"><div className="chat-header"><span className="chat-avatar"><BrainCircuit size={21} /></span><div><strong>SmartStudy AI Coach</strong><small><span className="online-dot" /> Study support, anytime</small></div></div><div className="chat-messages">{messages.map((item) => <div key={item.id} className={`chat-row ${item.role === "user" ? "chat-user" : "chat-assistant"}`}>{item.role === "assistant" && <span className="chat-avatar small"><BrainCircuit size={17} /></span>}<div><div className="chat-bubble"><FormattedChat text={item.content} /></div>{item.source === "offline" && <span className="chat-source">Offline study guidance</span>}{item.source === "ai" && <span className="chat-source">AI-generated response</span>}</div></div>)}{sending && <div className="chat-row chat-assistant"><span className="chat-avatar small"><BrainCircuit size={17} /></span><div className="chat-bubble chat-typing"><i /><i /><i /></div></div>}<div ref={chatEnd} /></div><form className="chat-input-row" onSubmit={(event) => { event.preventDefault(); send(message); }}><input placeholder="Ask about your studies..." maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} aria-label="Message to study coach" /><button className="send-button" disabled={!message.trim() || sending} aria-label="Send message" type="submit"><Send size={19} /></button></form></section></div>
    <p className="coach-disclaimer">SmartStudy gives study guidance, not guaranteed academic advice. With no API key, the coach uses an offline planning assistant.</p>
  </>;
}

function Analytics({ data }: { data: StudyData }) {
  const today = new Date();
  const todayISO = localISO(today);
  const weekStart = startOfWeek(today);
  const last7 = Array.from({ length: 7 }, (_, index) => { const date = addDays(today, index - 6); const iso = localISO(date); return { date: iso, label: formatDate(date, { weekday: "short" }), minutes: minutesOnDate(data.sessions, iso) }; });
  const weekMinutes = totalMinutes(data.sessions.filter((s) => s.date >= localISO(weekStart) && s.date <= todayISO));
  const completed = data.tasks.filter((task) => task.completed).length;
  const completionPercent = data.tasks.length ? Math.round(completed / data.tasks.length * 100) : 0;
  const max = Math.max(data.dailyGoalMinutes, ...last7.map((s) => s.minutes), 1);
  return <><div className="page-intro"><div><p className="eyebrow">CELEBRATE YOUR PROGRESS</p><h1>Your learning insights</h1><p>Make your progress visible, one study session at a time.</p></div><StatusTag tone="green"><TrendingUp size={14} /> Keep it going</StatusTag></div>
    <div className="analytics-metrics"><div className="panel insight-metric"><span className="stat-icon stat-purple"><Clock3 size={20} /></span><strong>{durationLabel(weekMinutes)}</strong><p>Focused this week</p></div><div className="panel insight-metric"><span className="stat-icon stat-orange"><Flame size={20} /></span><strong>{studyStreak(data.sessions)} days</strong><p>Current study streak</p></div><div className="panel insight-metric"><span className="stat-icon stat-green"><CheckCircle2 size={20} /></span><strong>{completionPercent}%</strong><p>Task completion rate</p></div></div>
    <div className="dashboard-columns analytics-columns"><section className="panel activity-panel"><SectionHead title="Focus time · last 7 days" detail="Your daily study minutes at a glance." /><div className="activity-chart tall-chart"><div className="chart-y-labels"><span>{durationLabel(max)}</span><span>{durationLabel(Math.round(max / 2))}</span><span>0m</span></div><div className="chart-body"><div className="chart-gridline chart-gridline-top" /><div className="chart-gridline chart-gridline-mid" /><div className="chart-gridline chart-gridline-bottom" /><div className="bar-columns">{last7.map((entry) => <div className="bar-column" key={entry.date}><div className={`bar-shape ${entry.date === todayISO ? "bar-today" : ""}`} style={{ height: `${entry.minutes ? Math.max(8, entry.minutes / max * 100) : 3}%` }} title={`${entry.label}: ${durationLabel(entry.minutes)}`} /><span>{entry.label}</span></div>)}</div></div></div></section>
      <section className="panel goal-panel"><SectionHead title="Today’s goal" detail="Keep building the habit." /><div className="goal-ring" style={{ background: `conic-gradient(#7065dd ${Math.min(100, minutesOnDate(data.sessions, todayISO) / data.dailyGoalMinutes * 100)}%, #f0eff8 0)` }}><div><strong>{Math.round(minutesOnDate(data.sessions, todayISO) / data.dailyGoalMinutes * 100)}%</strong><span>complete</span></div></div><p><strong>{durationLabel(minutesOnDate(data.sessions, todayISO))}</strong> of {durationLabel(data.dailyGoalMinutes)} studied today</p></section></div>
    <section className="panel subject-insights"><SectionHead title="Study time by subject" detail="Focus minutes from all your logged sessions." /><div className="subject-insight-list">{data.subjects.map((subject) => { const minutes = totalMinutes(data.sessions.filter((s) => s.subjectId === subject.id)); const allMinutes = totalMinutes(data.sessions); return <div className="subject-insight" key={subject.id}><SubjectMark subject={subject} size="sm" /><div className="subject-insight-info"><div><strong>{subject.name}</strong><span>{durationLabel(minutes)}</span></div><div className="progress-track"><div style={{ width: `${allMinutes ? minutes / allMinutes * 100 : 0}%`, background: subject.color }} /></div></div></div>; })}{!data.subjects.length && <EmptyState title="No subjects yet" description="Add a subject to track your learning time." />}</div></section>
  </>;
}

function Settings({ data, onChange, onReset, onExport, enableNotifications }: { data: StudyData; onChange: (change: Partial<StudyData>) => void; onReset: () => void; onExport: () => void; enableNotifications: () => void }) {
  return <><div className="page-intro"><div><p className="eyebrow">MAKE IT YOURS</p><h1>Your preferences</h1><p>Customize SmartStudy around your study habits.</p></div></div><div className="settings-layout"><section className="panel settings-panel"><SectionHead title="Your profile" detail="A few details to personalize the app." /><label className="field"><span>What should we call you?</span><input value={data.studentName} maxLength={30} onChange={(e) => onChange({ studentName: e.target.value })} placeholder="Your name" /></label><div className="settings-divider" /><SectionHead title="Study preferences" detail="Your weekly planner updates when you change these." /><label className="field"><span>Daily focus goal</span><select value={data.dailyGoalMinutes} onChange={(e) => onChange({ dailyGoalMinutes: Number(e.target.value) })}>{[30, 60, 90, 120, 150, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)} per day</option>)}</select></label><label className="field"><span>Planning style</span><select value={data.planStrategy} onChange={(e) => onChange({ planStrategy: e.target.value as StudyData["planStrategy"] })}><option value="balanced">Balanced across subjects</option><option value="deadlines">Prioritize approaching deadlines</option></select></label><div className="settings-divider" /><SectionHead title="Reminders" detail="Stay aware of assignments and exams." /><div className="setting-toggle-row"><span className="setting-toggle-icon"><Bell size={20} /></span><span><strong>Browser reminders</strong><small>Notify me of approaching deadlines while SmartStudy is open.</small></span><button type="button" role="switch" aria-checked={data.notificationsEnabled} className={`toggle-switch ${data.notificationsEnabled ? "enabled" : ""}`} onClick={() => data.notificationsEnabled ? onChange({ notificationsEnabled: false }) : enableNotifications()}><span /></button></div><p className="settings-note">Browser permission is required. This app does not send background or email reminders.</p></section><aside className="settings-aside"><div className="panel data-card"><span className="stat-icon stat-green"><ShieldCheck size={22} /></span><h3>Your data, your browser</h3><p>Tasks, subjects, focus logs, and preferences are stored locally. They stay on this device and browser unless you clear them.</p><button className="button button-soft full-width" onClick={onExport} style={{ marginBottom: 10 }}><ArrowDownRight size={17} /> Export my data</button><button className="button button-outline full-width" onClick={onReset}><RotateCcw size={17} /> Restore demo data</button></div><div className="settings-credit"><Sparkles size={19} /><p>SmartStudy<br /><span>Built to make university life a little easier.</span></p></div></aside></div></>;
}

export default function SmartStudyApp() {
  const [data, setData] = useState<StudyData | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | undefined>(undefined);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [focus, setFocus] = useState<FocusTimer | null>(null);
  const [toast, setToast] = useState("");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  useEffect(() => {
    let loaded: StudyData | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed.subjects) && Array.isArray(parsed.tasks) && Array.isArray(parsed.sessions)) loaded = parsed as StudyData; }
    } catch { /* Corrupt local data falls back to the sample. */ }
    setData(loaded ?? createDemoData());
  }, []);
  useEffect(() => { if (!data) return; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Storage blocked; app remains usable this session. */ } }, [data]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 3500); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => {
    if (!data?.notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const check = () => {
      const due = data.tasks.filter((task) => !task.completed && daysFromToday(task.dueDate) >= 0 && daysFromToday(task.dueDate) <= 1);
      for (const task of due) {
        const mark = `smartstudy-notified-${localISO(new Date())}-${task.id}`;
        if (!window.sessionStorage.getItem(mark)) {
          try { new Notification("SmartStudy deadline reminder", { body: `${task.title} · ${deadlineLabel(task.dueDate)}` }); window.sessionStorage.setItem(mark, "1"); } catch { /* Ignore system notification restrictions. */ }
        }
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [data]);
  const plan = useMemo(() => data ? generateWeeklyPlan(data.tasks, weekStart, data.dailyGoalMinutes, data.planStrategy) : [], [data, weekStart]);
  const navigate = (next: View) => { setView(next); setMobileOpen(false); setNotificationsOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const update = (change: Partial<StudyData>) => setData((old) => old ? { ...old, ...change } : old);
  const toggleTask = (id: string) => { setData((old) => old ? { ...old, tasks: old.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task) } : old); setToast("Task updated — your planner is refreshed."); };
  const saveTask = (task: StudyTask) => { setData((old) => old ? { ...old, tasks: old.tasks.some((t) => t.id === task.id) ? old.tasks.map((t) => t.id === task.id ? task : t) : [...old.tasks, task] } : old); setShowTaskForm(false); setEditingTask(undefined); setToast("Task saved. Your study plan has been updated."); };
  const addTask = () => { if (!data?.subjects.length) { setToast("Add a subject before creating a task."); setShowSubjectForm(true); return; } setEditingTask(undefined); setShowTaskForm(true); };
  const editTask = (task: StudyTask) => { setEditingTask(task); setShowTaskForm(true); };
  const deleteTask = (id: string) => { if (!window.confirm("Delete this task? This cannot be undone.")) return; setData((old) => old ? { ...old, tasks: old.tasks.filter((t) => t.id !== id) } : old); setToast("Task deleted."); };
  const saveSubject = (subject: Subject) => { setData((old) => old ? { ...old, subjects: [...old.subjects, subject] } : old); setShowSubjectForm(false); setToast("Subject added. You can now create tasks for it."); };
  const removeSubject = (id: string) => { const subject = data?.subjects.find((s) => s.id === id); if (!subject || !window.confirm(`Delete ${subject.name} and all of its tasks and focus logs? This cannot be undone.`)) return; setData((old) => old ? { ...old, subjects: old.subjects.filter((s) => s.id !== id), tasks: old.tasks.filter((t) => t.subjectId !== id), sessions: old.sessions.filter((s) => s.subjectId !== id) } : old); setToast("Subject and associated data deleted."); };
  const startFocus = (task: StudyTask) => { setFocus({ taskId: task.id, subjectId: task.subjectId, title: task.title, initialSeconds: 25 * 60, secondsLeft: 25 * 60, running: true }); };
  const saveFocus = (minutes: number, subjectId: string, taskId?: string) => { const session: FocusSession = { id: makeId(), subjectId, taskId, date: localISO(new Date()), minutes }; setData((old) => old ? { ...old, sessions: [...old.sessions, session] } : old); setFocus(null); setToast(`${durationLabel(minutes)} of focus time added. Great job!`); };
  const enableNotifications = async () => { if (typeof Notification === "undefined") { setToast("This browser does not support notifications."); return; } try { const permission = await Notification.requestPermission(); update({ notificationsEnabled: permission === "granted" }); setToast(permission === "granted" ? "Deadline notifications enabled for this browser." : "Notifications were not enabled. Check your browser permissions."); } catch { setToast("Unable to enable notifications in this browser."); } };
  const exportData = () => {
    if (!data) return;
    const file = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), smartstudy: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartstudy-backup-${localISO(new Date())}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast("Your SmartStudy data was exported.");
  };
  const resetData = () => { if (!window.confirm("Restore sample tasks, subjects, and study sessions? Your current local data will be replaced.")) return; setData(createDemoData()); setToast("Demo data restored."); navigate("dashboard"); };

  if (!data) return <div className="app-loading"><span className="brand-symbol"><BrainCircuit size={27} /></span><strong>SmartStudy</strong><span className="spinner" /></div>;
  const pendingSoon = data.tasks.filter((t) => !t.completed && daysFromToday(t.dueDate) <= 3).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const firstName = (data.studentName || "Student").trim().split(/\s+/)[0] || "Student";
  const navButton = ({ view: navView, label, icon: Icon }: NavItem) => <button key={navView} className={`sidebar-item ${view === navView ? "active" : ""}`} onClick={() => navigate(navView)}><Icon size={19} strokeWidth={1.9} /><span>{label}</span>{navView === "coach" && <span className="nav-spark">✦</span>}</button>;
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="sidebar-brand"><span className="brand-symbol"><BrainCircuit size={25} strokeWidth={2.2} /></span><span><strong>SmartStudy</strong><small>your study companion</small></span><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button></div><div className="sidebar-navigation"><div className="sidebar-group-label">WORKSPACE</div>{menuPrimary.map(navButton)}<div className="sidebar-group-label group-gap">STUDY TOOLS</div>{menuTools.map(navButton)}<div className="sidebar-group-label group-gap">PREFERENCES</div>{navButton({ view: "settings", label: "Settings", icon: Settings2 })}</div><div className="sidebar-bottom"><div className="sidebar-mini-card"><div className="mini-spark"><Sparkles size={18} /></div><h3>Keep your streak alive!</h3><p>A little learning every day goes a long way.</p><button onClick={() => navigate("planner")}>View your plan <ArrowRight size={14} /></button></div><button className="sidebar-profile" onClick={() => navigate("settings")}><span className="profile-avatar">{firstName[0]?.toUpperCase()}</span><span><strong>{data.studentName || "Student"}</strong><small>University student</small></span><ChevronRight size={17} /></button></div></aside>
    <div className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={23} /></button><span className="topbar-breadcrumb">Workspace</span><ChevronRight size={16} className="breadcrumb-chevron" /><strong>{sectionNames[view]}</strong></div><div className="topbar-right"><div className="topbar-date"><CalendarDays size={17} /> {formatDate(new Date(), { weekday: "short", month: "short", day: "numeric" })}</div><div className="topbar-notification-wrap"><button className={`icon-button topbar-bell ${notificationsOpen ? "is-open" : ""}`} aria-label="Show deadline reminders" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((o) => !o)}><Bell size={20} />{pendingSoon.length > 0 && <span className="bell-dot" />}</button>{notificationsOpen && <div className="notification-popover"><div className="notification-header"><strong>Reminders</strong><span>{pendingSoon.length} upcoming</span></div>{pendingSoon.length ? pendingSoon.slice(0, 5).map((task) => <button className="notification-entry" onClick={() => navigate("tasks")} key={task.id}><span className="notification-entry-icon"><Calendar size={17} /></span><span><strong>{task.title}</strong><small>{deadlineLabel(task.dueDate)}</small></span></button>) : <p className="notification-empty">No urgent deadlines. You&apos;re all caught up!</p>}<button className="notification-all" onClick={() => navigate("tasks")}>View all tasks <ArrowRight size={15} /></button></div>}</div><button className="topbar-avatar" aria-label="Open settings" onClick={() => navigate("settings")}>{firstName[0]?.toUpperCase()}</button></div></header>
      <main className="main-content">
        {view === "dashboard" && <Dashboard data={data} plan={plan} navigate={navigate} addTask={addTask} toggleTask={toggleTask} startFocus={startFocus} />}
        {view === "planner" && <Planner data={data} plan={plan} weekStart={weekStart} setWeekStart={setWeekStart} startFocus={startFocus} addTask={addTask} />}
        {view === "tasks" && <Tasks data={data} addTask={addTask} toggleTask={toggleTask} editTask={editTask} deleteTask={deleteTask} startFocus={startFocus} search={taskSearch} setSearch={setTaskSearch} />}
        {view === "subjects" && <Subjects data={data} addSubject={() => setShowSubjectForm(true)} removeSubject={removeSubject} navigate={navigate} />}
        {view === "practice" && <QuizPage data={data} navigate={navigate} />}
        {view === "coach" && <CoachPage data={data} />}
        {view === "analytics" && <Analytics data={data} />}
        {view === "settings" && <Settings data={data} onChange={update} onReset={resetData} onExport={exportData} enableNotifications={enableNotifications} />}
      </main><footer className="main-footer"><span>© {new Date().getFullYear()} SmartStudy. Make room to grow.</span><span>Built for curious minds <Sparkles size={14} /></span></footer></div>
    {showTaskForm && <TaskForm key={editingTask?.id ?? "new"} subjects={data.subjects} task={editingTask} onSave={saveTask} onClose={() => { setShowTaskForm(false); setEditingTask(undefined); }} />}
    {showSubjectForm && <SubjectForm onSave={saveSubject} onClose={() => setShowSubjectForm(false)} />}
    {focus && <FocusDialog focus={focus} setFocus={setFocus} onSave={saveFocus} onClose={() => setFocus(null)} />}
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} /> {toast}<button onClick={() => setToast("")} aria-label="Dismiss message"><X size={16} /></button></div>}
  </div>;
}
