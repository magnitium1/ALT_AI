from qwen_api import Qwen
from qwen_api.core.types.chat import ChatMessage
from dotenv import load_dotenv
load_dotenv()


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
