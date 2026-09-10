import { GoogleGenAI } from '@google/genai';
async function test() {
  const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
  });
  try {
    const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: "Hi"
    });
    console.log("Result:", result.text);
  } catch(e) {
    console.error("ERROR", e.message);
  }
}
test();
