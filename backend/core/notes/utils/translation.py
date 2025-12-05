from langdetect import detect
from deep_translator import GoogleTranslator

def detect_language(text):
    try:
        return detect(text)
    except:
        return "unknown"
def translate_text(text, target_lang="en"):
    try:
        return GoogleTranslator(source='auto', target=target_lang).translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return ""