const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  try {
    await sharp('public/9jakonet_logo.svg')
      .resize(2048, 2048)
      .png()
      .toFile('public/9jakonet_official_logo.png');
    console.log("High-res PNG generated successfully.");
  } catch (error) {
    console.error("Error generating PNG:", error);
  }
}

convert();
