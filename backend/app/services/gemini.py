import json
import os
from pydantic import BaseModel
from app.core.config import settings

class ExtractedDocumentInfo(BaseModel):
    document_type: str
    holder_name: str | None
    expiry_date: str | None  # YYYY-MM-DD or None
    issue_date: str | None   # YYYY-MM-DD or None
    document_number: str | None
    is_readable: bool
    confidence_score: float

# Initialize Gemini client if API key is provided
api_key = settings.GEMINI_API_KEY
_genai_client = None

if api_key:
    try:
        from google import genai as google_genai
        _genai_client = google_genai.Client(api_key=api_key)
    except Exception as e:
        print(f"WARNING: Failed to initialize Gemini client: {e}")

def parse_document_text(text: str) -> ExtractedDocumentInfo:
    """
    Passes OCR text to Gemini to extract structured metadata.
    If API key is missing or call fails, falls back to mock details for development.
    """
    if not api_key or not _genai_client:
        print("WARNING: GEMINI_API_KEY is not set or client not initialized. Using mock document parser.")
        return get_mock_parse_result(text)
    
    try:
        prompt = (
            "You are an expert document verification system. Analyze the following OCR-extracted text "
            "from a government document (such as Aadhaar, PAN, Passport, Birth Certificate, etc.).\n\n"
            "Return ONLY a valid JSON object with these exact fields:\n"
            "- document_type: string (e.g. 'Aadhaar Card', 'PAN Card', 'Passport', 'Birth Certificate', 'Address Proof')\n"
            "- holder_name: string or null\n"
            "- expiry_date: string in YYYY-MM-DD format or null\n"
            "- issue_date: string in YYYY-MM-DD format or null\n"
            "- document_number: string or null\n"
            "- is_readable: boolean\n"
            "- confidence_score: float between 0 and 1\n\n"
            f"OCR EXTRACTED TEXT:\n{text}"
        )
        
        response = _genai_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text)
        return ExtractedDocumentInfo(**data)
        
    except Exception as e:
        print(f"Gemini API error: {e}. Falling back to mock document parser.")
        return get_mock_parse_result(text)

def get_mock_parse_result(text: str) -> ExtractedDocumentInfo:
    """
    Mock parser that returns realistic extraction data depending on content keywords.
    Helps run the application without a real API key.
    Supports testing verification failures using keywords 'expired' or 'mismatch'.
    """
    text_lower = text.lower()
    
    # Base defaults
    name = "Dhanush Kumar"
    expiry = None
    
    # Try parsing based on keywords
    if "aadhaar" in text_lower or "government of india" in text_lower or "uidai" in text_lower:
        doc_type = "Aadhaar Card"
        doc_num = "1234 5678 9012"
    elif "permanent account" in text_lower or "income tax" in text_lower or "pan" in text_lower:
        doc_type = "PAN Card"
        doc_num = "ABCDE1234F"
    elif "passport" in text_lower or "republic of india" in text_lower:
        doc_type = "Passport"
        doc_num = "Z1234567"
        expiry = "2032-12-31"
    elif "birth" in text_lower or "certificate of birth" in text_lower:
        doc_type = "Birth Certificate"
        doc_num = "B-2005/12345"
    elif "address" in text_lower or "electric" in text_lower or "bill" in text_lower or "statement" in text_lower:
        doc_type = "Address Proof"
        doc_num = "E-987654321"
        expiry = "2027-01-01"
    else:
        # Default mock
        doc_type = "Unknown Document"
        doc_num = None

    # Inject verification errors based on keywords
    if "expired" in text_lower:
        expiry = "2024-01-01"  # Date in the past
    if "mismatch" in text_lower or "wrong" in text_lower:
        name = "John Doe"  # Different name to trigger fuzzy match mismatch

    return ExtractedDocumentInfo(
        document_type=doc_type,
        holder_name=name,
        expiry_date=expiry,
        issue_date="2020-01-01",
        document_number=doc_num,
        is_readable=True,
        confidence_score=0.95
    )

def generate_chatbot_response(system_prompt: str, user_query: str, chat_history: list) -> str:
    """
    Invokes Gemini to generate a context-aware chatbot answer.
    """
    if not api_key or not _genai_client:
        print("WARNING: GEMINI_API_KEY is not set. Using mock chatbot.")
        return get_mock_chatbot_response(user_query)
    
    try:
        # Build conversation turns from history
        contents = []
        for msg in chat_history:
            role = "user" if msg["sender"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        # Add the current user message
        contents.append({"role": "user", "parts": [{"text": user_query}]})
        
        response = _genai_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=contents,
            config={"system_instruction": system_prompt}
        )
        return response.text
    except Exception as e:
        print(f"Gemini Chatbot API error: {e}. Falling back to mock chatbot.")
        return get_mock_chatbot_response(user_query)

def get_mock_chatbot_response(query: str) -> str:
    """
    Mock responses for the chatbot.
    """
    q_lower = query.lower()
    if "passport" in q_lower:
        return (
            "To apply for a Passport, you will need: 1. Aadhaar Card, 2. Birth Certificate, "
            "and 3. Address Proof. The fee is Rs. 1,500 for normal processing (15-30 days) and Rs. 2,000 for Tatkaal. "
            "You can start your application checklist in GovGuide AI and upload these files to check them!"
        )
    elif "reject" in q_lower or "fail" in q_lower:
        return (
            "Common reasons for application rejection include name spelling mismatches across documents, "
            "uploading blurry or black & white photocopies, or providing expired address proofs. Make sure your "
            "documents match your registered profile name ('Dhanush Kumar') exactly."
        )
    elif "pan" in q_lower:
        return (
            "For a PAN Card, the fee is Rs. 107. You need your Aadhaar Card and a Passport Photo. "
            "If you select paperless e-KYC, you do not need to send physical copies!"
        )
    else:
        return (
            f"I see you asked about: '{query}'. As GovGuide AI, I can help you with Passport, Aadhaar update, "
            "and PAN card applications. Let me know if you need to know about required documents, fees, or how to apply!"
        )
