# AI_LOG.md

Key AI interactions during development. I used **ChatGPT** for project setup and the first version of the Firestore rules, and **Claude** for the security and privacy review, tests and fixes. Entries marked **AI WRONG** are cases where the AI output was incorrect or incomplete, how I noticed, and how I fixed it.

---

## 1. Project setup (ChatGPT)

- **Prompt (paraphrased, not the exact wording):** I asked ChatGPT to help me build a visitor photo-upload and slideshow web application using React, Vite, Firebase and Cloudinary, including a visitor upload form, photo storage and a TV slideshow.
- **AI output:** the React + Vite project structure, Firebase and Cloudinary wiring, the upload form, the TV Display slideshow.
- **What I checked:** I ran each part and tested it before moving on: Firebase connection, Cloudinary upload, metadata saved in Firestore, slideshow rotation and controls, returning visitor, real-time updates.
- **Outcome:** all core functional tests passed, but passing tests only showed the app worked, not that it was safe. That led to the review below.

## 2. Security review brief (Claude)

- **Prompt:** I gave Claude the assignment, my stack and my status, and asked it to act as a software engineer reviewing a student project: evaluate security and privacy, work one step at a time, ask to see my real code before suggesting changes, and not invent fields or rules.
- **AI output:** a ranked risk list (Firestore rules, unsigned Cloudinary preset, identity, consent, validation, deletion) and a step order starting with the rules.
- **What I did:** followed the steps in order and shared the real files each time. Every change below was tested after applying it.

## 3. Firestore rules: AI WRONG (ChatGPT's first version)

- **Prompt/AI output:** ChatGPT generated my first rules, with owner-only visitor access, a consent check on create and a Cloudinary URL check.
- **What was wrong:** when I pasted the rules into the review, Claude found that (a) the photo owner could `update` any field after creation, including `imageUrl`, `ownerUid` and `consent`, which bypassed the create-time URL check; (b) the URL pattern `.*` after an unescaped `.` was loose; (c) there were no field allow-list, name length limit or timestamp check; (d) read access did not enforce consent.
- **How I noticed:** by having the rules reviewed line by line against my real field names, rather than trusting that they worked because uploads succeeded.
- **Fix:** replaced the rules (now in `firestore.rules`): photos can no longer be updated, a field allow-list, name limited to 50 characters, `createdAt` must equal the server time, an escaped Cloudinary URL pattern, and read requires `consent == true` (or ownership).
- **Check:** published the rules, then uploaded photos (accepted), displayed them on the TV, and deleted my own photo (accepted).

## 4. Cloudinary preset and image size (Claude)

- **Prompt:** I shared the preset settings and asked whether unsigned uploads were safe enough.
- **AI output:** the allowed formats, overwrite off and fixed folder were fine; it said the incoming transformation was empty and suggested `c_limit,w_1920,h_1080`. It also said not to assume the account size limit was 10 MB, and asked me to check it.
- **Check:** added the transformation and uploaded a 5120x2160 photo, which was stored at 1920x810. The Cloudinary console showed the Free plan limits as 10 MB and 25 MP per image.
- **Outcome:** limits recorded in `ASSUMPTIONS.md` with the date checked.

## 5. Client vs server validation (Claude)

- **Prompt:** I asked how to prove that file validation is not only client-side.
- **AI output:** a test plan: an invalid batch (JPG + GIF), then a text file renamed `.jpg`.
- **Result:** the form blocked the JPG + GIF batch and nothing reached Cloudinary or Firestore. The renamed text file passed the browser check but Cloudinary rejected it ("Raw file format jpg not allowed"). This shows the preset's allowed formats do the real enforcement.
- **Related finding:** the browser's `accept` attribute hid the GIF from the file picker, so I had to relax it temporarily to test my own validation, then restore it.

## 6. Offline upload: AI WRONG (Claude's prediction)

- **AI output:** Claude said that uploading while offline should show "Network error during photo upload."
- **What happened:** the form froze at "Uploading... 0%" with no error. The DevTools Network list showed failed requests from `visitorService.js` and `firebase_firestore`, not from Cloudinary.
- **How I noticed:** the 0% hang, and the failed requests pointing at the Firestore write rather than the Cloudinary upload. Firestore queues writes while offline, so the `await setDoc(...)` never failed.
- **Fix:** added a `withTimeout` wrapper (15 seconds) around the visitor and photo writes in `visitorService.js`.
- **Check:** offline again: the message "Could not reach the server. Check your connection and try again." appeared after about 15 seconds and the submit button became clickable again without refreshing. The 60-second Cloudinary timeout was tested separately with a 1 ms timeout ("Upload timed out. Please try again."), then restored.

## 7. Merging AI code into visitorService.js: AI WRONG (integration error)

- **What happened:** AI-suggested snippets for validating all files before upload were merged into `visitorService.js` incorrectly: `uploadPhoto` was imported twice and `files.forEach(validatePhoto)` ended up outside the function, where `files` is not defined.
- **How I noticed:** I found the problems while checking the merged file, before testing any uploads. I did not record the exact trigger (compile error or reading the code), so I am not quoting an error message.
- **Fix:** replaced the whole file with one correct version that validates the name length and every file before any Firestore write or upload.
- **Check:** `npm run dev` compiled and ran, an invalid batch was blocked with nothing uploaded, and two valid photos uploaded and displayed.

## 8. Privacy: letting visitors delete their photos (Claude)

- **Prompt:** I asked how to make consent withdrawable, since my rules allowed owners to delete photos but the UI had no delete button.
- **AI output:** a `MyPhotos` component listing the visitor's own photos with a delete button, using a query on `ownerUid` (no `orderBy`, to avoid a new index).
- **Check:** a photo deleted from the list disappeared from the TV display in real time. A second anonymous (incognito) session did not see or delete the first visitor's photos. No console errors.
- **Known limit:** deleting removes the Firestore record only, not the Cloudinary file (unsigned uploads cannot delete). It is documented in `ASSUMPTIONS.md`.

## 9. Automated tests (Claude)

- **Prompt:** I asked for small tests that I can explain.
- **AI output:** 7 Vitest tests for `validatePhoto` (JPG, PNG and WebP accepted; GIF, PDF and a file over 10 MB rejected; exactly 10 MB accepted). I checked first that `package.json` had Vitest but no `test` script, and added the script.
- **Result:** `npm test -- --run` showed 7 of 7 passing. Everything else (rules, Cloudinary rejection, timeouts, consent, deletion) is covered by the manual tests listed in `ASSUMPTIONS.md`.
