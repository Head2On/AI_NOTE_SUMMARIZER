from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

def create_pdf_from_text(text):
    buffer = BytesIO()
    p = canvas.canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    lines = text.split("\n")

    for line in lines:
        p.drawString(40, y, line[:90])
        y -= 20
        if y < 50:
            p.showPage()
            y = height - 50
    p.save()
    buffer.seek(0)
    return buffer
