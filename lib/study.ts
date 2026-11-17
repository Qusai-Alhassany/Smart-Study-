import type { FocusSession, PlanSession, PlanStrategy, StudyData, StudyTask, Subject } from "./types";

export const STORAGE_KEY = "smartstudy-data-v1";
export const SUBJECT_COLORS = ["#7065dd", "#f4a75b", "#54b6a6", "#e87d9e", "#5b99e8", "#b186d8"];

export function localISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysFromToday(iso: string): number {
  const today = fromISO(localISO(new Date())).getTime();
  return Math.round((fromISO(iso).getTime() - today) / 86_400_000);
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  return addDays(date, -((day + 6) % 7));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const value = typeof date === "string" ? fromISO(date) : date;
  return value.toLocaleDateString("en-US", options ?? { month: "short", day: "numeric" });
}

export function deadlineLabel(date: string): string {
  const days = daysFromToday(date);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e7)}`;
}

export function createDemoData(): StudyData {
  const today = new Date();
  const day = (offset: number) => localISO(addDays(today, offset));
  const subjects: Subject[] = [
    { id: "cs", name: "Data Structures", code: "CS 201", color: "#7065dd", icon: "code", weeklyGoalMinutes: 240 },
    { id: "math", name: "Calculus II", code: "MATH 202", color: "#f4a75b", icon: "sigma", weeklyGoalMinutes: 210 },
    { id: "psych", name: "Cognitive Psychology", code: "PSY 204", color: "#54b6a6", icon: "brain", weeklyGoalMinutes: 180 },
    { id: "writing", name: "Academic Writing", code: "ENG 105", color: "#e87d9e", icon: "book", weeklyGoalMinutes: 120 },
  ];
  const base: Omit<StudyTask, "id" | "createdAt">[] = [
    { title: "Review integration techniques", subjectId: "math", type: "revision", dueDate: day(1), estimateMinutes: 75, priority: "high", completed: false, notes: "Practice substitution and integration by parts." },
    { title: "Linked list assignment", subjectId: "cs", type: "assignment", dueDate: day(2), estimateMinutes: 110, priority: "high", completed: false, notes: "Implement a doubly linked list and test edge cases." },
    { title: "Memory & attention chapter", subjectId: "psych", type: "revision", dueDate: day(3), estimateMinutes: 70, priority: "medium", completed: false, notes: "Review lecture slides and create flashcards." },
    { title: "Research essay outline", subjectId: "writing", type: "assignment", dueDate: day(4), estimateMinutes: 85, priority: "medium", completed: false, notes: "Draft thesis and supporting arguments." },
    { title: "Calculus quiz", subjectId: "math", type: "exam", dueDate: day(5), estimateMinutes: 110, priority: "high", completed: false, notes: "Focus on integration applications." },
    { title: "Data structures midterm", subjectId: "cs", type: "exam", dueDate: day(7), estimateMinutes: 150, priority: "high", completed: false, notes: "Trees, graphs, linked lists, and complexity." },
    { title: "Submit research proposal", subjectId: "writing", type: "assignment", dueDate: day(-2), estimateMinutes: 60, priority: "medium", completed: true, notes: "" },
    { title: "Recursion flashcards", subjectId: "cs", type: "revision", dueDate: day(-1), estimateMinutes: 35, priority: "low", completed: true, notes: "" },
    { title: "Read chapter 4", subjectId: "psych", type: "revision", dueDate: day(-1), estimateMinutes: 45, priority: "medium", completed: true, notes: "" },
  ];
  const tasks: StudyTask[] = base.map((task, i) => ({ ...task, id: `demo-task-${i + 1}`, createdAt: day(-5) }));
  const sessions: FocusSession[] = [
    { id: "demo-s1", subjectId: "writing", date: day(-6), minutes: 35 },
    { id: "demo-s2", subjectId: "math", date: day(-5), minutes: 55 },
    { id: "demo-s3", subjectId: "cs", date: day(-4), minutes: 45 },
    { id: "demo-s4", subjectId: "psych", date: day(-4), minutes: 30 },
    { id: "demo-s5", subjectId: "math", date: day(-3), minutes: 60 },
    { id: "demo-s6", subjectId: "cs", date: day(-2), minutes: 45 },
    { id: "demo-s7", subjectId: "writing", date: day(-2), minutes: 30 },
    { id: "demo-s8", subjectId: "psych", date: day(-1), minutes: 50 },
    { id: "demo-s9", subjectId: "math", date: day(-1), minutes: 25 },
    { id: "demo-s10", subjectId: "cs", date: day(0), minutes: 40 },
  ];
  return {
    studentName: "Student",
    dailyGoalMinutes: 120,
    planStrategy: "balanced",
    notificationsEnabled: false,
    subjects,
    tasks,
    sessions,
  };
}

export function subjectFor(subjects: Subject[], id: string): Subject | undefined {
  return subjects.find((subject) => subject.id === id);
}

export function minutesOnDate(sessions: FocusSession[], iso: string): number {
  return sessions.filter((session) => session.date === iso).reduce((total, session) => total + session.minutes, 0);
}

export function totalMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((total, session) => total + session.minutes, 0);
}

export function studyStreak(sessions: FocusSession[]): number {
  const dates = new Set(sessions.filter((session) => session.minutes > 0).map((session) => session.date));
  const today = new Date();
  let cursor = dates.has(localISO(today)) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(localISO(cursor))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Deterministic, deadline-aware scheduling. Works entirely offline. */
export function generateWeeklyPlan(
  tasks: StudyTask[],
  weekStart: Date,
  dailyGoalMinutes: number,
  strategy: PlanStrategy,
): PlanSession[] {
  const active = tasks.filter((task) => !task.completed);
  const remaining = new Map(active.map((task) => [task.id, task.estimateMinutes]));
  const plan: PlanSession[] = [];
  const todayISO = localISO(new Date());
  const defaultTimeSlots = ["09:00", "11:00", "15:30"];
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayISO = localISO(addDays(weekStart, dayIndex));
    if (dayISO < todayISO) continue;
    // Today's schedule starts in the future rather than recommending morning slots after they pass.
    let timeSlots = defaultTimeSlots;
    if (dayISO === todayISO) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (currentMinutes >= 8 * 60 + 30) {
        const first = Math.ceil((currentMinutes + 15) / 30) * 30;
        timeSlots = [first, first + 60, first + 120]
          .filter((minutes) => minutes + 25 <= 24 * 60)
          .map((minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
      }
    }
    let available = Math.max(30, Math.min(dailyGoalMinutes, 240));
    const scheduledToday = new Set<string>();
    const daySubjectCounts = new Map<string, number>();
    for (let slot = 0; slot < timeSlots.length && available >= 25; slot++) {
      const eligible = active.filter((task) => {
        const left = remaining.get(task.id) ?? 0;
        return left >= 20 && !scheduledToday.has(task.id) && (task.dueDate >= dayISO || (dayISO === todayISO && task.dueDate < todayISO));
      });
      if (!eligible.length) break;
      const sorted = eligible.sort((a, b) => {
        const score = (task: StudyTask) => {
          const dueDays = Math.max(0, Math.round((fromISO(task.dueDate).getTime() - fromISO(dayISO).getTime()) / 86_400_000));
          const urgency = 130 / (dueDays + 2);
          const priority = task.priority === "high" ? 35 : task.priority === "medium" ? 15 : 0;
          const exam = task.type === "exam" ? 9 : 0;
          const balance = strategy === "balanced" ? (daySubjectCounts.get(task.subjectId) ?? 0) * 55 : 0;
          return urgency * (strategy === "deadlines" ? 1.8 : 1) + priority + exam - balance;
        };
        return score(b) - score(a) || a.dueDate.localeCompare(b.dueDate);
      });
      const choice = sorted[0];
      const duration = Math.min(50, available, remaining.get(choice.id) ?? 0);
      if (duration < 20) break;
      plan.push({
        id: `${dayISO}-${choice.id}`,
        date: dayISO,
        startTime: timeSlots[slot],
        durationMinutes: duration,
        subjectId: choice.subjectId,
        taskId: choice.id,
        title: choice.title,
      });
      available -= duration;
      remaining.set(choice.id, (remaining.get(choice.id) ?? 0) - duration);
      scheduledToday.add(choice.id);
      daySubjectCounts.set(choice.subjectId, (daySubjectCounts.get(choice.subjectId) ?? 0) + 1);
    }
  }
  return plan;
}
