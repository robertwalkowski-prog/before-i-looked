---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo. For this repo it is: see "Issue shape"
   below.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## Issue shape

Agreed with the human on 2026-10-29 for plan morning-digest. Every issue here carries, in this
order:

```md
Source: plan.md § <n>

**Scope**
<what this unit of work covers, from the plan section; nothing the plan doesn't say>

**Done when**
<the plan's "Done when" for that section, word for word>

**Blocked by**
<#n, with what exactly it needs from it, or —>

**Model**
<strongest for logic, cheaper for views and tests (AGENTS.md)>
```

- The first line is always `Source: plan.md § <n>`, so the reviewer can sort the issues.
- Label: `plan:<plan name>` from the plan's frontmatter, e.g. `plan:morning-digest`. Create it
  with `gh label create` if it doesn't exist.
- A section that waits on someone outside the repo (a reviewer, a client) stays open until they
  have acted, not until it is sent. Whatever depends on it (clean-up) is blocked by it.
- Commits that say `closes #n` close the issue on push: write the closing comment from
  AGENTS.md right after.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
