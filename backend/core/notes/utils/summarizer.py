import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def summarize_text(text):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"Summarize the following text in 5 clean bullet points:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Summary unavailable."
