import { useEffect, useState } from "react";
import { generateRandomUsername } from "../utils/generateRandomUsername";
import toast from "react-hot-toast";

// Validation function
const validateUsername = (username: string): boolean => {
  if (username.length >= 4 && username.length <= 12) {
    return true;
  }
  toast.error("اسم المستخدم يجب أن يكون بين 4 و 12 حرفًا");
  return false;
};

const useUsername = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || generateRandomUsername();
    setUsername(storedUsername);
  }, []);

  useEffect(() => {
    if (username && validateUsername(username)) {
      localStorage.setItem("username", username);
      toast.success("تم تحديث اسم المستخدم بنجاح");
    }
  }, [username]);

  const handleSetUsername = (newUsername: string) => {
    if (validateUsername(newUsername)) {
      setUsername(newUsername);
    }
  };

  return { username, setUsername: handleSetUsername };
};

export default useUsername;
