import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import ReactModal from "react-modal";
import { Topic } from "@repo/game-core";
import { FaCheck, FaEdit } from "react-icons/fa";
import Image from "next/image";

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

function TopicModal({ isOpen, onClose, topics }: TopicModalProps) {
  const { theme } = useTheme();

  const groupedTopics = topics.reduce(
    (acc, topic) => {
      const categoryName = topic.category;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(topic);
      return acc;
    },
    {} as Record<string, Topic[]>
  );

  const updateTopic = () => {};
  const removeTopic = () => {};
  const chooseCategory = () => {};
  const addTopic = () => {};

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
      maxWidth: "600px",
      width: "100%",
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
      contentLabel="Add Topic Modal"
      ariaHideApp={false}
      className={`${styles.modal} ${styles[theme]}`}
      overlayClassName={`${styles.modalOverlay} ${styles[theme]}`}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>عدل او اختر الموضوع</h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.body}>
        {Object.keys(groupedTopics).map((categoryName) => (
          <div className={styles.category} key={categoryName}>
            <Image src={`/images/topics/${categoryName}.png`} fill alt={categoryName}/>

            <span className={styles.title}>{categoryName}</span>
            <div className={styles.edit}>
              <FaEdit />
              <span> تعديل السوالف</span>
            </div>
            <div className={styles.choose}>
              <FaCheck />
              <span> أختيار السالفة</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default TopicModal;
