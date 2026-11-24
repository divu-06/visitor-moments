const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// Validate photo before uploading.
export function validatePhoto(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `"${file.name}": only JPG, PNG and WebP images are allowed.`
    );
  }

  if (file.size > MAX_SIZE) {
    throw new Error(
      `"${file.name}": photo size must not exceed 10 MB.`
    );
  }
}

// Upload photo to Cloudinary.
export async function uploadPhoto(file, onProgress) {
  // Validate the individual file as an additional safeguard.
  validatePhoto(file);

  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  //formData.append('folder', 'visitor-moments');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    );

    // Upload progress.
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(
          Math.round((event.loaded / event.total) * 100)
        );
      }
    };

    // Handle upload response.
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
        let reason = 'Cloudinary upload failed.';

        try {
          reason =
            JSON.parse(xhr.responseText).error.message || reason;
        } catch {
          // Keep the default error message.
        }

        reject(new Error(reason));
      }
    };

    // Handle network errors.
    xhr.onerror = () => {
      reject(new Error('Network error during photo upload.'));
    };

    // Handle timeout.
    xhr.timeout = 60000;

    xhr.ontimeout = () => {
      reject(
        new Error('Upload timed out. Please try again.')
      );
    };

    // Start upload.
    xhr.send(formData);
  });
}
