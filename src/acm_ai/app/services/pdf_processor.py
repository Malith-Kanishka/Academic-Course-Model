"""Text extraction for uploaded PDF documents."""
from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
	"""Extract text from all pages of a PDF, preserving page boundaries."""
	reader = PdfReader(BytesIO(pdf_bytes))
	return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
