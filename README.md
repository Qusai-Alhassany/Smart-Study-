# SmartStudy — AI Study Assistant for University Students

A polished, responsive **Next.js (App Router + TypeScript)** study dashboard inspired by the attached university project abstract. SmartStudy helps students organize coursework, manage deadlines, follow an automatically generated study schedule, track focus time, and practice with short review quizzes.

## Features

- **Dashboard:** current tasks, approaching deadlines, upcoming exams, study streak, weekly activity, and today's focus goal.
- **Study Planner:** builds a 7-day study timetable from task deadlines, estimated times, priorities, and a daily time goal. Choose balanced subject distribution or deadline-first planning. Updates automatically when tasks or settings change.
- **My Tasks:** add, edit, complete, search, filter, and delete assignments, exams, and revision tasks.
- **Subjects:** organize courses with course codes, colors, weekly goals, and tracked progress.
- **Focus Timer:** start a 25-minute focus session from any task, pause/reset it, and save logged study time.
- **Practice Quiz:** five multiple-choice questions with immediate feedback, explanations, scores, and retry flow.
- **AI Study Coach:** chat interface for personalized prioritization, exam revision, and study-habit guidance.
- **Analytics:** past-week study chart, daily goal, streak, completion rate, and subject breakdown.
- **Reminders:** in-app upcoming-deadline alerts and *optional* browser notifications while the app is open.
- **Local data:** works with demo data immediately, stores edits in browser `localStorage`, and supports JSON backup export.

## Requirements

- Node.js **20.9 or newer** (Node.js 22 LTS recommended)
- npm
- Optional: an OpenAI API key to enable real, topic-specific AI quiz generation and AI coach responses

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000** in your browser.

The app does **not** require a key to launch. It will automatically load realistic demo subjects, tasks, and focus history. You can customize or remove everything.

### Turn on AI generation (optional)

Add this to `.env.local`:

```env
OPENAI_API_KEY=your_secret_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Restart the development server after updating `.env.local`. The server-side API routes use the key; it is **never exposed to the browser**. When the API key is missing, unavailable, or fails, practice quizzes use a built-in example question bank and study coach messages use offline rule-based guidance. In that case, topic-specific AI generation is **not** active, and the UI labels the responses accordingly.

## Commands

```bash
npm run dev        # Start local development server
npm run build      # Build for production
npm run start      # Start built app
npm run typecheck  # TypeScript check
```

## Architecture

```text
app/
  api/quiz/route.ts      # AI or sample review questions
  api/coach/route.ts     # AI or offline study coach
  globals.css            # Complete responsive design system
  layout.tsx             # App metadata and layout
  page.tsx               # SmartStudy entry screen
components/
  SmartStudyApp.tsx       # Interactive interface and client state
lib/
  study.ts               # Demo data, dates, progress, scheduling
  quiz.ts                # Built-in review questions and validation
  types.ts               # TypeScript models
```

The app uses **Next.js + React + TypeScript + plain CSS + Lucide icons**. There is no database, authentication requirement, or Tailwind dependency. Study data is persisted in browser local storage under `smartstudy-data-v1`. Deleting a subject also removes its tasks and focus logs after confirmation.

## Privacy and limitations

- Your tasks, subjects, settings, and focus sessions are saved **only in the browser** by default. Clearing browser storage removes them. Use the **Export my data** button in Settings for a backup.
- When an OpenAI key is configured, the browser sends the selected quiz subject/topic and coach chat messages plus a summary of task/deadline context to this app's server-side routes, which forward the relevant information to OpenAI. Avoid storing sensitive information in task descriptions or chats if that is a concern.
- Notifications only fire while the web app is **open** and your browser grants notification permission. The prototype does **not** support push notifications, background jobs, email or SMS.
- The automatically generated planner uses deterministic deadline-aware scheduling rules, **not** an AI model. AI is used for quiz generation and coach responses only when configured.
- The focus timer operates while the page is open; some browsers may throttle background tabs. Keep the tab visible for accurate timing.
- Example task lists and quiz questions are **sample content**, not real university courses.

## Next steps for a university deployment

Add authentication, a database (e.g., PostgreSQL), cross-device sync, school calendar integrations, server-scheduled notifications, and robust privacy controls. A production application should also implement rate limits, request quotas, authentication, monitoring, and stronger server-side validation around the AI API routes.

---

Built for the project: **“An AI Study Assistant Agent for University Students”** / **SmartStudy**.
# Smart-Study-
