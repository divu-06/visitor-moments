# ASSUMPTIONS.md

Every gap in the assignment that I filled, with the option I chose and why. Limits and test results were checked on 24 Nov 2026.

## 1. Returning visitor identification

- **Choice:** Firebase Anonymous Authentication. Each browser gets a stable anonymous user ID (UID). The UID is the document ID in `visitors/{uid}` and is stored as `ownerUid` on every photo.
- **Why:** no sign-up form or password for visitors, and the UID can be trusted in the Firestore rules (`request.auth.uid`), unlike a typed name.
- **Limitation:** identity is per browser. Clearing site data, using a private window or switching device creates a new visitor. The name is only a display label, not an identity, so two visitors can use the same name.
- **Alternative rejected:** matching on name or email. Names are not unique and anyone could claim someone else's photos.

## 2. Slideshow behaviour

- **Choice:** the TV Display plays all consented photos in one shared slideshow, oldest first, looping, 5 seconds per photo (`SLIDE_DURATION` in `Slideshow.jsx`). It listens with Firestore `onSnapshot`, so a new upload appears without a refresh.
- **New photos play next:** when a new photo arrives while the TV Display is open, the slideshow jumps to it straight away and then continues the normal rotation. Photos already present when the display opens are not treated as new. A visitor's batch arrives one photo at a time, so the display moves to each as it arrives and ends on the last. If the display is paused, it shows the new photo and stays paused. Deleting a photo does not move the slideshow. Each newly displayed photo gets a full 5 seconds before the next automatic advance, and manual Next and Previous also restart the timer.
- **Returning visitors:** their earlier photos are already in the shared slideshow, so they play again together with the new ones. There is no separate private playback.
- **Display device:** any browser can open the TV Display from the app (full-screen is up to the browser). There is no separate admin or display login.
- **Caption:** only the visitor's name and the photo are shown.

## 3. Privacy and consent

- **Choice:** an unchecked-by-default checkbox states that the photos may be displayed publicly and that the visitor has permission to share them. Submitting is blocked without it, and it resets after every successful upload, so each new batch needs fresh consent.
- **Enforcement:** the record stores `consent: true`. Firestore rules refuse to create a photo without it, and only let a signed-in user read a photo that has consent or that they own. The slideshow query also filters on `consent == true`.
- **Withdrawal:** a visitor can see their own photos under "Your uploaded photos" and delete any of them. The photo leaves the slideshow in real time. Photo records cannot be edited after creation.
- **Data shown publicly:** photo and visitor name. No email or other personal data is collected.
- **Limitation:** deleting removes the Firestore record only. The image file stays in Cloudinary, and anyone who already has its URL can still open it. Unsigned uploads cannot delete files, and deleting properly would need a backend. I did not add one because it is outside the chosen stack and time.
- **Limitation:** the preset stores the original filename as the asset display name in Cloudinary (visible only in the Cloudinary console, not in the public URL).
- **Limitation:** consent cannot be proven that the person in a photo agreed. The checkbox is the visitor's own confirmation.
- **Retention:** photos stay until the visitor deletes them. There is no automatic expiry.

## 4. File validation and size limits

| Rule | Value | Enforced by |
|---|---|---|
| Formats | JPG, PNG, WebP | App (`validatePhoto`, form) and Cloudinary preset allowed formats |
| Max size | 10 MB per photo | App; Cloudinary account limit is also 10 MB |
| Max dimensions at storage | 1920 x 1080 (aspect ratio kept) | Cloudinary incoming transformation `c_limit,w_1920,h_1080` |
| Max count | 10 photos per submission | App form |
| Name | 1 to 50 characters | Form, `registerVisitor` and Firestore rules |
| Cloudinary account limits (Free plan) | 10 MB per image, 25 MP per image | Cloudinary |

- HEIC photos (iPhone default in some settings) are rejected. This is a known limitation.
- A file that fakes its extension (for example a text file renamed `.jpg`) passes the browser check, but Cloudinary rejects it server-side.
- The client checks are a convenience. The real enforcement is the Cloudinary preset and the Firestore rules, because anyone can call the upload endpoint directly.
- Whether Cloudinary counts 10 MB as 10,000,000 or 10,485,760 bytes was not checked. The app accepts exactly 10 x 1024 x 1024 bytes.

## 5. Multiple people uploading at once

- **Within one visitor:** photos upload one at a time, not in parallel, to keep load and failures simple. All files are validated before the first upload starts, so an invalid file stops the batch before anything is saved.
- **Between visitors:** each visitor writes their own documents, so visitors do not conflict. Firestore orders photos by a server timestamp, and every open display updates in real time.
- **Timeouts:** the Cloudinary upload stops after 60 seconds. Firestore writes stop waiting after 15 seconds. Both show an error and let the visitor retry without refreshing.
- **Not tested:** heavy load with many simultaneous visitors. Only multi-photo uploads and separate browser sessions were tested manually.
- **Edge case:** Firestore may keep an offline write queued and send it when the connection returns. A visitor who saw an error and retried could then get a duplicate photo.

## 6. Security model and its limits

- **Firestore rules** (in `firestore.rules`): a visitor can only read and write their own `visitors` document; photos are created only by their owner, with an allow-list of fields, a name length limit, a server timestamp and a Cloudinary URL check for this account; photos cannot be updated; only the owner can delete a photo.
- **Anonymous auth is not a trust boundary.** Anyone who opens the site gets a UID, so rules cannot stop someone from uploading many photos. A Cloudinary unsigned preset can also be used by anyone who knows the cloud name and preset (both are visible in the built app), which could use up the free quota. A signed upload needs a backend, which is out of scope.
- **No moderation:** uploaded images are not reviewed before display, and there is no per-visitor cap across several submissions.
- **A failed upload can still update the visitor record** (`lastVisitAt`), because the visitor document is saved before the first upload. No photo is created.
- **Secrets:** `.env.local` is git-ignored. `.env.example` holds placeholders only. Firebase web config values are not secret by themselves; access is controlled by the rules above.

## 7. Technology choices

React + Vite, Firebase Anonymous Auth and Firestore, Cloudinary (free tier, unsigned upload), Vercel for deployment. Cloudinary stores the images because the free tier avoids a paid storage plan, and Firestore gives real-time updates for the slideshow. Details are in `ARCHITECTURE.md`.

## 8. Test evidence (summary)

- Automated: 7 Vitest tests for `validatePhoto` pass (JPG, PNG, WebP accepted; GIF, PDF and a file over 10 MB rejected; exactly 10 MB accepted).
- Manual (24 Nov 2026): invalid batch blocked with nothing uploaded; renamed `.txt` as `.jpg` rejected by Cloudinary; large image (5120x2160) stored as 1920x810; two photos uploaded together and displayed; offline upload shows an error after about 15 seconds and the form recovers; forced 1 ms upload timeout shows "Upload timed out"; client `folder` parameter removed and uploads still land in `visitor-moments`; a visitor can delete their own photo and it leaves the TV display in real time; a second anonymous session cannot see or delete another visitor's photos.
- The full test plan and results are in `TESTS.md`, and a summary is in section 7 of `README.md`.
