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
    description: "creates a flashcard with english definitions and turkish translations without markdown headers",
    parameters: {
      type: "object",
      properties: {
        definition: {
          type: "string",
          description: "english definitions section including word type, main definitions, extended meanings and usage notes without markdown headers"
        },
        translation: {
          type: "string",
          description: "turkish translations section including translations list and example sentences with their corresponding turkish meanings without markdown headers"
        }
      },
      required: ["definition", "translation"],
      additionalProperties: false
    }
  }
} as const;


export function extractResultFromResponse(response: ChatCompletion): {
  definition: string;
  translation: string;
} {
  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (toolCall?.function.name === 'create_flashcard' && toolCall.function.arguments) {
    const args = JSON.parse(toolCall.function.arguments);
    return {
      definition: args.definition,
      translation: args.translation
    };
  }

  throw new Error("no flashcard found in response");
}
