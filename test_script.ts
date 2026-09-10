import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Tell me about 9jaKonet.'
    });
    console.log("Success:", res.text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
