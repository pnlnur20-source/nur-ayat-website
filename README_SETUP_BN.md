# Nur & Ayat — Firebase shared website

## Included
- Public pink-romantic website and live relationship counter (start date: 8 Oct 2026)
- Firebase email/password admin sign-in
- Shared, real-time photo gallery and audio playlist
- Admin upload/delete for photos and tracks
- HTML/CSS/JS template editor with isolated preview and publish-to-everyone
- Firestore and Storage security rules; only the configured admin UID can write

## 1. Create and configure Firebase
1. Open https://console.firebase.google.com/ and create a project.
2. In Project Overview, add a **Web app**. Copy its Firebase config.
3. Build > Authentication > Get started > Sign-in method > enable **Email/Password**.
4. Authentication > Users > Add user. Create the admin email/password yourself. Do not add public sign-up to this website.
5. Open that user and copy their **UID**.
6. Build > Firestore Database > Create database (production mode).
7. Build > Storage > Get started. Cloud Storage for Firebase বর্তমানে Blaze (pay-as-you-go) plan চায়। Billing account link করতে হবে; no-cost usage quota থাকতে পারে, কিন্তু quota ছাড়ালে charge হতে পারে। Budget alert সেট করো। নতুন bucket-এর নাম সাধারণত `PROJECT_ID.firebasestorage.app`।
8. In `public/app.js`, replace the five `PASTE_...` Firebase config values (Storage bucket-এর exact নাম Firebase Console থেকে copy করো; নতুন bucket সাধারণত `PROJECT_ID.firebasestorage.app`) and set `ADMIN_UID` to the UID from step 5.
9. In `firestore.rules` and `storage.rules`, replace `PASTE_ADMIN_AUTH_UID` with the same exact UID.
10. Deploy the rules before making the site public. Never leave Firestore or Storage in test mode.

## 2. Deploy
Install Node.js, then install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```
From this folder:
```bash
firebase use --add
firebase deploy
```
Choose the Firebase project you created. `firebase.json` deploys Hosting, Firestore rules and Storage rules. The site URL will be shown in the terminal, usually `https://YOUR_PROJECT_ID.web.app`.

## 3. Use Admin
Open the deployed site > ADMIN > sign in with the admin account. Add photos and music, or write HTML/CSS/JS and press **Publish to everyone**. Public visitors receive updates in real time.

## Important security notes
- Firebase web config is not a password; it is expected to be visible in a browser. Security comes from Authentication and deployed Security Rules.
- Never put service-account JSON, private keys, or admin passwords in this project or in browser JavaScript.
- Set a strong unique admin password and enable appropriate account protections in Firebase Authentication.
- Public media is readable by anyone with the site URL. Do not upload private or sensitive photos/audio.
- Published custom HTML/JS is shown inside a sandboxed iframe, but only publish code you trust. The editor does not provide a server-side code execution environment.
- Upload limits in the UI/rules are 10 MB per photo and 30 MB per audio file. Firebase Storage quotas/pricing and availability depend on your project and current plan.
- The HTML/CSS/JS editor publishes the template preview; it does not rewrite the main website source files or bypass Firebase Hosting deployment.

## Firebase docs
- Web setup: https://firebase.google.com/docs/web/setup
- Authentication: https://firebase.google.com/docs/auth/web/password-auth
- Firestore realtime listeners: https://firebase.google.com/docs/firestore/query-data/listen
- Storage uploads: https://firebase.google.com/docs/storage/web/upload-files
- Security Rules: https://firebase.google.com/docs/rules
- Hosting: https://firebase.google.com/docs/hosting/quickstart
