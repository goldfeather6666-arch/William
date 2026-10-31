/**
 * Shared domain types.
 *
 * These mirror the SQL schema in supabase/migrations. Row types are declared
 * explicitly (rather than generated) so the data layer validates its own
 * boundaries and does not depend on a specific Supabase CLI version.
 */

export type UserRole = "student" | "instructor" | "institution_admin" | "platform_admin";

export const USER_ROLES: UserRole[] = ["student", "instructor", "institution_admin", "platform_admin"];

export type CurriculumCode =
  | "bd-mbbs"
  | "pk-mbbs"
  | "in-mbbs"
  | "usmle"
  | "plab"
  | "amc"
  | "nursing"
  | "pharmacy"
  | "generic";

export type AiProviderId = "openai" | "anthropic" | "gemini" | "deepseek" | "openrouter" | "custom";

export const AI_PROVIDERS: AiProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "openrouter",
  "custom",
];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  institution_id: string | null;
  institution_name: string | null;
  country: string | null;
  curriculum: CurriculumCode | null;
  degree: string | null;
  academic_year: number | null;
  preferred_subjects: string[];
  exam_date: string | null;
  daily_study_minutes: number | null;
  explanation_level: "beginner" | "student" | "advanced";
  onboarded_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Curriculum {
  id: string;
  code: string;
  title: string;
  region: string;
  description: string;
  exam_format: string;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  discipline: string;
  description: string;
  color: string;
}

export interface Institution {
  id: string;
  name: string;
  country: string | null;
  curriculum_code: string | null;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  subject_id: string | null;
  folder: string | null;
  status: DocumentStatus;
  page_count: number | null;
  char_count: number | null;
  error_message: string | null;
  checksum: string | null;
  extracted_preview: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus =
  | "uploaded"
  | "extracting"
  | "chunking"
  | "embedding"
  | "ready"
  | "failed";

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  page: number | null;
  chunk_index: number;
  content: string;
  token_estimate: number;
  embedding: number[] | null;
  embedding_model: string | null;
}

export interface DocumentJob {
  id: string;
  document_id: string;
  user_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  stage: DocumentStatus;
  attempts: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  mode: "detailed" | "short" | "long_answer" | "high_yield";
  content: string;
  model: string | null;
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  document_id: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  card_type: "basic" | "cloze" | "image";
  image_url: string | null;
  cloze_text: string | null;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  due_at: string;
  stability: number;
  difficulty_fsrs: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: "new" | "learning" | "review" | "relearning";
  last_reviewed_at: string | null;
  created_at: string;
}

export type ReviewRating = 1 | 2 | 3 | 4;

export interface FlashcardReview {
  id: string;
  card_id: string;
  user_id: string;
  rating: ReviewRating;
  state: string;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  reviewed_at: string;
}

export interface McqQuestion {
  id: string;
  subject_id: string | null;
  subject_slug: string | null;
  topic: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
  option_explanations: string[] | null;
  difficulty: "easy" | "medium" | "hard";
  is_clinical: boolean;
  source: string;
  generated: boolean;
  verified: boolean;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  time_spent_seconds: number | null;
  session_id: string | null;
  created_at: string;
}

export type ExamKind = "mcq" | "saq" | "laq" | "mixed";

export interface ExamSession {
  id: string;
  user_id: string;
  title: string;
  kind: ExamKind;
  status: "in_progress" | "submitted" | "graded";
  duration_minutes: number | null;
  question_count: number;
  config: Record<string, unknown>;
  score: number | null;
  max_score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface ExamQuestion {
  id: string;
  session_id: string;
  position: number;
  kind: "mcq" | "saq" | "laq";
  prompt: string;
  options: string[] | null;
  correct_index: number | null;
  model_answer: string | null;
  rubric: { criterion: string; points: number }[] | null;
  points: number;
}

export interface ExamAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string | null;
  selected_index: number | null;
  awarded_points: number | null;
  is_ai_estimate: boolean;
  feedback: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string;
  mode: TutorMode;
  subject_id: string | null;
  document_id: string | null;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export type TutorMode =
  | "beginner"
  | "mbbs_exam"
  | "detailed"
  | "clinical"
  | "quick_revision"
  | "viva";

export interface AiMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Citation[];
  model: string | null;
  token_estimate: number | null;
  created_at: string;
}

export interface Citation {
  documentId?: string;
  title: string;
  page?: number | null;
  url?: string;
}

export interface ClinicalCase {
  slug: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  demographics: { age: number; sex: string; occupation: string };
  chief_complaint: string;
  history: string[];
  past_history: string[];
  examination: string[];
  vitals: { label: string; value: string; flag?: "low" | "normal" | "high" }[];
  investigations: { name: string; result: string; cost: number }[];
  differentials: string[];
  diagnosis: string;
  diagnosis_notes: string;
  management: string[];
  teaching_points: string[];
}

export interface CaseAttempt {
  id: string;
  user_id: string;
  case_slug: string;
  history_asked: string[];
  investigations_ordered: string[];
  differential_entered: string[];
  final_diagnosis: string | null;
  management_entered: string[];
  reasoning_score: number | null;
  feedback: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  exam_date: string | null;
  daily_minutes: number;
  generated_by: "ai" | "rules";
  rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: string;
  plan_id: string;
  user_id: string;
  scheduled_for: string;
  title: string;
  subject_slug: string | null;
  kind: "read" | "flashcards" | "mcq" | "case" | "revision" | "mock_exam" | "osce";
  duration_minutes: number;
  completed_at: string | null;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  subject_slug: string;
  topic: string | null;
  mastery: number;
  questions_attempted: number;
  questions_correct: number;
  last_studied_at: string | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  price_cents_month: number;
  price_cents_year: number;
  monthly_credits: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  interval: "month" | "year";
  started_at: string;
  current_period_end: string | null;
  provider: string;
  provider_ref: string | null;
  cancel_at_period_end: boolean;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  feature: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  feature: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_cents: number;
  latency_ms: number;
  status: "success" | "error";
  error_code: string | null;
  created_at: string;
}

export interface AiProviderConfigRow {
  id: string;
  user_id: string;
  provider: AiProviderId;
  label: string;
  base_url: string | null;
  model: string | null;
  encrypted_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning" | "system";
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AdminSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const TUTOR_MODES: { value: TutorMode; label: string; blurb: string }[] = [
  { value: "beginner", label: "Explain like a beginner", blurb: "Plain language, analogies, zero assumed knowledge." },
  { value: "mbbs_exam", label: "MBBS examination", blurb: "Exam-structured answers with keywords and marks." },
  { value: "detailed", label: "Detailed medical", blurb: "Full mechanisms, classifications and clinical correlation." },
  { value: "clinical", label: "Clinical application", blurb: "Bedside reasoning, red flags and management paths." },
  { value: "quick_revision", label: "Quick revision", blurb: "High-yield facts only, perfect before a test." },
  { value: "viva", label: "Professor / viva", blurb: "Socratic follow-up questions and probing." },
];
