import { GoogleGenerativeAI } from "@google/generative-ai";

const api_key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(api_key ?? "");

const generationConfig = {
  temperature: 0.4,
  topP: 1,
  topK: 32,
  maxOutputTokens: 4096
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig
});

export async function generateNumericValue(
  imageBase64: string
): Promise<number | null> {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract the numeric value from this image:\n" },
            {
              inlineData: {
                mimeType: "image/jpg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
              }
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const numericMatch = text.match(/(\d+(\.\d+)?)/);

    if (numericMatch) {
      return parseFloat(numericMatch[0]);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error generating description:", error);
    return null;
  }
}
