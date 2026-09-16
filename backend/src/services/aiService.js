require("dotenv").config();

const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeImage = async (imagePath, mimeType) => {
  try {
    const image = fs.readFileSync(imagePath);
    const base64Image = image.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze this personal memory photo.

Return JSON only:
{
  "description": "short description of the photo",
  "category": "Personal, Travel, Family, Friends, Event, Nature, Food, or Other",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const result = JSON.parse(response.output_text);

    return {
      description: result.description || "Memory photo",
      category: result.category || "Other",
      tags: Array.isArray(result.tags) ? result.tags : [],
    };
  } catch (error) {
    console.error("AI analysis error:", error);

    throw new Error("AI image analysis failed");
  }
};

module.exports = {
  analyzeImage,
};