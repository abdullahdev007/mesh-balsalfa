import React, { useState } from "react";
import Modal from "react-modal";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import ReactModal from "react-modal";
import { generateUserId } from "@repo/game-core";
import { useGame } from "@/context/GameContext";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddPlayerModal({ isOpen, onClose }: AddPlayerModalProps) {
  const [username, setUsername] = useState("");
  const { theme } = useTheme();
  const { offline } = useGame();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      offline.addPlayer({
        username: username,
        id: generateUserId(),
      });
      setUsername("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const customStyles: ReactModal.Styles = {
    content: {
      position: "absolute",
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      padding: "24px",
      maxWidth: "400px",
      width: "90%",
      overflow: "auto",
      WebkitOverflowScrolling: "touch",
      outline: "none",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Add Player Modal"
      ariaHideApp={false}
      className={`${styles.modal} ${styles[theme]}`}
      overlayClassName={`${styles.modalOverlay} ${styles[theme]}`}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>أدخل اسم الاعب الجديد</h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="أدخل الاسم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.buttonContainer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            إلغاء
          </button>
          <button type="submit" className={styles.addButton}>
            أضف اللاعب
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddPlayerModal;
