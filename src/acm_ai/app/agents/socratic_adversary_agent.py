import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Ensure environment variables are loaded
load_dotenv()

class SocraticAdversary:
    def __init__(self, model_name: str = None):
        api_key = os.getenv("GROQ_API_KEY")
        
        # Dynamically pull from .env matching your RAG system, fallback to openai/gpt-oss-20b
        self.model_name = (
            model_name
            or os.getenv("GROQ_MODEL")
            or os.getenv("GROQ_MODEL_NAME")
            or "openai/gpt-oss-20b"
        )

        if not api_key:
            raise ValueError("GROQ_API_KEY is missing from environment variables.")

        # Initialize ChatGroq using the exact model configured in .env
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model=self.model_name,
            temperature=0.7
        )

    def generate_response(
        self,
        student_text: str,
        topic_name: str = "General",
        turn_count: int = 0,
        history: list = None
    ) -> str:
        """Evaluates student input and generates Socratic feedback."""
        if history is None:
            history = []
            
        history_str = "\n".join(history[-6:])  # Manage context window

        # Handle empty/inaudible input
        if not student_text or len(student_text.strip()) < 2:
            return "I couldn't hear that clearly. Could you please repeat your answer?"

        # End session when turn count threshold is reached
        if turn_count >= 10:
            return f"We have reached the end of our session on {topic_name}. You did a great job! Thank you for participating."

        if turn_count == 0:
            system_instruction = f"""You are 'Socratic Arena', an AI tutor in a live oral examination.
The topic for today is '{topic_name}'.
Since this is the very first interaction, warmly welcome the student, mention the topic '{topic_name}', and immediately ask your first question to start the session.
Do not provide the answer, just ask the question."""
        else:
            system_instruction = f"""You are 'Socratic Arena', an AI tutor in a live oral examination.
The topic is '{topic_name}'. You are on question {turn_count + 1} of 10.

Rules:
1. Never just give the student the correct answer.
2. Evaluate if their conceptual answer is correct. Ignore poor grammar and focus purely on the core concept.
3. If the student says "I don't know" or seems stuck, gracefully give a brief hint or move to the next question.
4. If they make a broad claim, ask them for a specific analogy or elaboration.
5. Keep your responses under 3 sentences for natural conversation flow.
6. Ask the next question naturally.

Recent Conversation History:
{history_str}
"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("user", "Student says: {student_text}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            return chain.invoke({"student_text": student_text})
        except Exception as e:
            return f"Error connecting to AI: {str(e)}"


# Standalone function matching standard RAG endpoint signatures
def generate_socratic_response(
    query: str,
    history: list = None,
    session_id: str = None,
    topic_name: str = "General",
    turn_count: int = 0
) -> str:
    agent = SocraticAdversary()
    return agent.generate_response(
        student_text=query,
        topic_name=topic_name,
        turn_count=turn_count,
        history=history or []
    )


if __name__ == "__main__":
    agent = SocraticAdversary()
    print(f"Loaded Model: {agent.model_name}")
    
    test_input = "I think polymorphism means classes share an interface."
    print("\nStudent:", test_input)
    print("\nAI Response:", agent.generate_response(test_input))