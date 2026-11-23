
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { uploadPhoto } from './cloudinary';

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

  if (!files.length) {
    throw new Error('Please select at least one photo.');
  }

  // Save visitor information.
  await setDoc(
    doc(db, 'visitors', visitorId),
    {
      visitorName,
      lastVisitAt: serverTimestamp()
    },
    { merge: true }
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

    const photoRef = await addDoc(
      collection(db, 'photos'),
      photoData
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
