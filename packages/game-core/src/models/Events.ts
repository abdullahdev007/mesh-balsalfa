export enum GameEvent {
  PLAYER_JOINED = "playerJoined",
  PLAYER_LEFT = "playerLeft", 
  PHASE_CHANGED = "phaseChanged",
  ROUND_STARTED = "roundStarted",
  QUESTION_ASKED = "questionAsked",
  FREE_QUESTION_ASKED = "freeQuestionAsked",
  // FREE_QUESTIONS_STARTED = "freeQuestionsStarted",
  // QUESTION_ROUND_STARTED = "questionsRoundStarted",
  // VOTING_STARTED = "votingStarted",
  ROUND_ENDED = "roundEnded",
  STATE_UPDATED= "stateUpdated",
  TOPICS_UPDATED= "topicsUpdated",
  ERROR = "error"
}
