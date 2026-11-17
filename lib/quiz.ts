import type { QuizQuestion } from "./types";

const dataStructures: QuizQuestion[] = [
  { question: "Which data structure follows the Last In, First Out principle?", options: ["Queue", "Stack", "Binary tree", "Hash table"], answerIndex: 1, explanation: "A stack processes the most recently added element first (LIFO)." },
  { question: "What is the average time complexity of accessing an array element by index?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answerIndex: 2, explanation: "Arrays support constant-time indexed access because elements occupy consecutive memory positions." },
  { question: "Which operation on a singly linked list requires O(n) time without a tail pointer?", options: ["Insert at head", "Read the head", "Append at end", "Check if empty"], answerIndex: 2, explanation: "Without a tail pointer, appending requires traversing the list to find its final node." },
  { question: "What is the time complexity of binary search on a sorted array?", options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], answerIndex: 1, explanation: "Binary search halves the remaining search space on each step." },
  { question: "Which traversal visits the root before its left and right subtrees?", options: ["Inorder", "Postorder", "Preorder", "Level-order only"], answerIndex: 2, explanation: "Preorder traversal visits root, then left subtree, then right subtree." },
];

const calculus: QuizQuestion[] = [
  { question: "What is the indefinite integral of 2x with respect to x?", options: ["2 + C", "x² + C", "2x² + C", "x + C"], answerIndex: 1, explanation: "The power rule gives ∫2x dx = x² + C." },
  { question: "Which rule is particularly useful for integrating x·eˣ?", options: ["L'Hôpital's rule", "Integration by parts", "Chain rule alone", "Partial fractions"], answerIndex: 1, explanation: "Integration by parts applies when an integrand is a product of functions." },
  { question: "What is the derivative of ln(x), for x > 0?", options: ["ln(x)", "x", "1/x", "eˣ"], answerIndex: 2, explanation: "The natural logarithm has derivative 1/x for positive x." },
  { question: "What is ∫ cos(x) dx?", options: ["−sin(x) + C", "sin(x) + C", "tan(x) + C", "−cos(x) + C"], answerIndex: 1, explanation: "The derivative of sin(x) is cos(x)." },
  { question: "What does a definite integral of a nonnegative function represent geometrically?", options: ["Slope at a point", "Area under the curve", "Maximum value", "Vertical asymptote"], answerIndex: 1, explanation: "For a nonnegative function, its definite integral gives the area between the graph and the x-axis over the interval." },
];

const psychology: QuizQuestion[] = [
  { question: "Which memory system temporarily holds and manipulates information?", options: ["Procedural memory", "Working memory", "Implicit memory", "Episodic memory"], answerIndex: 1, explanation: "Working memory actively maintains and processes a limited amount of information." },
  { question: "Which technique usually improves long-term retention?", options: ["Cramming once", "Passive rereading", "Spaced retrieval practice", "Copying notes verbatim"], answerIndex: 2, explanation: "Spaced retrieval strengthens recall by revisiting material across multiple sessions." },
  { question: "Selective attention refers to the ability to…", options: ["Remember everything", "Focus on relevant information while filtering distractions", "Learn only during sleep", "Process every stimulus equally"], answerIndex: 1, explanation: "Selective attention allocates limited cognitive resources to a subset of incoming information." },
  { question: "Remembering your last birthday is primarily an example of…", options: ["Episodic memory", "Procedural memory", "Sensory memory", "Priming"], answerIndex: 0, explanation: "Episodic memory stores autobiographical experiences associated with time and place." },
  { question: "What is the spacing effect?", options: ["Learning improves when study is distributed over time", "All study should happen at once", "More highlighting always improves recall", "Longer breaks erase learning"], answerIndex: 0, explanation: "Distributed practice often results in better retention than massed practice." },
];

const writing: QuizQuestion[] = [
  { question: "What is the main purpose of a thesis statement?", options: ["List every source", "Present the central argument", "Replace the conclusion", "Add a quotation"], answerIndex: 1, explanation: "A thesis clearly communicates the claim that the essay will develop and support." },
  { question: "Which choice is the strongest support for an academic claim?", options: ["An unsupported assertion", "A relevant peer-reviewed source", "An unrelated anecdote", "A repeated sentence"], answerIndex: 1, explanation: "Relevant, credible evidence strengthens an argument." },
  { question: "Why are citations important in academic writing?", options: ["They increase word count", "They acknowledge sources and enable verification", "They replace analysis", "They make all claims true"], answerIndex: 1, explanation: "Citations credit the original authors and allow readers to trace supporting evidence." },
  { question: "Which sentence is most appropriate as a topic sentence?", options: ["This paragraph discusses three effects of remote learning.", "Anyway...", "As stated above, the end.", "Very interesting stuff happened."] , answerIndex: 0, explanation: "A topic sentence introduces the paragraph's main idea in a clear, specific way." },
  { question: "What should an effective conclusion generally do?", options: ["Introduce an unrelated argument", "Restate the central insight and synthesize the discussion", "List random statistics", "Repeat the introduction word for word"], answerIndex: 1, explanation: "A conclusion draws the argument together and explains its broader meaning." },
];

const general: QuizQuestion[] = [
  { question: "Which study habit best supports long-term retention?", options: ["Passive rereading only", "Spaced retrieval practice", "One all-night study session", "Multitasking constantly"], answerIndex: 1, explanation: "Retrieving information across spaced sessions improves durable learning." },
  { question: "What is a good first step when planning a large assignment?", options: ["Wait until the deadline", "Break it into smaller milestones", "Ignore the grading criteria", "Work without a plan"], answerIndex: 1, explanation: "Smaller milestones make large projects easier to start, manage, and review." },
  { question: "Which method is a form of active recall?", options: ["Testing yourself without looking at notes", "Highlighting every line", "Watching a video passively", "Rereading notes repeatedly"], answerIndex: 0, explanation: "Active recall involves retrieving information from memory instead of merely recognizing it." },
  { question: "When is it useful to begin preparing for an exam?", options: ["Only the night before", "Across several sessions ahead of the exam", "After the exam", "Only if a reminder appears"], answerIndex: 1, explanation: "Distributed study gives time to identify gaps and revisit difficult concepts." },
  { question: "What is the purpose of a short focus session?", options: ["To work on one defined task with fewer distractions", "To multitask continuously", "To avoid breaks indefinitely", "To replace all revision"], answerIndex: 0, explanation: "A bounded, distraction-reduced focus period supports sustained attention." },
];

export function sampleQuestions(subject: string): QuizQuestion[] {
  const label = subject.toLowerCase();
  if (/data|computer|program|code|algorithm|cs|software/.test(label)) return dataStructures;
  if (/calcul|math|integr|algebra|statistic/.test(label)) return calculus;
  if (/psych|memory|cognit|brain/.test(label)) return psychology;
  if (/writing|english|essay|literature|research/.test(label)) return writing;
  return general;
}

export function validQuestions(input: unknown): input is QuizQuestion[] {
  return Array.isArray(input) && input.length > 0 && input.length <= 8 && input.every((question) =>
    question && typeof question.question === "string" && question.question.length > 5 &&
    Array.isArray(question.options) && question.options.length === 4 &&
    question.options.every((option: unknown) => typeof option === "string" && option.length > 0) &&
    Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < 4 &&
    typeof question.explanation === "string"
  );
}
