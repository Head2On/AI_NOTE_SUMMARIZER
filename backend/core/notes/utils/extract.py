import PyPDF2
import pytesseract
from PIL import Image
import os
from django.conf import settings

if hasattr(settings, "TESSERACT_PATH"):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH

def extract_text_from_pdf(file):
    text = ""
    try:
        render = PyPDF2.PdfReader(file)
        for page in render.pages:
            text += page.extract_text() + "\n" or ""
        return text.strip()
    except Exception:
        return ""
    
def extract_text_from_image(file):
    try:
        image = Image.open(file)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception:
        return ""
    
def extract_text(file):
    filename = file.name.lower()
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file)
    if filename.endswith((".jpg", ".png", ".jpeg", ".tiff", ".bmp", ".gif")):
        return extract_text_from_image(file)
    return ""


