const arabicNames = [
  "نمر",
  "أسد",
  "صقر",
  "فهد",
  "ذئب",
  "نورس",
  "كابتن",
  "مقاتل",
  "سيف",
  "قائد",
  "شبح",
  "صخر",
  "برق",
  "رعد",
  "نجم",
  "ظل",
  "رماح",
  "رهيب",
  "صنديد",
  "هيبة",
];

export const generateRandomUsername = (): string => {
  const randomName =
    arabicNames[Math.floor(Math.random() * arabicNames.length)];
  const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `${randomName}${randomNumber}`;
};
