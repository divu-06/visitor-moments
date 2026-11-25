import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import './Slideshow.css';

const SLIDE_DURATION = 5000;

function Slideshow({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasReceivedInitialSnapshot = useRef(false);

  useEffect(() => {
    const photosQuery = query(
      collection(db, 'photos'),
      where('consent', '==', true),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
  const newPhotos = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));

  // Ignore existing photos in the initial snapshot.
  if (hasReceivedInitialSnapshot.current) {
    const addedPhotos = snapshot.docChanges().filter(
      (change) => change.type === 'added'
    );

    // Move to the latest newly added photo.
    if (addedPhotos.length > 0) {
      const latestAddedPhoto = addedPhotos[addedPhotos.length - 1];

      const latestAddedIndex = newPhotos.findIndex(
        (photo) => photo.id === latestAddedPhoto.doc.id
      );

      if (latestAddedIndex !== -1) {
        setCurrentIndex(latestAddedIndex);
      }
    }
  }

  hasReceivedInitialSnapshot.current = true;

  setPhotos(newPhotos);
  setLoading(false);
  setError('');
},
      (err) => {
        console.error('Slideshow error:', err);
        setError('Unable to load photographs.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Automatically advance 5 seconds after the current photo appears.
  useEffect(() => {
    if (paused || photos.length <= 1) return;

    const timer = setTimeout(() => {
      setCurrentIndex((previous) => (previous + 1) % photos.length);
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [paused, photos.length, currentIndex]);

  useEffect(() => {
    if (currentIndex >= photos.length) {
      setCurrentIndex(0);
    }
  }, [photos.length, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') nextPhoto();
      if (event.key === 'ArrowLeft') previousPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  const nextPhoto = () => {
  if (photos.length === 0) return;

  setCurrentIndex((previous) => (previous + 1) % photos.length);
};

  const previousPhoto = () => {
  if (photos.length === 0) return;

  setCurrentIndex(
    (previous) => (previous - 1 + photos.length) % photos.length
  );
};

  const currentPhoto = photos[currentIndex];

  return (
    <div className="slideshow-screen">
      <header className="slideshow-header">
        <div className="slideshow-brand">
          <span className="slideshow-dot" />
          VISITOR MOMENTS
        </div>

        <button className="slideshow-control" onClick={onClose}>
          <X size={19} /> Exit display
        </button>
      </header>

      <main className="slideshow-main">
        {loading ? (
          <div className="slideshow-empty">Loading memories...</div>
        ) : error ? (
          <div className="slideshow-empty">{error}</div>
        ) : photos.length === 0 ? (
          <div className="slideshow-empty">
            <h2>No memories yet</h2>
            <p>Uploaded visitor photographs will appear here.</p>
          </div>
        ) : (
          <>
            <div className="slide-photo-container">
              <img
                key={currentPhoto.id}
                className="slide-photo"
                src={currentPhoto.imageUrl}
                alt={`Photo shared by ${currentPhoto.visitorName}`}
              />
            </div>

            <div className="slide-caption">
              <span>SHARED BY</span>
              <h2>{currentPhoto.visitorName}</h2>
              <p>
                Memory {currentIndex + 1} of {photos.length}
              </p>
            </div>
          </>
        )}
      </main>

      <footer className="slideshow-footer">
        <div className="slide-counter">
          {photos.length > 0
            ? `${String(currentIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`
            : '00 / 00'}
        </div>

        <div className="slide-controls">
          <button
            onClick={previousPhoto}
            disabled={photos.length <= 1}
            aria-label="Previous photo"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() => setPaused(!paused)}
            disabled={photos.length === 0}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play /> : <Pause />}
          </button>

          <button
            onClick={nextPhoto}
            disabled={photos.length <= 1}
            aria-label="Next photo"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="slideshow-status">
          {paused ? 'PAUSED' : 'AUTOMATIC SLIDESHOW'}
        </div>
      </footer>
    </div>
  );
}

export default Slideshow;
