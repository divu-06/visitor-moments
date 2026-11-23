
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadPhoto(file, onProgress) {
  const MAX_SIZE = 10 * 1024 * 1024;

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG and WebP images are allowed.');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('Photo size must not exceed 10 MB.');
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'visitor-moments');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);

          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format
          });
        } catch {
          reject(new Error('Invalid upload response.'));
        }
      } else {
        reject(new Error('Cloudinary upload failed.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during photo upload.'));
    };

    xhr.send(formData);
  });
}
