import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI conditionally using OpenRouter (to mock standard OpenAI format)
const apiKey = process.env.OPENAI_API_KEY || "API_KEY_PLACEHOLDER";
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://openrouter.ai/api/v1", // Route to OpenRouter for ease of testing right now
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "Tax Estimator App",
  }
});

app.post('/api/extract-tax-doc', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { docType } = req.body; // 'w2' or '1099'
    
    // Read the uploaded file and convert to base64
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Build the prompt depending on doc type
    let promptInstruction = "";
    if (docType === 'w2') {
      promptInstruction = `Extract the tax data from this W-2 form. Return ONLY a valid JSON object matching this exact shape, using numerical values (no commas or dollar signs in the numbers):
      {
        "docType": "w2",
        "wages": 0, // Box 1
        "federalTax": 0, // Box 2 
        "socialSecurity": 0, // Box 4
        "medicare": 0, // Box 6
        "stateTax": 0 // Box 17
      }`;
    } else {
       promptInstruction = `Extract the tax data from this 1099 form (NEC or MISC). Return ONLY a valid JSON object matching this exact shape, using numerical values (no commas or dollar signs in the numbers):
      {
        "docType": "1099",
        "income": 0, // Box 1 usually, Nonemployee compensation or Rents
        "expenses": 0 // Often unknown from just 1099, default to 0 unless clear
      }`;
    }

    console.log(`Sending ${docType} to Vision LLM...`);

    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash", // Fast, highly capable cheap vision model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptInstruction },
            {
              type: "image_url",
              image_url: {
                url: \`data:\${mimeType};base64,\${base64Image}\`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const outputText = response.choices[0]?.message?.content || "{}";
    const extractedData = JSON.parse(outputText);
    
    // Clean up uploaded file locally
    fs.unlinkSync(req.file.path);

    console.log("Extraction complete: ", extractedData);
    res.json(extractedData);

  } catch (error: any) {
    console.error("Extraction error:", error);
    // Cleanup on error
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to extract document data', message: error.message });
  }
});

app.listen(port, () => {
  console.log(\`Tax Document API Server running at http://localhost:\${port}\`);
});
