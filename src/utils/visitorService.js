
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

import { uploadPhoto, validatePhoto } from './cloudinary';
import { db } from '../firebase/firebase';


function withTimeout(promise, ms, message) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([promise, timeout])
    .finally(() => clearTimeout(timer));
}

export async function registerVisitor({
  user,
  name,
  files,
  onProgress
}) {
  if (!user) {
    throw new Error('Visitor session not available.');
  }

  const visitorId = user.uid;
  const visitorName = name.trim();

  if (!visitorName) {
    throw new Error('Please enter your name.');
  }

  if (visitorName.length > 50) {
    throw new Error('Name cannot exceed 50 characters.');
  }

  if (!files || files.length === 0) {
    throw new Error('Please select at least one photo.');
  }

  // Validate every file before any database writes or uploads.
  files.forEach(validatePhoto);

  // Save visitor information.
  await withTimeout(
  setDoc(
    doc(db, 'visitors', visitorId),
    {
      visitorName,
      lastVisitAt: serverTimestamp()
    },
    { merge: true }
  ),
  15000,
  'Could not reach the server. Check your connection and try again.'
);

  const uploadedPhotos = [];

  // Upload sequentially to avoid excessive simultaneous uploads.
  for (let index = 0; index < files.length; index++) {
    const uploaded = await uploadPhoto(files[index]);

    const photoData = {
      ownerUid: visitorId,
      visitorName,
      imageUrl: uploaded.imageUrl,
      publicId: uploaded.publicId,
      consent: true,
      createdAt: serverTimestamp()
    };

    const photoRef = await withTimeout(
  addDoc(collection(db, 'photos'), photoData),
  15000,
  'Could not save the photo. Check your connection and try again.'
);

    uploadedPhotos.push({
      id: photoRef.id,
      ...uploaded,
      visitorName
    });

    onProgress?.(
      Math.round(((index + 1) / files.length) * 100)
    );
  }

  return {
    visitorId,
    uploadedPhotos
  };
}
