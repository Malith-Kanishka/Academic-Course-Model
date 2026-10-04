import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# This securely loads your GROQ_API_KEY from the .env file
load_dotenv()

class SocraticAdversary:
    def __init__(self):
        # We connect to Groq's lightning-fast Llama 3 model
        self.llm = ChatGroq(model_name="llama3-8b-8192", temperature=0.7)

    def generate_response(self, student_text: str, topic_name: str = "General", turn_count: int = 0, history: list = None) -> str:
        """Takes context and generates a tutor argument."""
        if history is None:
            history = []
            
        history_str = "\n".join(history[-6:])  # Pass last 6 turns to not overflow context
        
        # Check if voice was not heard
        if not student_text or len(student_text.strip()) < 2:
            return "I couldn't hear that clearly. Could you please repeat your answer?"

        # If we reached 10 questions/turns from AI
        if turn_count >= 10:
            return f"We have reached the end of our session on {topic_name}. You did a great job! Thank you for participating, the session is now concluded."

        if turn_count == 0:
            # Very first AI turn is typically welcoming
            system_instruction = f"""You are 'Socratic Arena', an AI tutor in a live oral examination.
            The topic for today is '{topic_name}'.
            Since this is the very first interaction, warmly welcome the student, mention the topic '{topic_name}', and immediately ask your first question to start the session.
            Do not provide the answer, just ask the question."""
        else:
            system_instruction = f"""You are 'Socratic Arena', an AI tutor in a live oral examination.
            The topic is '{topic_name}'. You are on question {turn_count + 1} of 10.
            
            Rules:
            1. Never just give the student the correct answer.
            2. Evaluate if their conceptual answer is correct. Ignore poor grammar and bad English; focus purely on the concept.
            3. If the student says "I don't know" or seems stuck, gracefully give a brief hint or just move on to the next question with a supportive tone.
            4. If they make a broad claim, ask them for a specific analogy or to elaborate.
            5. Keep your responses under 3 sentences so it feels like a natural conversation. Do not be overly verbose.
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


# Quick test block to see if it works when we run this file directly
if __name__ == "__main__":
    agent = SocraticAdversary()
    
    test_input = "I think polymorphism means classes share an interface."
    
    print("\nStudent: ", test_input)
    print("\nThinking (Groq is processing)...")
    
    # This will trigger the fast Groq API!
    response = agent.generate_response(test_input)
    
    print("\nAI Tutor: ", response)
    print("\n")