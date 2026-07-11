# AI Council - Architecture Document

**Version:** 1.0 (Development & Testing)
**Status:** Frozen Architecture
**Reference:** Product Requirements Document (PRD)

---

# 1. Overview

AI Council is an AI Reasoning Platform that allows multiple Large Language Models (LLMs) to collaboratively solve a user's question.

Unlike traditional AI aggregators that simply display multiple responses, AI Council performs structured collaborative reasoning in the background before presenting a single verified answer.

The user never interacts with individual model responses unless they explicitly request discussion details.

---

# 2. High-Level Architecture

```text
                         User

                           │

                           ▼

                    Next.js Frontend

                           │
                    REST + WebSocket

                           │

                           ▼

                  FastAPI Backend API

                           │

            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼

      Debate Engine    Memory Engine   Report Engine

            │              │              │
            └──────┬───────┴───────┬──────┘
                   │               │
                   ▼               ▼

          Consensus Engine   Verification Engine

                   │

                   ▼

          Provider Abstraction Layer

                   │

     ┌─────────────┼──────────────┬──────────────┐
     │             │              │              │

 OpenAI      Anthropic      Google      OpenRouter

     │             │              │              │

 GPT Models   Claude Models Gemini Models Other Models
```

---

# 3. System Philosophy

The frontend should remain simple.

The backend performs all reasoning.

Every major responsibility is isolated into its own engine.

This allows future scaling without changing the core architecture.

---

# 4. Architecture Principles

## Modular

Every engine should be independently replaceable.

---

## Provider Independent

The reasoning engine should never know whether it is communicating with:

- GPT
- Claude
- Gemini
- Grok
- DeepSeek
- Qwen
- Future Models

It communicates only with the Provider Layer.

---

## Stateless API

Backend APIs remain stateless.

Conversation state is maintained inside the Memory Engine.

---

## Event Driven

Every discussion stage produces structured outputs consumed by the next engine.

---

## Explainable

Every conclusion must be traceable.

The platform should always know:

- why a conclusion was accepted
- why another was rejected

---

# 5. Technology Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion

---

## Backend

- FastAPI
- Python 3.12+

---

## AI Framework

- LangGraph

Reason:

AI Council is not a linear chain.

It is a collaborative reasoning graph.

---

## AI Gateway

LiteLLM

Purpose

Provides one interface for multiple providers.

Supported Providers

- OpenAI
- Anthropic
- Google
- Groq
- OpenRouter
- Together AI
- Azure OpenAI

---

## Database

PostgreSQL

Stores

- Questions
- Discussions
- Consensus
- Reports
- Memories

---

## Vector Search

pgvector

Purpose

Semantic search over previous discussions.

---

## Cache

Redis

Stores

- Active discussion state
- Temporary memory
- API cache

---

## Background Processing

Celery

Broker

Redis

Responsibilities

- Long discussions
- Report generation
- Retry failed models

---

## Storage

Cloudflare R2

Stores

- Attachments
- Generated reports

---

## Communication

REST API

WebSocket

Purpose

Real-time progress updates.

---

# 6. Core Components

---

## Frontend

Responsibilities

- Question Input
- Model Selection
- Discussion Depth
- Final Report
- Discussion Viewer
- Continue Discussion

Frontend contains no AI logic.

---

## API Layer

Responsibilities

- Request Validation
- Discussion Creation
- Engine Coordination
- Response Delivery

No reasoning happens here.

---

## Debate Engine

Purpose

Coordinates the entire reasoning workflow.

Responsibilities

- Create discussions
- Start independent thinking
- Trigger collaboration
- Request verification
- Generate final report

This is the heart of AI Council.

---

## Memory Engine

Purpose

Maintain discussion memory.

Contains

### Shared Memory

Stores

- consensus
- disagreements
- corrections
- missing information

---

### Model Memory

Stores

Per-model

- previous response
- updated opinion
- corrections

---

## Consensus Engine

Purpose

Track agreement.

Outputs

```text
Agreed

Disagreed

Open Questions

Need More Information
```

Consensus updates after every discussion cycle.

---

## Verification Engine

Purpose

Quality assurance.

Checks

- hallucinations
- contradictions
- unsupported claims
- logical consistency
- duplicated reasoning

Removes weak information before report generation.

---

## Report Engine

Purpose

Generate final response.

Produces

- Final Answer
- Consensus
- Disagreements
- Confidence
- Key Contributions

---

## Provider Abstraction Layer

Purpose

Hide provider-specific implementations.

Example

Debate Engine calls

```python
generate_response(model="gpt-5")
```

Provider Layer decides

- API endpoint
- authentication
- provider formatting

No engine communicates directly with OpenAI or Anthropic.

---

# 7. AI Discussion Flow

## Step 1

Independent Thinking

Every selected model receives

- system prompt
- user question

Models cannot see other responses.

---

## Step 2

Response Collection

Responses stored inside Memory Engine.

---

## Step 3

Shared Memory Generation

Consensus Engine creates

- agreements
- disagreements
- unresolved issues

---

## Step 4

Collaborative Discussion

Each model receives

- original question
- all responses
- shared memory

Model updates its reasoning.

---

## Step 5

Consensus Update

Consensus recalculated.

---

## Step 6

Verification

Verification Engine checks

- facts
- reasoning
- contradictions

---

## Step 7

Stop Decision

If

Agreement High

↓

Generate report

Else

↓

Continue another discussion cycle

---

## Step 8

Final Report

Generated for frontend.

---

# 8. Adaptive Discussion Engine

Discussion is not fixed.

Configuration

```text
Minimum Discussion Cycles

2

Maximum Discussion Cycles

5
```

Stop Conditions

- High agreement
- Stable reasoning
- Maximum cycles reached

Users never see discussion cycles.

---

# 9. Discussion State

Each discussion maintains

```text
Question

Selected Models

Independent Responses

Shared Memory

Consensus

Verification Results

Current Cycle

Final Report
```

---

# 10. Memory Architecture

## Shared Memory

Visible to all models.

Contains

- accepted arguments
- rejected arguments
- open questions
- corrections

---

## Private Memory

Visible only to one model.

Contains

- previous answer
- opinion changes
- remaining concerns

---

# 11. Confidence Calculation

Confidence is calculated from

- Agreement Level
- Logical Consistency
- Verification Success
- Remaining Disagreements
- Evidence Strength

Majority vote is never used.

---

# 12. Failure Handling

## Provider Failure

If one provider fails

Continue discussion using remaining models.

---

## Timeout

Retry once.

If still unavailable

Remove provider from discussion.

---

## Invalid Response

Verification Engine discards unusable responses.

---

## No Consensus

Return

```text
Consensus could not be reached.

Additional evidence is recommended.
```

---

# 13. Data Model

Discussion

```text
id

question

selected_models

discussion_depth

status

created_at
```

---

Model Response

```text
id

discussion_id

model

cycle

response

updated_response

created_at
```

---

Consensus

```text
discussion_id

agreements

disagreements

missing_information

confidence
```

---

Final Report

```text
discussion_id

final_answer

summary

confidence

generated_at
```

---

# 14. Project Structure

```text
backend/

├── app/
│
├── api/
│
├── core/
│
├── debate/
│
├── memory/
│
├── consensus/
│
├── verification/
│
├── report/
│
├── providers/
│
├── models/
│
├── database/
│
├── workers/
│
├── utils/
│
└── tests/
```

---

Frontend

```text
frontend/

├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── features/
├── store/
├── types/
└── styles/
```

---

# 15. Future Scalability

The architecture intentionally separates reasoning from infrastructure.

Future additions require minimal changes.

Examples

- Authentication
- Payments
- Team Workspaces
- Browser Extension
- Mobile App
- Enterprise API
- Custom AI Agents

The Debate Engine remains unchanged.

---

# 16. Design Goals

- Clean separation of responsibilities
- Provider independence
- Explainable reasoning
- Scalable architecture
- Modular engines
- Easy integration of new AI providers
- Background collaborative reasoning
- Transparent final reports

---

# 17. Frozen Architecture

The architecture is frozen around six independent engines:

1. Debate Engine
2. Memory Engine
3. Consensus Engine
4. Verification Engine
5. Report Engine
6. Provider Abstraction Layer

All future features should integrate into one of these engines rather than introducing tightly coupled logic. This ensures that AI Council remains maintainable, extensible, and scalable as additional models, capabilities, and products are introduced.