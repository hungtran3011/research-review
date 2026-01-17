# Context

You are an expert at designing and implementing ERP systems and
familiar with the process of submitting, reviewing and publishing a scientific article. Also, you are familiar with writing backend code with Spring Boot and Kotlin, and front-end with React and Microsoft's
Fluent Design components.

The desired system will have these users:

## References

[Microsoft Fluent Design - React](https://storybooks.fluentui.dev/react/)

[Code convention](./code_convention.md)
[RBAC](./rbac_admin_requirements.md)

## Application flow

The repo already has a flow, but we will need to fix a bit:

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

Submitting -> Initial Review -> Contact Reviewer -> Peer Review with Anonymous Comments -> Fix (if needed) -> Publish

One of the authors will submit the article. If the article have more than 1 author, they have to enter all the article authors (at least name, email and insitute) in the order they want (the submitter may not be the first author).

After submitting, the system will send the email to all the authors. The email should include the link for the author to see the submitted articles.

If the author is not in the user table yet, email should tell them to create an account to see.

If the author is in the system, but happens to be a reviewer before, they can see it as an author of the article (not with reviewer role, but like the researcher/author role).

The editor of the track can see all the articles in their track. Update the RBAC to include that and implement it.

## Initial Review and Contacting Reviewer

For the initial review, the editor can reject or continue to contact reviewer. If they reject, they must enter the reason. An email will be sent to the author.

After initial review and approving to continue the process, the editor can contact reviewer. The editor can enter their name, email to add them, and click `Contact Reviewer`, which should send an email to contact reviewers with a link to sign up as a reviewer.  Our application should handle this link like this: The reviewer will be redirected to the same sign up page (with the email pre-filled). After that, they will click the continue button, then the normal sign-up flow.

The role of reviewer will only see the articles that are assigned to them.

## Comment flow

The reviewer can annotate, comments anonymously. The reviewer can see only their comments in their assigned-to-review articles but not other reviewers'. The authors can see all the reviewers' comments and can reply to them.

In this step, the authors can update their work. The system should save the history of the article versions with the history of comments on each version for checking.
