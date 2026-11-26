# TESTS.md

Test plan and results for Visitor Moments. Manual tests were run between 24 and 25 Nov 2026, locally (`npm run dev`) and on the deployed app (https://visitor-moments.vercel.app).

## 1. Automated tests

Run with:

```bash
npm test -- --run
```

File: `src/utils/cloudinary.test.js` (Vitest). Result: **7 of 7 passing**, and `npm run build` succeeds.

| # | Test | Result |
|---|---|---|
| A1 | `validatePhoto` accepts a JPG | Pass |
| A2 | `validatePhoto` accepts a PNG | Pass |
| A3 | `validatePhoto` accepts a WebP | Pass |
| A4 | `validatePhoto` rejects a GIF | Pass |
| A5 | `validatePhoto` rejects a PDF | Pass |
| A6 | `validatePhoto` rejects a file over 10 MB | Pass |
| A7 | `validatePhoto` accepts a file of exactly 10 MB | Pass |

The automated tests cover only the client-side file check. Everything else is covered by the manual plan below.

## 2. Manual test plan and results

### Upload, validation and limits

| # | Steps | Expected | Result |
|---|---|---|---|
| M1 | Select one JPG and one GIF together | The form shows the "Only JPG, PNG and WebP photos up to 10 MB" message; nothing is uploaded | Pass. No new asset in Cloudinary and no new document in Firestore |
| M2 | Rename a text file to `fake.jpg` and upload it | Browser check passes, Cloudinary rejects it | Pass. Message: "Raw file format jpg not allowed"; nothing saved |
| M3 | Upload a 5120 x 2160 photo | Stored at no more than 1920 x 1080, aspect ratio kept | Pass. Stored as 1920 x 810 |
| M4 | Upload two valid photos together | Both upload and appear on the TV Display (with the stricter Firestore rules published) | Pass |
| M5 | Remove the client-sent `folder` parameter and upload one photo | The photo still lands in the `visitor-moments` folder (set by the preset) | Pass. The parameter stays removed |
| M6 | Check the Cloudinary account limits | Image limit documented | Done. Free plan: 10 MB and 25 MP per image (checked 24 Nov 2026) |

### Failure handling

| # | Steps | Expected | Result |
|---|---|---|---|
| M7 | Go offline (DevTools), submit one photo | An error appears and the form recovers | First run **failed**: the form hung at "Uploading... 0%" because Firestore queues offline writes. Fixed with a 15-second timeout around the Firestore writes. After the fix: **Pass**. "Could not reach the server. Check your connection and try again." after about 15 seconds, and the button became clickable again |
| M8 | Set the upload timeout to 1 ms temporarily and upload | "Upload timed out. Please try again." and the form recovers | Pass. The 60-second timeout was restored afterwards |

### Privacy, consent and deletion

| # | Steps | Expected | Result |
|---|---|---|---|
| M9 | Look at "Your uploaded photos" after uploading | The visitor's own photos are listed | Pass |
| M10 | Delete one of your photos while the TV Display is open | The photo leaves the TV Display in real time | Pass |
| M11 | Open the app in an incognito window (new anonymous session) | It does not show the first session's photos in "Your uploaded photos" | Pass |
| M12 | Open the app after Firestore rules were published, upload and delete | Uploads, display and own-photo deletion still work | Pass |

### Slideshow behaviour

| # | Steps | Expected | Result |
|---|---|---|---|
| M13 | Open the TV Display | Starts normally with no jump caused by existing photos | Pass |
| M14 | Upload a photo while the TV Display is open | The slideshow jumps to the new photo, then continues rotating | Pass |
| M15 | Upload three photos together | It ends on the last one, then rotates normally | Pass |
| M16 | Delete a photo while the slideshow runs | No jump; rotation continues | Pass |
| M17 | Pause, upload a photo, then resume | The new photo shows and the slideshow stays paused until resumed | Pass |
| M18 | Delete all photos, press the arrow keys, then upload one | "No memories yet" with no crash; the new photo appears | Pass |
| M19 | After the timer fix, wait about 3 seconds, upload a photo; also press Next and Previous | Each photo stays for a full 5 seconds | Pass. The timer restarts whenever the photo changes |
| M20 | Upload one photo, then two photos | Message reads "1 photo uploaded successfully!" / "2 photos uploaded successfully!" with no visitor ID | Pass |

### Deployed app

| # | Steps | Expected | Result |
|---|---|---|---|
| M21 | On https://visitor-moments.vercel.app: upload, open the TV Display, delete the photo | All work; Firebase and Cloudinary connect with the Vercel environment variables | Pass |
| M22 | Open the deployed app on a second device | Photos are shared across browsers and devices | Pass |
| M23 | Open the public repository in a private window while logged out | Repository and files are visible without login | Pass |

## 3. Not tested

These are limits of the testing, not claims of success:

- **Load:** no test with many visitors uploading at the same time. Only multi-photo uploads and separate browser sessions were tried.
- **Rules Playground:** a direct attempt to update or delete another visitor's photo was not simulated. The rules block it, and the app never shows another visitor's photos with a delete button, but a denied request was not recorded.
- **Direct calls to Cloudinary or Firestore** outside the app (for example with `curl`) were not tried. Server-side enforcement was shown through the renamed-file test (M2).
- **HEIC photos and images over 25 MP** were not tried. HEIC is rejected by design.
- **The 10-photos-per-submission limit** is client-side only, and no test tried to bypass it.
