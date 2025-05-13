// Define the events as unique symbols
export const ServerEvents = {
  ROOM_CREATED: "room:created", // A room was created
  ROOM_DESTROYED: "room:destroyed", // the room is destroyed
  USERNAME_UPDATED: "username:updated", // Username was updated
  PLAYER_JOINED: "player:joined", // A new player joined the room
  PLAYER_LEFT: "player:left", // A player left a room
  
  ERROR: "Error", // On error

  ROUND_STARTED: "round:started", // on round started
  ROUND_ENDED: "round:ended", // on round Ended
  ROUND_DESTROYED: "roudn:destroyed", // on round destroyed

  PHASE_CHANGED: "round:phase_changed", // on game phase_changed,
  QUESTION_ASKED: "round:question_asked", // question asked in game
  FREE_QUESTION_ASKED: "round:free_question_asked", // free question Asked
  FREE_QUESTION_ASK_DONE: "round:free_question_ask_done", // emit to players the free question ask complete
  

  ROLE_ASSIGN_COUNTDOWN_STARTED: "round:role_assign_countdown:start", // role assign countdown complete
  ROLE_ASSIGN_COUNTDOWN_COMPLETE: "round:role_assign_countdown:complete", // role assign countdown complete

  COUNTDOWN_STARTED: "round:countdown_started", // [ for now stay here ]

  TOPICS_UPDATED: "topics:updated",
  TOPIC_CATEGORY_UPDATED: "topics:category_updated",

  VOTE_CASTED: "round:vote_casted",
  TOPIC_GUESSED: "round:topic_guessed",
};

export const ClientEvents = {
  CREATE_ROOM: "room:create", // Create a room
  DESTROY_ROOM: "room:destroy", // destroy the room
  JOIN_ROOM: "room:join", // Join a room
  LEAVE_ROOM: "room:leave", // Leave a room
  GET_ROOM_INFO: "room:getInfo",
  UPDATE_USERNAME: "username:update", // Update username

  START_ROUND: "round:start", // start new round in room
  ROLE_TAKED: "round:takeedrole", // on user complete from take his role
  ASK_NEXT_QUESTION: "round:ask_next_question", // on user complete from ask here question
  ASK_FREE_QUESTION: "round:ask_free_question", // user need to ask free question
  FREE_QUESTION_ASK_DONE: "round:free_question_ask_done", // free question ask done

  ADD_TOPIC: "topics:add",
  REMOVE_TOPIC: "topics:remove",
  UPDATE_TOPIC: "topics:update",
  UPDATE_TOPIC_CATEGORY: "topics:category_update",

  START_VOTING: "round:start_voting", // start voting phase
  CAST_VOTE: "round:start_vote", // cast vote

  GUESS_TOPIC: "round:guess_topic",
};
