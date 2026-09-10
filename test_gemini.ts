import { GoogleGenAI } from '@google/genai';
async function test() {
  const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
  });
  
  try {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-pro-preview'];
    let reply = null;
    for (const model of candidateModels) {
        console.log("Trying model:", model);
        const result = await ai.models.generateContent({
            model: model,
            contents: "Hi"
        });
        console.log("Result:", result.text);
    }
  } catch(e) {
    console.error("ERROR", e);
  }
}
test();
