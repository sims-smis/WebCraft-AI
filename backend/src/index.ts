import dotenv from 'dotenv';
import OpenAI from "openai";
import { getSystemPrompt, artifactInfoPrompt } from './prompts.js';
import express from 'express';
import { BASE_PROMPT } from './prompts.js';
import {basePrompt as reactBasePrompt} from './defaults/react.js';
import {basePrompt as nodeBasePrompt} from './defaults/node.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.use(cors({ origin: 'http://localhost:5173' }));
dotenv.config();
const api_key: string = process.env.GEMINI_API_KEY as string;

const openai = new OpenAI({
  apiKey: api_key,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

app.post('/template', async (req, res) => {
  const prompt = req.body.prompt;
  const completion = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      {"role": "user", "content": prompt},
      {"role": "system", "content": "Return either node or react based on what do you think the given project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"}
    ]
  });

  const answer = completion.choices[0].message.content?.trim();;
    if (answer=='react') {
      res.json({
        prompts : [BASE_PROMPT,`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiprompts: [reactBasePrompt]
      })
      return;
    }
    if (answer=='node') {
      res.json({
        prompts : [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiprompts: [nodeBasePrompt],
      })
      return;
    }
    res.status(400).send('Invalid response');
    return;
});


app.post('/chat', async (req, res) => {
  const messages= req.body.messages;
  const systemPrompt = getSystemPrompt();
  const artifactPrompt = artifactInfoPrompt();
  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: systemPrompt },
      {role:"system", content: artifactPrompt},
      {role: "user",content: "Please respond strictly following the <boltArtifact> format." },
      ...messages
    ]
  });
  res.json({
    response: response.choices[0].message.content
  })
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});