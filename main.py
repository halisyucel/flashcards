import json
import os

import click
import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv('.env')
load_dotenv('.env.local')

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def prompt(word: str):
    return f"""
        translate the word '{word}' to turkish with multiple meanings (if possible least 6) and provide 5 english 
        example sentences. after all upload the card to the database.
        
        note: please wrap words in <span style='color: #228B22;'>word</span> tag;
        
        some examples for you to understand the format:
        
        exquisite
        mükemmel, nefis, zarif, enfes, ince
        * The chef prepared an <span style='color: #228B22;'>exquisite</span> meal for the special occasion.
        * She wore an <span style='color: #228B22;'>exquisite</span> gown to the gala, turning heads as she entered.
        * The museum houses a collection of <span style='color: #228B22;'>exquisite</span> jewels from the 18th century.
        * His <span style='color: #228B22;'>exquisite</span> attention to detail made him a sought-after craftsman.
        * The garden was filled with <span style='color: #228B22;'>exquisite</span> flowers of every color and fragrance.
        
        scrub
        ovmak, fırçalamak, temizlemek, çalılık, bodur ağaç, iptal etmek
        * She had to <span style='color: #228B22;'>scrub</span> the floor to remove the stubborn stains.
        * The doctors <span style='color: #228B22;'>scrub</span> their hands thoroughly before surgery.
        * We decided to <span style='color: #228B22;'>scrub</span> the camping trip due to bad weather.
        * The landscape was covered in dense <span style='color: #228B22;'>scrub</span>, making it difficult to walk through.
        * He uses a face <span style='color: #228B22;'>scrub</span> every morning to exfoliate his skin.
    """


def format_translation(word: str, translation: str, examples: list[str]) -> (str, str):
    return (
        f"<b style='color: #333; font-size: 24px;'>{word}</b>",
        f"<div style='color: #666; font-size: 20px; text-align: left;'>{translation}</div>" +
        "<div style='display: flex; flex-direction: column; margin-top: 20px;" +
        "justify-content: flex-start; align-items: flex-start;'>" +
        "".join(
            [f"<div style='font-weight: 300; font-size: 18px; padding: 0; text-align: left;'>- {example}</div>" for
             example in
             examples]) +
        "</div>"
    )


@click.command()
@click.option("--word", prompt="enter a english word", help="word to generate examples")
def main(word: str):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt(word)},
        ],
        function_call="auto",
        functions=[
            {
                "name": "upload_card",
                "description": "Uploads a card to the database",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": {
                            "type": "string",
                            "description": "word to be translated"
                        },
                        "translation": {
                            "type": "string",
                            "description": "translation of the word, with multiple meanings, separated by comma"
                        },
                        "examples": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "description": "example sentences in english"
                            },
                            "description": "5 example sentences in english"
                        }
                    }
                }
            }
        ],
    )

    func = response.choices[0].message.function_call

    if func.name == "upload_card":
        args = json.loads(func.arguments)
        upload_card(**args)


def upload_card(word: str, translation: str, examples: list[str]):
    anki_connect_url = "http://localhost:8765"

    (front, back) = format_translation(word, translation, examples)

    payload = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": "Default",
                "modelName": "Basic",
                "fields": {
                    "Front": front,
                    "Back": back
                }
            }
        }
    }

    response = requests.post(anki_connect_url, json=payload)

    if response.status_code == 200:
        print(f"card added successfully for '{word}'.")
    else:
        print(f"failed to add card for '{word}'.")


if __name__ == "__main__":
    main()
