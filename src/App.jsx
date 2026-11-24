import { useEffect, useState } from 'react';
import { initializeVisitorSession } from './firebase/firebase';
import { registerVisitor } from './utils/visitorService';
import Slideshow from './pages/Slideshow';
import MyPhotos from './components/MyPhotos';
import {
  Camera,
  ImagePlus,
  Upload,
  Users,
  MonitorPlay,
  ShieldCheck,
  X,
  Sparkles,
  Heart,
  ArrowRight
} from 'lucide-react';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [files, setFiles] = useState([]);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [uid, setUid] = useState(null);

  const previews = files.map((file) => ({
    file,
    url: URL.createObjectURL(file)
  }));

  useEffect(() => {
  initializeVisitorSession()
    .then((user) => {
      console.log('Firebase connected successfully!');
      console.log('Visitor session ID:', user.uid);
      setUid(user.uid);
    })
    .catch((error) => {
      console.error('Firebase connection failed:', error);
    });
}, []);

  useEffect(() => {
    return () => previews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (files.length + selected.length > 10) {
      setMessage('You can select a maximum of 10 photos.');
      event.target.value = '';
      return;
    }

    const invalid = selected.find(
      (file) => !validTypes.includes(file.type) || file.size > 10 * 1024 * 1024
    );

    if (invalid) {
      setMessage('Only JPG, PNG and WebP photos up to 10 MB are allowed.');
      event.target.value = '';
      return;
    }

    setFiles((previous) => [...previous, ...selected]);
    setMessage('');
    event.target.value = '';
  };

  const removePhoto = (index) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };

  
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!name.trim()) {
    setMessage('Please enter your name.');
    return;
  }

  if (files.length === 0) {
    setMessage('Please select at least one photo.');
    return;
  }

  if (!consent) {
    setMessage('Please provide consent before continuing.');
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);
  setMessage('Preparing your upload...');

  try {
    const user = await initializeVisitorSession();

    const result = await registerVisitor({
      user,
      name,
      files,
      onProgress: setUploadProgress
    });

    setMessage(
      `Success! ${result.uploadedPhotos.length} photos uploaded. Your visitor ID is ${result.visitorId}.`
    );

    setFiles([]);
    setName('');
    setConsent(false);

  } catch (error) {
    console.error('Upload error:', error);
    setMessage(error.message || 'Something went wrong. Please try again.');
  } finally {
    setIsUploading(false);
  }
};

if (showSlideshow) {
  return (
    <Slideshow onClose={() => setShowSlideshow(false)} />
  );
}

  return (
    <div className="app">
      <header className="navbar">
        <a href="#" className="brand">
          <div className="brand-icon"><Camera size={22} /></div>
          <span>Visitor<span className="brand-highlight">Moments</span></span>
        </a>

        <div className="nav-right">
          <span className="live-indicator"><span /> Display ready</span>
          <button
          className="display-btn"
          onClick={() => setShowSlideshow(true)}
          >
          <MonitorPlay size={17} /> TV Display
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} /> EVERY VISIT HAS A STORY
            </div>

            <h1>
              Your moments.<br />
              Our <span>memories.</span>
            </h1>

            <p>
              Share your favourite photos and let your memories
              become part of our beautiful visitor slideshow.
            </p>

            <div className="hero-stats">
              <div>
                <Users size={19} />
                <span>Every visitor matters</span>
              </div>
              <div>
                <Heart size={19} />
                <span>Memories that stay</span>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-card art-back">
              <div className="art-placeholder">✦</div>
            </div>
            <div className="art-card art-front">
              <div className="art-photo">
                <Camera size={38} />
                <span>Beautiful moments</span>
              </div>
            </div>
            <div className="floating-star">✳</div>
          </div>
        </section>

        <section className="upload-section">
          <div className="section-heading">
            <div>
              <span className="section-label">GET STARTED</span>
              <h2>Share your moments</h2>
              <p>It only takes a minute to add your memories.</p>
            </div>
            <div className="step-indicator">01 <span>/ 03</span></div>
          </div>

          <form className="upload-card" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="visitorName">Your name</label>
              <input
                id="visitorName"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>Your photographs</label>
                <span className="file-limit">Maximum 10 photos · 10 MB each</span>
              </div>

              <label className="drop-zone" htmlFor="photoUpload">
                <div className="upload-icon"><ImagePlus size={27} /></div>
                <strong>Click to select your photos</strong>
                <span>JPG, PNG or WebP</span>
                <div className="browse-btn">
                  <Upload size={16} /> Browse photos
                </div>
              </label>

              <input
                id="photoUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFiles}
              />

              {previews.length > 0 && (
                <div className="preview-grid">
                  {previews.map((item, index) => (
                    <div className="preview-item" key={item.url}>
                      <img src={item.url} alt={`Selected photo ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label="Remove photo"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="selected-count">
                {files.length} of 10 photos selected
              </div>
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I agree that my selected photos may be displayed publicly
                on the visitor slideshow. I confirm that I have permission
                to share these photos.
              </span>
            </label>

            {message && <div className="message">{message}</div>}

            <button 
            type="submit"
            className="submit-btn"
            disabled={isUploading}
            >
            {isUploading
            ? `Uploading... ${uploadProgress}%`
            : 'Upload my memories'}
            {!isUploading && <ArrowRight size={18} />}
            </button>
            
            {isUploading && (
            <div className="upload-progress">
            <div
            className="upload-progress-fill"
            style={{ width: `${uploadProgress}%` }}
            />
            </div>
            )}
            
            <div className="privacy-note">
              <ShieldCheck size={16} />
              Your photos are handled with care and consent.
            </div>
          </form>
          {uid && <MyPhotos uid={uid} />}
        </section>

        <section className="bottom-info">
          <div><Camera size={20} /><span>Share your photographs</span></div>
          <div><Heart size={20} /><span>Keep your memories alive</span></div>
          <div><MonitorPlay size={20} /><span>Watch them on the big screen</span></div>
        </section>
      </main>

      <footer>
        <span>© 2026 Visitor Moments</span>
        <span>Made for memories <Heart size={13} /></span>
      </footer>
    </div>
  );
}

export default App;
