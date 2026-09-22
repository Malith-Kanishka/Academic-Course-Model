"""
Member 1 - The Session Coordinator & Strategy Agent (Planning & Orchestration Agent).

Two responsibilities per the project spec:

1. create_session_agenda(): before the call starts, reads the student's historical
   weaknesses and the topic's prerequisites, and produces a structured multi-phase
   SessionAgendaDTO (Core Definitions -> Analogy Testing -> Edge-Case Grilling).

2. decide_next_turn(): during the live call, looks at how the student is holding up
   this turn (accuracy score from the Knowledge Auditor, hesitation from the Socratic
   Adversary) and produces a NextTurnDirectiveDTO telling the graph which persona
   (Novice or Skeptic) should speak next.

Routing logic is deterministic Python (fast, testable, no network dependency) -
Groq/Llama 3 is used only to phrase the human-readable `rationale` / `reason` text,
with a hardcoded fallback if the LLM is unavailable or fails, matching the team's
existing error-handling pattern in socratic_adversary_agent.py (main branch).
"""
from __future__ import annotations

from app.config import settings
from app.graph.state import WorkflowState
from app.schemas.session_schemas import (
    NextTurnDirectiveDTO,
    PersonaType,
    SessionAgendaDTO,
    SessionInitRequest,
    SessionPhase,
    SessionPhaseName,
)
from app.tools.member1_tools import (
    get_module_prerequisites,
    get_student_historical_weaknesses,
    get_topic_title,
)

# How "well the student is holding up" maps to which persona speaks next:
#   struggling (low accuracy, hesitant)  -> Novice: "plays dumb" to force the
#       student into simpler, plain-English explanations and rebuild footing.
#   holding up well (accurate, decisive) -> Skeptic: escalates pressure with
#       counter-examples, per the spec's description of each persona's role.
HOLDING_UP_THRESHOLD = 0.6  # combined score below this routes to Novice

PHASE_DIFFICULTY_BASELINE: dict[SessionPhaseName, int] = {
    SessionPhaseName.CORE_DEFINITIONS: 1,
    SessionPhaseName.ANALOGY_TESTING: 3,
    SessionPhaseName.EDGE_CASE_GRILLING: 4,
}


class SessionCoordinatorAgent:
    def __init__(self) -> None:
        self._llm = None
        if settings.GROQ_API_KEY:
            try:
                from langchain_groq import ChatGroq

                self._llm = ChatGroq(
                    model=settings.GROQ_MODEL,
                    temperature=settings.LLM_TEMPERATURE,
                    timeout=settings.LLM_TIMEOUT_SECONDS,
                    max_retries=settings.LLM_MAX_RETRIES,
                )
            except Exception:
                # No key / package / network at import time - fall back to
                # deterministic-only mode rather than crashing agent construction.
                self._llm = None

    # ------------------------------------------------------------------
    # 1. Pre-session planning
    # ------------------------------------------------------------------
    def create_session_agenda(self, request: SessionInitRequest) -> SessionAgendaDTO:
        weaknesses = get_student_historical_weaknesses(request.student_id)
        prerequisites = get_module_prerequisites(request.topic_id)
        topic_title = get_topic_title(request.topic_id) or "this topic"

        weakness_names = [w.topic_name for w in weaknesses]
        prereq_titles = [p.title for p in prerequisites]

        phase1_subtopics = [f"Define {topic_title}"] + prereq_titles
        phase2_subtopics = weakness_names or [f"Analogy for {topic_title}"]
        phase3_subtopics = [f"Edge cases in {topic_title}"] + weakness_names[:2]

        phases = [
            SessionPhase(
                order=1,
                name=SessionPhaseName.CORE_DEFINITIONS,
                subtopics=phase1_subtopics,
                focus_weaknesses=[],
                rationale=self._phase_rationale(
                    SessionPhaseName.CORE_DEFINITIONS, topic_title, phase1_subtopics
                ),
            ),
            SessionPhase(
                order=2,
                name=SessionPhaseName.ANALOGY_TESTING,
                subtopics=phase2_subtopics,
                focus_weaknesses=weakness_names,
                rationale=self._phase_rationale(
                    SessionPhaseName.ANALOGY_TESTING, topic_title, phase2_subtopics
                ),
            ),
            SessionPhase(
                order=3,
                name=SessionPhaseName.EDGE_CASE_GRILLING,
                subtopics=phase3_subtopics,
                focus_weaknesses=weakness_names[:2],
                rationale=self._phase_rationale(
                    SessionPhaseName.EDGE_CASE_GRILLING, topic_title, phase3_subtopics
                ),
            ),
        ]

        required_subtopics = sorted(set(phase1_subtopics + phase2_subtopics + phase3_subtopics))

        agenda = SessionAgendaDTO(
            session_topic_id=request.topic_id,
            student_id=request.student_id,
            phases=phases,
            required_subtopics=required_subtopics,
        )

        # Deterministic Check (per spec): every required subtopic must be
        # scheduled in some phase before the agenda is considered valid.
        if not self.verify_agenda_complete(agenda):
            raise ValueError("Session agenda is missing required subtopics - refusing to return an incomplete plan.")

        return agenda

    @staticmethod
    def verify_agenda_complete(agenda: SessionAgendaDTO) -> bool:
        """Deterministic Check: every required subtopic must appear in at least
        one scheduled phase before a session is allowed to end."""
        scheduled = {s for phase in agenda.phases for s in phase.subtopics}
        return set(agenda.required_subtopics).issubset(scheduled)

    # ------------------------------------------------------------------
    # 2. Live turn routing
    # ------------------------------------------------------------------
    def decide_next_turn(self, state: WorkflowState) -> NextTurnDirectiveDTO:
        agenda = state.get("agenda")
        phase_index = state.get("current_phase_index", 0)
        if agenda and 0 <= phase_index < len(agenda.phases):
            current_phase = agenda.phases[phase_index].name
        else:
            current_phase = SessionPhaseName.CORE_DEFINITIONS

        holding_up_score = self._compute_holding_up_score(state)
        persona = PersonaType.NOVICE if holding_up_score < HOLDING_UP_THRESHOLD else PersonaType.SKEPTIC

        baseline = PHASE_DIFFICULTY_BASELINE[current_phase]
        difficulty = baseline + (1 if holding_up_score >= HOLDING_UP_THRESHOLD else -1)
        difficulty = max(1, min(5, difficulty))

        should_end = bool(agenda) and phase_index >= len(agenda.phases) - 1 and holding_up_score >= HOLDING_UP_THRESHOLD

        reason = self._turn_reason(persona, holding_up_score, current_phase)

        return NextTurnDirectiveDTO(
            next_persona=persona,
            target_difficulty=difficulty,
            reason=reason,
            current_phase=current_phase,
            should_end_session=should_end,
        )

    @staticmethod
    def _compute_holding_up_score(state: WorkflowState) -> float:
        """Combines the live signals from the other agents into one 0.0-1.0
        score. Missing signals (other agents not wired in yet) default to a
        neutral midpoint so routing still works standalone."""
        accuracy = state.get("latest_accuracy_score")
        accuracy = 0.5 if accuracy is None else accuracy

        hesitation_ms = state.get("latest_hesitation_ms")
        # Normalize hesitation: 0ms -> 1.0 (confident), 4000ms+ -> 0.0 (struggling)
        hesitation_score = 0.5 if hesitation_ms is None else max(0.0, 1.0 - (hesitation_ms / 4000))

        misconceptions = state.get("latest_misconceptions") or []
        misconception_penalty = min(0.3, 0.1 * len(misconceptions))

        score = (0.6 * accuracy) + (0.4 * hesitation_score) - misconception_penalty
        return max(0.0, min(1.0, score))

    # ------------------------------------------------------------------
    # LLM-assisted text (optional; deterministic fallback if unavailable)
    # ------------------------------------------------------------------
    def _phase_rationale(self, phase: SessionPhaseName, topic_title: str, subtopics: list[str]) -> str:
        fallback = f"{phase.value} covering: {', '.join(subtopics)}."
        if not self._llm:
            return fallback
        try:
            from langchain_core.output_parsers import StrOutputParser
            from langchain_core.prompts import ChatPromptTemplate

            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You write a one-sentence rationale for a study-session phase. "
                        "Be terse and concrete. No preamble.",
                    ),
                    (
                        "user",
                        f"Topic: {topic_title}\nPhase: {phase.value}\nSubtopics: {', '.join(subtopics)}",
                    ),
                ]
            )
            chain = prompt | self._llm | StrOutputParser()
            result = chain.invoke({})
            return result.strip() or fallback
        except Exception:
            return fallback

    def _turn_reason(self, persona: PersonaType, score: float, phase: SessionPhaseName) -> str:
        fallback = (
            f"Holding-up score {score:.2f} in {phase.value} -> routing to {persona.value}."
        )
        if not self._llm:
            return fallback
        try:
            from langchain_core.output_parsers import StrOutputParser
            from langchain_core.prompts import ChatPromptTemplate

            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You explain, in one short sentence, why the coordinator picked "
                        "this persona for the next turn of a live oral exam. No preamble.",
                    ),
                    (
                        "user",
                        f"Persona chosen: {persona.value}\nHolding-up score: {score:.2f}\nPhase: {phase.value}",
                    ),
                ]
            )
            chain = prompt | self._llm | StrOutputParser()
            result = chain.invoke({})
            return result.strip() or fallback
        except Exception:
            return fallback
