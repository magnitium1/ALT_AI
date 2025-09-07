from qwen_api import Qwen
from qwen_api.core.types.chat import ChatMessage
from dotenv import load_dotenv
from pathlib import Path

# Пытаемся загрузить .env из AltAI и из корня репозитория
_here = Path(__file__).resolve().parent
load_dotenv(_here / ".env")
load_dotenv((_here.parent) / ".env")


def use_model(user_promt: str) -> str:
    client = Qwen()


    messages = [ChatMessage(
        role="user",
        content=user_promt,
        web_search=False,
        thinking=False
    )]


    response = client.chat.create(
        messages=messages,
        model="qwen-max-latest"
    )

    return response.choices.message.content


if __name__ == "__main__":
    print(use_model("Как у тебя дела?"))
