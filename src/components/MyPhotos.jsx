import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { X } from 'lucide-react';
import { db } from '../firebase/firebase';

function MyPhotos({ uid }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;

    const photosQuery = query(
      collection(db, 'photos'),
      where('ownerUid', '==', uid)
    );

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        setPhotos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('My photos error:', err);
        setError('Unable to load your photos.');
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleDelete = async (photoId) => {
    if (!window.confirm('Remove this photo from the slideshow?')) return;
    try {
      await deleteDoc(doc(db, 'photos', photoId));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Could not remove the photo. Please try again.');
    }
  };

  if (error) return <div className="message">{error}</div>;
  if (photos.length === 0) return null;

  return (
    <div className="upload-card">
      <div className="field-group">
        <label>Your uploaded photos</label>
        <div className="preview-grid">
          {photos.map((photo) => (
            <div className="preview-item" key={photo.id}>
              <img src={photo.imageUrl} alt="Your uploaded photo" />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                aria-label="Remove photo from slideshow"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyPhotos;