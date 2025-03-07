"use client";

const generateRandomUsername = (): string => {
  return `player${Math.floor(1000 + Math.random() * 9000)}`; // Generates playerXXXX (1000-9999)
};

const getUsername = (): string => {
  let username = localStorage.getItem("username");

  if (!username) {
    username = generateRandomUsername();
    localStorage.setItem("username", username);
  }

  return username;
};

export default getUsername;
