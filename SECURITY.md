# Security Policy

## Reporting a vulnerability

Email **logdash.contact@gmail.com**.

Please do not open a public issue, a public discussion or a pull request for a security problem.
A public report gives every Logdash user the problem and none of them the fix.

Include as much of this as you have:

- What the vulnerability is, in one or two sentences.
- Steps to reproduce it, ideally a request, a snippet or a short script.
- The impact: what an attacker gets, and what they need in order to get it.
- Where you found it: `logdash.io`, a self-hosted instance, or one of the SDKs.

If you cannot reproduce it reliably, send it anyway and say so.

## What happens next

We reply within **72 hours** of your first email, including on weekends.
That first reply tells you whether we have reproduced it and what we think the severity is.

The fix timeline depends on severity.
Something that exposes other people's data gets worked on immediately.
Something that needs an unlikely precondition gets scheduled like any other bug.
Either way you get a straight answer about which one it is, and we tell you when it ships.

We will credit you in the release notes if you want to be credited.
Say so in your email.

## No bug bounty

There is no bug bounty and no payment for reports.
We are a two-person team and we would rather be honest about that up front than have you spend a weekend on this expecting otherwise.

## Supported versions

There is one hosted deployment, `logdash.io`, and it tracks the `main` branch of this repository.
Fixes land on `main` and go out with the next deploy.
There are no long-lived release branches and no back-ports, so `main` is the only supported version.

If you run a copy of this repository yourself, pull `main` to pick up a fix.
