from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.application import Application, ApplicationDocument
from app.models.service import ServiceRequirement
from app.schemas.chat import (
    SessionResponse,
    SessionDetailResponse,
    SessionCreate,
    MessageResponse,
    MessageCreate
)
from app.services.gemini import generate_chatbot_response

router = APIRouter()

@router.get("/sessions", response_model=List[SessionResponse])
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all historical chat sessions for the current user.
    """
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()

@router.post("/sessions", response_model=SessionResponse)
def create_chat_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Start a new chat session thread.
    """
    session = ChatSession(
        user_id=current_user.id,
        title=session_in.title
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve single chat session details with message history.
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
def send_chat_message(
    session_id: int,
    message_in: MessageCreate,
    application_id: Optional[int] = Query(None, description="Active Application ID to inject context"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Send a message in a chat session.
    Retrieves active application progress and details to compile a context-aware prompt for Gemini.
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Step 1: Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        content=message_in.content
    )
    db.add(user_msg)
    db.flush()

    # Step 2: Assemble context if application_id is provided
    system_prompt = (
        "You are the official GovGuide AI Assistant. Your task is to guide the user through their government "
        "application requirements. Answer user questions clearly using reliable government information.\n\n"
    )

    if application_id:
        app = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()
        if app:
            service = app.service
            
            # Fetch steps, FAQs, rejections
            steps_str = "\n".join([f"Step {s.step_number}. {s.step_title}: {s.step_description}" for s in service.application_steps])
            rejections_str = "\n".join([f"- {r.reason_title}: {r.reason_description} (Mitigation: {r.mitigation_steps})" for r in service.rejection_reasons])
            
            # Fetch checklist state
            app_docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == app.id).all()
            checklist_items = []
            
            for ad in app_docs:
                req = ad.requirement
                status_symbol = "✔" if ad.verification_status == "valid" else "✘"
                status_text = f"{status_symbol} {req.doc_type_required}: status={ad.verification_status}"
                if ad.verification_error_details:
                    status_text += f" (Error: {ad.verification_error_details})"
                checklist_items.append(status_text)
                
            checklist_str = "\n".join(checklist_items)

            system_prompt += (
                f"--- OFFICIAL SERVICE CONTEXT: {service.name} ---\n"
                f"Description: {service.description}\n"
                f"Fees: {service.fees_description}\n"
                f"Processing Time: {service.processing_time}\n"
                f"Official application URL: {service.official_url}\n\n"
                f"Official Application Steps:\n{steps_str}\n\n"
                f"Common Rejection Reasons:\n{rejections_str}\n\n"
                f"--- USER'S ACTIVE STATE ---\n"
                f"Applicant Name: {current_user.full_name}\n"
                f"Applicant Email: {current_user.email}\n"
                f"Active Application ID: {app.id}\n"
                f"Overall Status: {app.status}\n"
                f"Document Checklist:\n{checklist_str}\n\n"
                "Ground your answers in the provided service requirements and checklist status. If a document failed, "
                "explain why using the checklist errors."
            )

    # Step 3: Fetch history
    history = []
    past_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at.asc()).all()
    for msg in past_messages:
        # Exclude the message we just created to prevent duplicates
        if msg.id == user_msg.id:
            continue
        history.append({
            "sender": msg.sender,
            "content": msg.content
        })

    # Keep only last 10 messages for context
    history = history[-10:]

    # Step 4: Generate Gemini chatbot response
    bot_response_content = generate_chatbot_response(system_prompt, message_in.content, history)

    # Step 5: Save bot message
    bot_msg = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=bot_response_content
    )
    db.add(bot_msg)
    db.commit()

    db.refresh(bot_msg)
    return bot_msg
