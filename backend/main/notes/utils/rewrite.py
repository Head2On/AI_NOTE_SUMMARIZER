import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def rewrite_text(text, mode="improve"):
    prompts = {
        "improve":  "Rewrite this text with better grammar and clarity:",
        "simple":   "Rewrite this text in very simple English:",
        "expand":   "Rewrite and expand the following content with more detail:",
    }

    prompt = prompts.get(mode, prompts["improve"]) + "\n\n" + text

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()
