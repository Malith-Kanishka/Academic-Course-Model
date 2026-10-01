import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

SYSTEM_INSTRUCTION = """You are the official ACM (Academic Course Model) Intelligence Assistant.

YOUR STRICT SCOPE & RESPONSIBILITIES:
1. Help users with the ACM System (features, workflows, approvals, curriculum details, module specs).
2. Assist with academic coursework, syllabus topics, and educational guidance.
3. Answer questions based on uploaded academic documents and retrieved system context.

CRITICAL GUARDRAILS:
- IF the user asks a question outside of ACM system processes, academics, or university guidelines (e.g., general chit-chat, movies, gaming, sports, general trivia, lifestyle advice):
  POLITELY DECLINE by stating: "I am specialized only in the ACM system, academic processes, and uploaded course materials. Please ask a question related to your studies or the ACM platform."
- Do NOT act as a general-purpose chatbot.

RESPONSE FORMATTING:
- Format substantive answers as clean Markdown with concise ## headings and - bullet points where they improve readability.
- Use **bold** for important terms and fenced code blocks for code or commands when needed.
- Never emit raw HTML tags, including <br> or <br/>; use Markdown paragraph and line-break syntax instead.
- Do not use Markdown tables unless the user explicitly requests a table.
- Keep short answers concise; do not add headings or lists when they would be unnecessary.
"""

def generate_rag_response(query: str, history: list, session_id: str) -> str:
    groq_api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL") or os.getenv("GROQ_MODEL_NAME") or "openai/gpt-oss-20b"
    
    if not groq_api_key:
        return "Error: GROQ_API_KEY is not set in the environment."

    try:
        llm = ChatGroq(
            groq_api_key=groq_api_key, 
            model=model_name, 
            temperature=0.2  # Lower temperature for more consistent, strict adherence to rules
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_INSTRUCTION),
            ("user", "Conversation History:\n{history}\n\nStudent's Question:\n{query}")
        ])
        
        chain = prompt | llm | StrOutputParser()
        
        # Safely format history
        if history and isinstance(history, list):
            history_text = "\n".join([
                f"{msg.get('sender', 'user') if isinstance(msg, dict) else 'user'}: {msg.get('content', msg) if isinstance(msg, dict) else msg}" 
                for msg in history
            ])
        else:
            history_text = "No previous history."
        
        return chain.invoke({"query": query, "history": history_text})
    except Exception as e:
        return f"Error connecting to AI: {str(e)}"