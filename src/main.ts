import path from 'path';
import ncp from 'copy-paste';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import { program } from 'commander';
import { create_flashcard, extractResultFromResponse, generatePrompt } from './prompt.helpers';

config({ path: path.join(process.cwd(), '.env') });
config({ path: path.join(process.cwd(), '.env.local') });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async (word: string) => {
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: generatePrompt(word),
    tools: [create_flashcard],
    tool_choice: { type: "function", function: { name: "create_flashcard" } }
  });

  const { definition, translation } = extractResultFromResponse(response);
  ncp.copy(`"${definition}","${translation}"`, () => {
    console.log(`${word} copied to clipboard`);
  });
}

program
  .name('flashcard')
  .description('create flashcards from english words')
  .version('1.0.0')
  .argument('<word>', 'word to be translated')
  .action(main);

program.parse(); 