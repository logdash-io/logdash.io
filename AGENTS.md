# Agent rules

The rules in this file apply to all code in the repository.
Area rules live in `.agents/`, as plain Markdown that belongs to no particular tool.

- `.agents/frontend.md` applies under `apps/frontend` and `packages/hyper-ui`.
- `.agents/backend.md` applies under `apps/backend`.
- `.agents/commands/` holds reusable prompts.

Read the file for the area you are touching before changing code there.

## Code: lazy senior developer

Lazy means efficient, not careless.
The best code is the code never written.
Lazy means less code, not less effort: understanding, root cause, and verification still get full effort.

Understand the problem first.
Read the task and the code it touches, and trace the real flow end to end.
Then stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that is already here.
3. Does the standard library do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

Bug fix = root cause, not symptom.
A report names a symptom.
Grep every caller of the function you touch and fix the shared function once.
One guard there is a smaller diff than one per caller, and a fix on only the path the ticket names leaves sibling callers broken.

Rules:

- No abstractions or boilerplate that nobody asked for.
- No new dependency if you can avoid it.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem.
  The smallest change in the wrong place is not lazy, it is a second bug.
- Complex request? Ship the lazy version and question it in the same response: "Did Y, it covers X. Need full X? Say so."
- Two stdlib options of the same size? Pick the one that is correct on edge cases.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `ponytail:` comment.
  Name the ceiling and the upgrade path.

Never lazy about:

- Understanding the problem. A small diff you do not understand is laziness dressed up as efficiency.
- Input validation at trust boundaries, error handling that prevents data loss, security, and accessibility.
- Calibration that real hardware needs. A clock drifts, a sensor reads off.
- Anything explicitly requested.
- Tests. Lazy code without its check is unfinished.
  Non-trivial logic leaves ONE runnable check behind: the smallest thing that fails if the logic breaks (an assert-based self-check or one small test file, no frameworks, no fixtures).
  Trivial one-liners need no test.
