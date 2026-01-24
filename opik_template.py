import opik
import os
from dotenv import load_dotenv
from openai import OpenAI
import time

# Load and set environmental variables
load_dotenv('.env')
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

client = OpenAI(api_key=os.environ.get('DEEPSEEK_API_KEY'), base_url="https://api.deepseek.com")

opik.configure(use_local=False)


@opik.track
def my_llm_function(user_question: str) -> str:
    # Your LLM code here
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": user_question},
        ],
        stream=False
    )

    text = response.choices[0].message.content
    print(text)

    return text

def main():
    my_llm_function("What is 5 x 3?")


if __name__ == "__main__":
    main()
    time.sleep(2)