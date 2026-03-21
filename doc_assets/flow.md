# Context

You are an expert at designing and implementing ERP systems and
familiar with the process of submitting, reviewing and publishing a scientific article. Also, you are familiar with writing backend code with Spring Boot and Kotlin, and front-end with React and Microsoft's
Fluent Design components.

The desired system will have these users:

## References

[Microsoft Fluent Design - React](https://storybooks.fluentui.dev/react/)

[Code convention](./code_convention.md)
[RBAC](./rbac_admin_requirements.md)
[Transition guide](./conference_transition_guide.md)

## Application flow

The repo already has a flow, but we will need to fix it to match conference platforms such as EasyChair.

### Conference-centered model

- The publisher manages many `conference` records over time.
- Each conference owns its own `tracks`.
- Each track owns a configurable list of `topics` used for submission classification and reviewer matching.
- Each conference must have a `submissionDeadline`.
- A submission is allowed only when:
    - the conference is active,
    - the selected track belongs to that conference,
    - the current time is not after the submission deadline.
- Articles are no longer scoped only by a global track. They are scoped by:
    - `conferenceId`
    - `trackId`
    - one or more selected `topicIds`

### Suggested hierarchy

Publisher -> Conference -> Track -> Topic -> Article -> Review cycle

Example:

- Publisher: ABC Publisher
- Conference: AI Summit 2026
- Track: Natural Language Processing
- Topics: LLM evaluation, information retrieval, peer review automation

When a user (researcher/reviewer) enter the page for the first time (you should check the authentication saved in front-end), then jump to sign in page:

- If they have an account, use the sign-in flow
- If they don't have an account yet, use the sign-up flow

### Sign in flow

1. User will enter their email

2. Backend: check the email in the user table
    1. Found: Send the magic link (like the current implementation, do not fix) and redirect the user to the [NeedsVerify](../frontend/src/components/auth/NeedsVerify.tsx) (do not modify this until I explicitly request that)

    2. Not found: Consider a way for the user to know that they have to register a new email (remember, only researchers/reviewer) (this needs some modification on how the front-end works)

3. User

    1. Found the user info and send email: The current flow (send link, link click and verify, redirect to home) is fine now, so no need to fix yet
    2. Not found: will need to register the account (researchers and reviewers only)

4. After verifying token: Use the current implementation

## Sign up flow

The flow needs to fix this:

After clicking the magic link from the mail, the user must enter [their info](../frontend/src/components/user/Info.tsx)

After validating the info, the backend will give them a token to use the app immediately.

## Submitting flow

Conference selection -> Track selection -> Topic selection -> Submit before deadline -> Initial Screening -> Invite Reviewers -> Anonymous Peer Review -> Chair Decision -> Revision loop if needed -> Final Decision / Publish

One of the authors will submit the article. If the article have more than 1 author, they have to enter all the article authors (at least name, email and insitute) in the order they want (the submitter may not be the first author).

The submitter must first choose the target conference, then one track in that conference, then one or more configured topics in that track.

The submission form should show the conference submission deadline clearly. When the deadline has passed, the UI should prevent new submissions and the backend should reject the request as well.

After submitting, the system will send the email to all the authors. The email should include the link for the author to see the submitted articles.

If the author is not in the user table yet, email should tell them to create an account to see.

If the author is in the system, but happens to be a reviewer before, they can see it as an author of the article (not with reviewer role, but like the researcher/author role).

The chair of the conference or delegated editor of the track can see all the articles in their conference/track scope. Update the RBAC to include that and implement it.

## Initial Review and Contacting Reviewer

For the initial review, the chair/editor can reject or continue to contact reviewer. If they reject, they must enter the reason. An email will be sent to the author.

After initial review and approving to continue the process, the chair/editor can contact reviewers. The chair/editor can enter their name and email to add them, and click `Contact Reviewer`, which should send an email to contact reviewers with a link to sign up as a reviewer. Our application should handle this link like this: The reviewer will be redirected to the same sign up page (with the email pre-filled). After that, they will click the continue button, then the normal sign-up flow.

Each conference or track should have a review policy configuration, including at least:

- target number of reviewers to invite
- minimum number of completed reviews required before a chair decision can be made
- default value: `3`

The role of reviewer will only see the articles that are assigned to them.

## Comment flow

The reviewer can annotate, comments anonymously. The reviewer can see only their comments in their assigned-to-review articles but not other reviewers'. The authors can see all the reviewers' comments and can reply to them.

In this step, the authors can update their work. The system should save the history of the article versions with the history of comments on each version for checking.

## Structured review submission

In addition to inline annotations, each reviewer must submit a **structured review** to mark their review as complete. This includes:

- **Scores**: numerical ratings (1–10) on configurable criteria such as originality, technical quality, clarity, relevance, and an overall score.
- **Summary notes**: free-text overall assessment (summary, strengths, weaknesses, questions). Visible anonymized to authors.
- **Confidential remarks to the chair**: optional free-text, visible only to the chair.
- **Recommendation**: a suggested decision — one of `STRONG_ACCEPT`, `ACCEPT`, `WEAK_ACCEPT`, `BORDERLINE`, `WEAK_REJECT`, `REJECT`, `STRONG_REJECT`.

A review is only counted as "completed" once the structured review is submitted. The recommendation is advisory to the chair, not a binding decision.

## Peer review completion and decision flow

- A reviewer may submit their review only once per review round unless the chair reopens the review.
- The article remains in peer review until the configured minimum number of reviewers have completed their reviews.
- Normally this threshold is `3` completed reviews.
- Reviewer scores, summary notes, and recommendations are inputs for the chair, not final decisions.
- After the minimum completed review count is reached:
    - the system aggregates scores (averages per criterion) and recommendation distribution,
    - the system notifies the chair,
    - the article moves to a chair-decision state,
    - only then can the chair send the decision to the authors.

The decision sent to authors can be one of:

- accept
- reject
- revisions required

Only the chair decision should trigger the formal decision email to authors.
