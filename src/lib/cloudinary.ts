import axios from 'axios';

// Using the keys you provided!
const CLOUD_NAME = "blhhrgfl";
const UPLOAD_PRESET = "9jakonet_uploads";

export const uploadToCloudinary = async (fileOrDataUrl: File | Blob | string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', fileOrDataUrl);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    // Returns the secure public URL from Cloudinary
    return response.data.secure_url;
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error?.response?.data || error);
    throw new Error('Failed to upload image to Cloudinary. Please try again.');
  }
};
