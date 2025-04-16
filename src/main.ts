import path from 'path';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import { program } from 'commander';
import { create_flashcard, extractResultFromResponse, generatePrompt } from './prompt.helpers';
import { addNoteToAnki } from './anki.helpers';

config({ path: path.join(process.cwd(), '.env') });
config({ path: path.join(process.cwd(), '.env.local') });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const processWord = async (word: string): Promise<{ front: string, back: string }> => {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: generatePrompt(word),
    tools: [create_flashcard],
    tool_choice: { type: "function", function: { name: "create_flashcard" } }
  });

  return extractResultFromResponse(response);
}

const handleSingle = async (word: string) => {
  const result = await processWord(word);
  const { front, back } = result;
  
  const success = await addNoteToAnki({
    front,
    back
  });
  
  if (success) {
    console.log(`<${word}> added to anki deck`);
  } else {
    console.error(`failed to add <${word}> to anki`);
  }
}

const handleMultiple = async (words: string[]) => {
  let successCount = 0;
  let totalCount = words.length;

  for (const word of words) {
    const { front, back } = await processWord(word);
    const frontContent = `<div style="text-align:left;">${front}</div>`;
    const backContent = `<div style="text-align:left;">${back}</div>`;
    
    console.log(`processed <${word}>, adding to Anki...`);
    
    const success = await addNoteToAnki({
      front: frontContent,
      back: backContent
    });
    
    if (success) {
      successCount++;
      console.log(`added <${word}> to anki deck`);
    } else {
      console.error(`failed to add <${word}> to anki`);
    }
  }
  
  console.log(`added ${successCount}/${totalCount} words to anki deck`);
}

program
  .name('flashcard')
  .description('create flashcards from english words')
  .version('1.0.0');

program
  .command('single')
  .description('process a single word')
  .argument('<word>', 'word to be translated')
  .action(handleSingle);

program
  .command('multiple')
  .description('process multiple words')
  .argument('<words...>', 'words to be translated')
  .action(handleMultiple);

program.parse();