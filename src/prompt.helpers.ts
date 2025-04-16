import fs from "fs";
import Mustache from "mustache";
import { ChatCompletion, ChatCompletionMessageParam } from "openai/resources";

export function generatePrompt(word: string): ChatCompletionMessageParam[] {
  const userPrompt = fs.readFileSync("./src/prompt.mustache", "utf8");
  const systemPrompt = fs.readFileSync("./src/system.mustache", "utf8");
  
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: Mustache.render(userPrompt, { word }) }
  ]
}

export const create_flashcard = {
  type: "function",
  function: {
    name: "create_flashcard",
    description: "creates a flashcard with separate front and back content for Anki",
    parameters: {
      type: "object",
      properties: {
        front: {
          type: "string",
          description: "front side of the card containing only the word and part of speech (e.g., 'demarcation (n.)')"
        },
        back: {
          type: "string",
          description: "back side of the card containing all the definitions, extended meanings, usage notes, translations, and example sentences in HTML format"
        }
      },
      required: ["front", "back"],
      additionalProperties: false
    }
  }
} as const;

export function extractResultFromResponse(response: ChatCompletion): {
  front: string;
  back: string;
} {
  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (toolCall?.function.name === 'create_flashcard' && toolCall.function.arguments) {
    const args = JSON.parse(toolCall.function.arguments);
    return {
      front: `<div style="text-align:left;">${args.front}</div>`,
      back: `<div style="text-align:left;">${args.back}</div>`
    };
  }

  throw new Error("no flashcard found in response");
}
