export enum ServerErrorType {
  ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",
  NOT_ADMIN = "NOT_ADMIN",
  INVALID_PHASE = "INVALID_PHASE",
  GENERAL_ERROR = "GENERAL_ERROR",
  PLAYER_NOT_IN_ROOM = "PLAYER_NOT_IN_ROOM",
  INVALID_ROUND_PHASE = "INVALID_ROUND_PHASE",
  CANNOT_VOTE = "CANNOT_VOTE",
  CANNOT_GUESS_TOPIC = "CANNOT_GUESS_TOPIC",
  NOT_ENOUGH_PLAYERS = "NOT_ENOUGH_PLAYERS",
  MAX_PLAYERS_REACHED = "MAX_PLAYERS_REACHED"
}

export const SERVER_ERROR_MESSAGES = {
  [ServerErrorType.ROOM_NOT_FOUND]:
    "لم يتم العثور على الغرفة، يرجى المحاولة مرة أخرى",
  [ServerErrorType.PLAYER_NOT_FOUND]: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  [ServerErrorType.NOT_ADMIN]: "ليس لديك الصلاحية للقيام بهذا الإجراء",
  [ServerErrorType.INVALID_PHASE]: "هذا الإجراء غير متاح في هذه المرحلة",
  [ServerErrorType.GENERAL_ERROR]: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  [ServerErrorType.PLAYER_NOT_IN_ROOM]: "الاعب غير موجود في اي غرفة",
  [ServerErrorType.INVALID_ROUND_PHASE]:
    "هذا الإجراء غير متاح في هذه المرحلة من الجولة",
  [ServerErrorType.CANNOT_VOTE]: "لا يمكنك التصويت في هذه المرحلة من الجولة",
  [ServerErrorType.CANNOT_GUESS_TOPIC]:
    "لا يمكنك تخمين الموضوع في هذه المرحلة من الجولة",
  [ServerErrorType.NOT_ENOUGH_PLAYERS]:
    "لا يمكن بدء الجولة بأقل من 3 لاعبين ",
  [ServerErrorType.MAX_PLAYERS_REACHED]: "لا يمكن الانضمام إلى الغرفة، الحد الأقصى هو 12 لاعب"
};
