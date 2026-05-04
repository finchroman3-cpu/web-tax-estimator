import fs from 'fs/promises'
import formidable from 'formidable'
import { OpenAI } from 'openai'

export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function parseForm(req: any) {
  const form = formidable({ multiples: false, keepExtensions: true })
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function buildPrompt(docType: string) {
  if (docType === 'w2') {
    return `Extract the tax data from this W-2 form. Return ONLY a valid JSON object matching this exact shape, using numerical values (no commas or dollar signs in the numbers):
{
  "docType": "w2",
  "wages": 0,
  "federalTax": 0,
  "socialSecurity": 0,
  "medicare": 0,
  "stateTax": 0,
  "overtimePay": 0,
  "tips": 0
}`
  }

  return `Extract the tax data from this 1099 form (NEC or MISC). Return ONLY a valid JSON object matching this exact shape, using numerical values (no commas or dollar signs in the numbers):
{
  "docType": "1099",
  "income": 0,
  "expenses": 0
}`
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let uploadedFile: formidable.File | undefined

  try {
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY on the server' })
      return
    }

    const { fields, files } = await parseForm(req)
    const candidate = files.document ?? files.file
    uploadedFile = Array.isArray(candidate) ? candidate[0] : candidate

    if (!uploadedFile) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const docType = firstValue(fields.docType) || 'w2'
    const fileBuffer = await fs.readFile(uploadedFile.filepath)
    const base64Image = fileBuffer.toString('base64')
    const mimeType = uploadedFile.mimetype || 'image/png'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(docType) },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    })

    const outputText = response.choices[0]?.message?.content || '{}'
    res.status(200).json(JSON.parse(outputText))
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to extract document data',
      message: error?.message || 'Unknown error',
    })
  } finally {
    if (uploadedFile?.filepath) {
      await fs.unlink(uploadedFile.filepath).catch(() => {})
    }
  }
}
