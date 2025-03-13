import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();
const api_key: string = process.env.GEMINI_API_KEY as string;

const openai = new OpenAI({
  apiKey: api_key,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function main() {
    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ],
      stream: true,
    });
  
    for await (const chunk of completion) {
      console.log(chunk.choices[0].delta.content);
    }
  }
  
  main();