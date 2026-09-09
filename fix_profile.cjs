const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');

// Add import for Cloudinary
if (!code.includes("uploadToCloudinary")) {
  code = code.replace("import { compressImageFile } from '../lib/imageCompressor';", "import { compressImageFile } from '../lib/imageCompressor';\nimport { uploadToCloudinary } from '../lib/cloudinary';");
}

const photoSelectRegex = /const compressed = await compressImageFile\(file, \{ maxDimension: 400, quality: 0\.8 \}\);\s+setAvatarUrl\(compressed\);/m;

const newPhotoSelect = `const compressed = await compressImageFile(file, { maxDimension: 400, quality: 0.8 });
      // Upload to Cloudinary instead of storing Base64 directly!
      const cloudinaryUrl = await uploadToCloudinary(compressed);
      setAvatarUrl(cloudinaryUrl);
      const finalAvatarUrl = cloudinaryUrl;`;

if (photoSelectRegex.test(code)) {
  code = code.replace(photoSelectRegex, newPhotoSelect);
  
  // Also need to replace the Firestore document update to use the Cloudinary URL
  const firestoreUpdateRegex = /avatar: compressed/m;
  code = code.replace(firestoreUpdateRegex, "avatar: finalAvatarUrl");
  
  const setUserRegex = /\.\.\.user, avatar: compressed/m;
  code = code.replace(setUserRegex, "...user, avatar: finalAvatarUrl");
  
  fs.writeFileSync('src/pages/Profile.tsx', code);
  console.log("Updated Profile.tsx to use Cloudinary!");
} else {
  console.log("Could not find photo logic to replace in Profile.");
}
