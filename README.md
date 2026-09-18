# Projeto Argos — Context-Aware AI Engineering Workflow

Argos is an experimental AI engineering framework for making agent-assisted development more **context-aware, repeatable and auditable**.

The project explores a practical question:

> How can an AI assistant retain project context, plan before acting, learn from previous work and leave behind useful engineering documentation?

## What Argos demonstrates

Argos combines four concerns that are often treated separately:

```text
Project context
      ↓
Planning
      ↓
Agent execution
      ↓
Memory + lessons learned
```

Instead of treating each AI interaction as isolated, the system maintains structured artifacts that preserve what matters across tasks.

## Core building blocks

### Memory

A persistent project memory records relevant decisions, context and previous interactions.

The goal is not to store everything. It is to preserve information that improves future engineering decisions.

### Lessons learned

Recurring problems and useful solutions are captured as reusable engineering knowledge:

```text
Problem
  ↓
Solution
  ↓
Impact
```

### Scratchpad

The scratchpad acts as an explicit working state for:

- current phase;
- tasks;
- dependencies;
- blockers;
- confidence;
- execution progress.

### Planning and execution modes

Argos separates understanding from execution.

```text
Request
  ↓
Plan
  ↓
Clarify
  ↓
Build confidence
  ↓
Execute
  ↓
Document
```

This boundary is intentional: agentic systems become more reliable when action follows explicit context and planning rather than immediate generation.

## First-project onboarding

When introduced to a new codebase, the workflow can:

1. inspect the repository structure;
2. identify technologies and conventions;
3. establish project documentation;
4. create working-memory artifacts;
5. derive an initial engineering context.

This gives subsequent tasks a shared baseline instead of restarting from zero.

## Why I built it

Argos predates some of my newer work on agentic systems, but it already reflects principles that continue to guide my architecture:

- context should be explicit;
- memory should be structured;
- execution should follow planning;
- decisions should leave evidence;
- documentation is part of engineering;
- agents need boundaries, not just prompts.

These ideas later became important in broader work around LucyOS, specialist agents, governance and long-term memory.

## Repository focus

This repository contains the workflow definitions, templates and conventions used to experiment with this model of AI-assisted development.

It should be read as an **engineering experiment and framework**, not as a finished autonomous-development product.

## Related work

- [LucyOS case study](https://claudiodearaujo.dev.br/pt/work/lucyos)
- [Cláudio Araújo — Software Engineering, AI Engineering & Technical Leadership](https://claudiodearaujo.dev.br)

---

Built as part of my exploration of AI engineering, agentic workflows, memory and developer systems.
