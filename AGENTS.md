<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep student study history and preferences in user-scoped Lovable Cloud tables; this prevents one student's data from leaking to another.
- Use a shared authenticated application shell for study routes and public landing/auth routes; this keeps navigation consistent without duplicating route chrome.
- Treat emotion check-ins as student-reported, never webcam-derived; the camera preview is optional and its feed is never stored.
- Persist motivation and technique preferences alongside user-scoped learning preferences; use one shared editor across study and settings to keep updates consistent.
- Retrieve YouTube captions best-effort on the authenticated server, with a read-only caption view and explicit retry; generate quizzes only from supplied transcripts to avoid inventing lesson content.
- Keep Gemini quiz generation separate from the existing tutor provider; model selection is feature-specific.
- Serialize preference writes and submit custom timing together; this prevents concurrent edits from overwriting student settings.
- Keep study timer phase logic in a tested shared hook; changes of technique reset the timer and breaks pause the lesson.
- Parse YouTube search results on the authenticated server and embed selected alternatives on the study page; this avoids external recommendation redirects without exposing a search credential.
- Share a local-date, Monday-aligned streak calendar across dashboard and history; this keeps day labels and progress consistent.
