export const ERRORS = {
  NOT_ENOUGH_PLAYERS: "لا يمكن بدء الجولة بأقل من 3 لاعبين",
  MAX_PLAYERS_REACHED: "لا يمكن إضافة المزيد من اللاعبين، الحد الأقصى هو 12 لاعب",
  UPDATE_TOPICS_LOBBY_ONLY: "تحديث المواضيع مسموح به فقط في مرحلة الردهة",
  NOT_IN_LOBBY: "لأنك لست في الردهة لا يمكن بدء جولة جديدة",
  GENERAL_ERROR: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  INVALID_PHASE: "مرحلة الغرفة غير صحيحة لإجراء هذه العملية",
  ONLY_SPY_CAN_GUESS: "فقط اللاعب الجاسوس يمكنه تخمين الموضوع",   
  DUPLICATED_USERNAME: "اسم المستخدم موجود بالفعل",
} as const;

export type ErrorKey = keyof typeof ERRORS;

export const getErrorMessage = (key: ErrorKey): string => {
  return ERRORS[key];
};
