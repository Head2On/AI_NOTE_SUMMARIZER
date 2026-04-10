import google.generativeai as genai
from django.conf import settings
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

genai.configure(api_key=settings.GEMINI_API_KEY)

def summarize_text(text):
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Summarize the following text in 5 clean bullet points:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Summary unavailable."


def generate_ai_content(text, task_type='summary'):
    
    if task_type == 'takeaways':
        template = """
        Extract the most important 5-7 key takeaways from the following text.
        Format them as a clean bulleted list.
        Text: {text}
        Key Takeaways:"""
    else:
        template = """
        Provide a concise and professional summary of the following text.
        Text: {text}
        Summary:"""

    prompt = PromptTemplate(template=template, input_variables=["text"])
    
    # Using your existing Gemini configuration
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", version="v1") 
    chain = prompt | llm
    
    response = chain.invoke({"text": text})
    return response.content