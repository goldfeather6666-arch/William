# MedCoach AI

AI-powered medical education and examination preparation platform for MBBS and
international exams (USMLE, PLAB, AMC, Nursing, Pharmacy). Turns uploaded study
material into an interactive learning engine:

**upload → understand → learn → memorize → practice → evaluate → revise**

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **Tailwind CSS 3**
- **shadcn/ui**-style radix primitives, **Framer Motion** for purposeful animation
- **Supabase** (PostgreSQL, Auth, Storage) with Row Level Security
- **Provider-independent AI layer** (OpenAI, Anthropic, Gemini, DeepSeek,
  OpenRouter, custom OpenAI-compatible endpoints) — platform-managed env keys or
  encrypted per-user keys
- **Vitest** for unit tests

## Modules

| Module | Route | Status |
| --- | --- | --- |
| Onboarding / profile | `/onboarding`, `/settings` | ✅ |
| AI Medical Tutor (6 modes, streaming, RAG + citations) | `/tutor` | ✅ |
| Knowledge Library (upload + processing pipeline) | `/library` | ✅ |
| Flashcard engine (FSRS-style spaced repetition) | `/flashcards` | ✅ |
| MCQ practice (timed, explanations, attempts) | `/practice` | ✅ |
| Clinical case simulator (step-by-step) | `/cases` | ✅ |
| Notes generator (from processed documents) | via `/library` | ✅ |

API routes: `/api/ai/tutor`, `/api/library/upload`, `/api/library/notes`,
`/api/flashcards/review`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### Environment variables

All public variables are read lazily; the app builds and runs without secrets and
degrades to explicit "setup required" states when they are missing.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, privileged ops |
| `NEXT_PUBLIC_SITE_URL` | canonical site URL |
| `AI_KEY_ENCRYPTION_SECRET` | 32-byte base64 key (AES-256-GCM) for user provider keys |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` | optional platform-managed providers (with optional `*_BASE_URL` / `*_MODEL`) |
| `CUSTOM_AI_API_KEY` + `CUSTOM_AI_BASE_URL` | custom OpenAI-compatible endpoint |
| `OCR_ENDPOINT_URL` | optional OCR service for scanned documents/images |
| `PAYMENTS_PROVIDER` | `manual` or unset (disabled) |

### Database

Migrations live in `supabase/migrations`. Apply them to your Supabase project
(they create tables, indexes, RLS policies, and seed a verified MCQ bank and
clinical cases). RLS is enabled on every table; documents, AI conversations,
flashcards, attempts etc. are private to the owner, and the MCQ bank and
clinical cases are readable by all authenticated users with instructor/admin
write access.

### Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run check      # typecheck + test
npm run lint       # next lint
```

## AI architecture

- `lib/ai/providers.ts` resolves a provider (user's decrypted config first,
  then platform env keys) with fallbacks.
- `lib/ai/client.ts` implements non-streaming chat completions; the tutor route
  streams `text/event-stream` deltas.
- `lib/ai/embed.ts` provides a deterministic local-hash embedding fallback so the
  document pipeline and RAG run without an external embedding provider.
- User-supplied API keys are encrypted at rest and never exposed to the browser.

## Document pipeline

`lib/documents/pipeline.ts` implements `UPLOAD → VALIDATE → EXTRACT → CHUNK →
EMBED → READY` and only reports success after the pipeline completes. Job status
is tracked truthfully in `documents` and `document_jobs`.

## Safety & accuracy

The tutor and notes prompts explicitly require distinguishing established facts
from explanation, flagging uncertainty, citing sources, never fabricating
citations, and stating the platform is an educational tool — not clinical advice.
Generated content is never claimed to be official examination material unless
verified.
