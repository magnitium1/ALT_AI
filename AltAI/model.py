from huggingface_hub import InferenceClient
import os


def use_model(user_promt: str) -> str:
    api_key = os.environ.get("HF_API_KEY")
    if not api_key:
        raise ValueError("HF_API_KEY is not set in environment")

    client = InferenceClient(
        provider="novita",
        api_key=api_key,
    )

    completion = client.chat.completions.create(
        model="Qwen/Qwen3-235B-A22B-Thinking-2507",
        messages=[
            {
                "role": "user",
                "content": user_promt,
            }
        ],
    )

    return completion.choices[0].message.content


if __name__ == "__main__":
    print(use_model("Как у тебя дела?"))
