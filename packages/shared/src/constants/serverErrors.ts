export enum ServerErrorType {
  ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",
  NOT_ADMIN = "NOT_ADMIN",
  INVALID_PHASE = "INVALID_PHASE",
  GENERAL_ERROR = "GENERAL_ERROR",
  PLAYER_NOT_IN_ROOM = "PLAYER_NOT_IN_ROOM",
}

export const SERVER_ERROR_MESSAGES = {
  [ServerErrorType.ROOM_NOT_FOUND]:
    "لم يتم العثور على الغرفة، يرجى المحاولة مرة أخرى",
  [ServerErrorType.PLAYER_NOT_FOUND]: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  [ServerErrorType.NOT_ADMIN]: "ليس لديك الصلاحية للقيام بهذا الإجراء",
  [ServerErrorType.INVALID_PHASE]: "هذا الإجراء غير متاح في هذه المرحلة",
  [ServerErrorType.GENERAL_ERROR]: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  [ServerErrorType.PLAYER_NOT_IN_ROOM]: "الاعب غير موجود في اي غرفة",
};
