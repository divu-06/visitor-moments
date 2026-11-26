# Visitor Moments

**Live demo:** https://visitor-moments.vercel.app
**Repository:** https://github.com/divu-06/visitor-moments

## 1. What the app does

Visitor Moments lets visitors share photos in a live slideshow on a TV or computer display.

1. A visitor enters their name, selects photos and ticks a consent box agreeing to public display.
2. As soon as an upload completes, the photo plays next on the shared full-screen slideshow (the **TV Display**), which updates in real time and then continues rotating, showing each photo for 5 seconds.
3. A returning visitor (same browser) sees their earlier photos in "Your uploaded photos", and those photos also keep playing in the slideshow. The visitor can delete any of their photos, and it leaves the slideshow immediately.

## 2. Features

- Visitor identification with Firebase Anonymous Authentication
- Consent checkbox, required for every upload
- Photo upload to Cloudinary with progress, a 60-second timeout and clear error messages
- Real-time slideshow from Cloud Firestore, with previous, next, pause and exit controls
- "Your uploaded photos" list with delete (consent withdrawal)
- Validation: JPG, PNG and WebP only, 10 MB per photo, 10 photos per submission, name up to 50 characters
- Photos are resized on upload to at most 1920 x 1080
- Firestore security rules for ownership, consent and field validation

## 3. Tech stack

| Technology | Purpose |
|---|---|
| React + Vite (JavaScript) | Frontend and build |
| Firebase Anonymous Authentication | Visitor identity |
| Cloud Firestore | Photo records and real-time updates |
| Cloudinary (free tier, unsigned upload) | Image storage and delivery |
| Vitest + React Testing Library | Testing (unit tests for file validation) |
| Vercel | Hosting |

Design, data model and diagrams are in [ARCHITECTURE.md](ARCHITECTURE.md).

## 4. Setup and run

**Prerequisites:** Node.js, npm, Git, a Firebase project and a Cloudinary account.

```bash
git clone https://github.com/divu-06/visitor-moments.git
cd visitor-moments
npm install
```

Copy `.env.example` to `.env.local` and fill in your own values (never commit `.env.local`):

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### Firebase

1. Create a project and register a web app.
2. Enable **Anonymous** sign-in under Authentication.
3. Create a Cloud Firestore database and publish the rules in `firestore.rules`.
4. Create a composite index on the `photos` collection: `consent` ascending, `createdAt` ascending (needed by the slideshow query).
5. For a deployed site, add its domain under Authentication, Settings, Authorized domains.

### Cloudinary

Create an **unsigned** upload preset (this project uses `visitor_moments_unsigned`) with:

- Allowed formats: `jpg, jpeg, png, webp`
- Asset folder: `visitor-moments`
- Overwrite: off; use filename: off
- Incoming transformation: `c_limit,w_1920,h_1080`

### Run

```bash
npm run dev      # development server
npm run build    # production build
npm test -- --run
```

### Deploy

The app is deployed on Vercel from the `main` branch. Add the same `VITE_*` variables in Vercel's Environment Variables **before** building, because Vite reads them at build time.

## 5. How to use

1. Open the app, enter your name, choose photos and tick the consent box, then click **Upload my memories**.
2. Click **TV Display** to open the slideshow. Use the arrow keys or buttons to move between photos, the pause button to hold a photo and Escape or **Exit display** to leave.
3. To remove a photo, use the X on it under **Your uploaded photos**.

## 6. Privacy and security design

- **Returning visitors:** identified by their Firebase anonymous user ID, which stays the same in the same browser.
- **Consent:** required before every upload, stored as `consent: true`, enforced by the Firestore rules and by the slideshow query. Only the visitor's name and photo are shown publicly.
- **Withdrawal:** visitors can delete their own photos. Photos cannot be edited after upload.
- **Validation and limits:** checked in the app, and enforced server-side by the Cloudinary preset (formats, size, dimensions) and the Firestore rules (ownership, fields, name length).
- **Concurrent uploads:** photos from one visitor upload one at a time; different visitors write separate documents.

**Known limitations** (full list in [ASSUMPTIONS.md](ASSUMPTIONS.md)):

- Identity is per browser: clearing site data or switching device creates a new visitor.
- Deleting a photo removes its Firestore record, not the image file in Cloudinary.
- Unsigned upload presets and anonymous accounts can be abused to use up free quotas; there is no moderation or automatic expiry.
- The 10-photos-per-submission limit is client-side only.
- No load testing was done.

## 7. Testing

**Automated:** `npm test -- --run` runs 7 unit tests for `validatePhoto` (JPG, PNG and WebP accepted; GIF, PDF and files over 10 MB rejected; exactly 10 MB accepted).

The full test plan, with steps, expected results and what was not tested, is in [TESTS.md](TESTS.md).

**Manual tests (summary):**

| Test | Result |
|---|---|
| Invalid batch (JPG + GIF) blocked, nothing uploaded | Passed |
| Text file renamed `.jpg` rejected by Cloudinary | Passed |
| 5120x2160 photo stored at 1920x810 | Passed |
| Two photos uploaded together and shown on the TV Display | Passed |
| New upload plays next on an open TV Display; initial photos and deletions do not trigger jumps; each slide gets a full 5 seconds | Passed |
| Offline upload shows an error after about 15 seconds and the form recovers | Passed |
| Forced upload timeout shows "Upload timed out" | Passed |
| Visitor deletes own photo and it leaves the TV Display in real time | Passed |
| A second anonymous session does not see or get delete controls for another visitor's photos | Passed |
| Deployed site: upload, TV Display and delete on https://visitor-moments.vercel.app | Passed |

## 8. Project documents

| File | Contents |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack choices, data model, diagrams |
| [ASSUMPTIONS.md](ASSUMPTIONS.md) | Every gap filled, limits and test evidence |
| [AI_LOG.md](AI_LOG.md) | AI interactions, mistakes and fixes |
| [TESTS.md](TESTS.md) | Automated tests and the manual test plan with results |
| [firestore.rules](firestore.rules) | Firestore security rules |
| [.env.example](.env.example) | Environment variable placeholders |
