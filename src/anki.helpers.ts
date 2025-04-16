import axios from 'axios';

interface AnkiAddNoteParams {
  front: string;
  back: string;
}

export async function addNoteToAnki({ front, back }: AnkiAddNoteParams): Promise<boolean> {
  try {
    const response = await axios.post('http://localhost:8765', {
      action: 'addNote',
      version: 6,
      params: {
        note: {
          deckName: 'English',
          modelName: 'Basic',
          fields: {
            Front: front,
            Back: back
          },
          options: {
            allowDuplicate: false
          },
        }
      }
    });

    if (response.data.error) {
      console.error('anki api error:', response.data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('failed to connect to anki:', error);
    return false;
  }
}
