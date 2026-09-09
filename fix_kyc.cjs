const fs = require('fs');
let code = fs.readFileSync('src/pages/VerificationKYC.tsx', 'utf-8');

// Add import for Cloudinary
if (!code.includes("uploadToCloudinary")) {
  code = code.replace("import { compressImageFile, compressDataUrl } from '../lib/imageCompressor';", "import { compressImageFile, compressDataUrl } from '../lib/imageCompressor';\nimport { uploadToCloudinary } from '../lib/cloudinary';");
}

// Replace the submit logic
const submitLogicRegex = /const compressedDoc = await compressDataUrl\(docPhotoUrl, \{ maxDimension: 850, quality: 0\.72 \}\);\s+const compressedSelfie = await compressDataUrl\(selfiePhotoUrl, \{ maxDimension: 850, quality: 0\.72 \}\);/;

const newSubmitLogic = `const compressedDoc = await compressDataUrl(docPhotoUrl, { maxDimension: 850, quality: 0.72 });
      const compressedSelfie = await compressDataUrl(selfiePhotoUrl, { maxDimension: 850, quality: 0.72 });

      // UPLOAD IMAGES TO CLOUDINARY INSTEAD OF FIREBASE
      let finalDocUrl = compressedDoc;
      let finalSelfieUrl = compressedSelfie;
      try {
        finalDocUrl = await uploadToCloudinary(compressedDoc);
        finalSelfieUrl = await uploadToCloudinary(compressedSelfie);
      } catch (uploadError) {
        console.error("Cloudinary upload failed, falling back to compressed base64:", uploadError);
        // It will just fallback to the compressed base64 if Cloudinary fails for some reason
      }`;

if (submitLogicRegex.test(code)) {
  code = code.replace(submitLogicRegex, newSubmitLogic);
  
  // Replace the data assignment
  const dataAssignmentRegex = /documentPhotoUrl: compressedDoc,\s+selfiePhotoUrl: compressedSelfie,/;
  const newDataAssignment = `documentPhotoUrl: finalDocUrl,
        selfiePhotoUrl: finalSelfieUrl,`;
  
  code = code.replace(dataAssignmentRegex, newDataAssignment);
  
  fs.writeFileSync('src/pages/VerificationKYC.tsx', code);
  console.log("Updated VerificationKYC.tsx to use Cloudinary!");
} else {
  console.log("Could not find submit logic to replace in KYC.");
}
