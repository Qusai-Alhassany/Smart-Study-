export type Subject = {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  weeklyGoalMinutes: number;
};

export type Priority = "high" | "medium" | "low";
export type TaskType = "assignment" | "exam" | "revision";

export type StudyTask = {
  id: string;
  title: string;
  subjectId: string;
  type: TaskType;
  dueDate: string;
  estimateMinutes: number;
  priority: Priority;
  completed: boolean;
  notes: string;
  createdAt: string;
};

export type FocusSession = {
  id: string;
  subjectId: string;
  taskId?: string;
  date: string;
  minutes: number;
};

export type PlanStrategy = "balanced" | "deadlines";

export type StudyData = {
  studentName: string;
  dailyGoalMinutes: number;
  planStrategy: PlanStrategy;
  notificationsEnabled: boolean;
  subjects: Subject[];
  tasks: StudyTask[];
  sessions: FocusSession[];
};

export type PlanSession = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  subjectId: string;
  taskId: string;
  title: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type QuizPayload = {
  questions: QuizQuestion[];
  source: "ai" | "sample";
};
