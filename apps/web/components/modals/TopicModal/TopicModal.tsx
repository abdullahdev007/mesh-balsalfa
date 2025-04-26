import React, { useState, useCallback, useEffect } from "react";
import Modal from "react-modal";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import { Topic, TopicCategory } from "@repo/game-core";
import { FaCheck, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Image from "next/image";
import { IoArrowBack } from "react-icons/io5";
import { useGameContext } from "@/context/GameContext";
import toast from "react-hot-toast";
import translateCategory from "@repo/game-core/dist/utils/translateCategory";

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function TopicModal({ isOpen, onClose }: TopicModalProps) {
  const { theme } = useTheme();
  const [updateMode, setUpdateMode] = useState<TopicCategory | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState<string>("");

  const { online } = useGameContext();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopicName, setNewTopicName] = useState<string>("");
  const [newTopicMode, setNewTopicMode] = useState<boolean>(false);

  const groupedTopics = topics.reduce(
    (acc, topic) => {
      const categoryName = topic.category;
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(topic);
      return acc;
    },
    {} as Record<string, Topic[]>
  );

  const removeTopic = (topic: Topic) => {
    online.removeTopic(topic.id);
  };

  const chooseCategory = (category: TopicCategory) => {
    online.chooseCategory(category);
    onClose();
  };

  const toggleUpdateMode = (category: string) => {
    setUpdateMode((prev) =>
      prev === category ? null : (category as TopicCategory)
    );
  };

  const startEditing = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditedTopicName(topic.name);
  };

  const submitEdit = useCallback(
    (topic: Topic) => {
      if (!updateMode) return;

      if (editedTopicName.trim() === topic.name.trim()) {
        setEditingTopicId(null);
        setEditedTopicName("");
        return;
      }

      topic.name = editedTopicName;

      online.updateTopic(topic!);

      setEditingTopicId(null);
      setEditedTopicName("");
    },
    [updateMode, editedTopicName, online]
  );

  const submitNewTopic = useCallback(() => {
    if (!newTopicName.trim()) {
      toast.error("اسم السالفة الجديد فارغ");
      setNewTopicName("");
      return;
    }
    console.log(updateMode);
    
    const newTopic: Omit<Topic, "id"> = {
      name: newTopicName,
      category: updateMode! as TopicCategory,
    };

    online.addTopic(newTopic);
    
    // Reset input field
    setNewTopicName("");
    setNewTopicMode(false);
  }, [newTopicName, updateMode, online]);

  useEffect(() => {
    online.setRoomInfoListener((roomInfo) => {
      setTopics(roomInfo.topics);
    });
    
    const room = online.roomInfo;
    
    if (room) {
      setTopics(room.topics);
    }
  }, [online]);

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
        <button
          onClick={() => (updateMode ? setUpdateMode(null) : onClose())}
          className={styles.closeButton}
        >
          {updateMode ? <IoArrowBack /> : "×"}
        </button>
      </div>

      <div className={styles.body}>
        {updateMode ? (
          <div className={styles.editMode}>
            <div className={styles.header}>
              <h3 className={styles.categoryTitle}>{updateMode}</h3>
              <button
                className={styles.addTopic}
                onClick={() => setNewTopicMode(!newTopicMode)}
              >
                <FaPlus /> أضف سوالف جديدة
              </button>
            </div>

          {newTopicMode ? (
            <div
              className={`
                ${theme === "dark" ? styles.dark : styles.light}
                ${styles.topicItem} 
                ${styles.addTopicHolder}`}
            >
              <div>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewTopic();
                  }}
                  placeholder="أدخل اسم السالفة"
                  autoFocus
                  className={`${styles.topicInput} ${styles.editMode}`}
                />
              </div>

              <button onClick={submitNewTopic}>
                <FaCheck />
              </button>
            </div>

          ) : <></>}

            {groupedTopics[updateMode]?.map((topic) => (
              <div
                key={topic.id}
                className={`${theme === "dark" ? styles.dark : styles.light} ${styles.topicItem}`}
              >
                <div className={styles.topicContent}>
                  <input
                    className={`${styles.topicInput} ${
                      editingTopicId === topic.id
                        ? styles.editMode
                        : styles.viewMode
                    }`}
                    type="text"
                    value={
                      editingTopicId === topic.id ? editedTopicName : topic.name
                    }
                    onChange={(e) => setEditedTopicName(e.target.value)}
                    readOnly={editingTopicId !== topic.id}
                    onClick={() => {
                      if (editingTopicId !== topic.id) startEditing(topic);
                    }}
                    autoFocus={editingTopicId === topic.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitEdit(topic);
                    }}
                  />
                </div>

                <div className={styles.topicActions}>
                  {editingTopicId === topic.id ? (
                    <button onClick={() => submitEdit(topic)}>
                      <FaCheck />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => startEditing(topic)}>
                        <FaEdit />
                      </button>
                      <button onClick={() => removeTopic(topic)}>
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          Object.keys(groupedTopics).map((categoryName) => (
            <div className={styles.category} key={categoryName}>
              <Image
                src={`/images/topics/${categoryName}.png`}
                fill
                alt={categoryName}
                sizes="width:100%"
              />
              <span className={styles.title}>{translateCategory(categoryName as TopicCategory)}</span>
              <div
                className={styles.edit}
                onClick={() => toggleUpdateMode(categoryName)}
              >
                <FaEdit />
                <span> تعديل السوالف</span>
              </div>
              <div
                className={styles.choose}
                onClick={() => chooseCategory(categoryName as TopicCategory)}
              >
                <FaCheck />
                <span> أختيار السالفة</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export default TopicModal;
