import React, { useState, useCallback, useEffect } from "react";
import Modal from "react-modal";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import { GameEvent, Topic, TopicCategory } from "@repo/game-core";
import { FaCheck, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Image from "next/image";
import { IoArrowBack } from "react-icons/io5";
import toast from "react-hot-toast";
import { translateCategory } from "@repo/game-core";
import { useGame } from "@/context/GameContext";
import { OnlineEngineEvents } from "@/services/GameService";

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function TopicModal({ isOpen, onClose }: TopicModalProps) {
  const { theme } = useTheme();
  const [updateMode, setUpdateMode] = useState<TopicCategory | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editedTopicName, setEditedTopicName] = useState<string>("");

  const { online, offline, mode } = useGame();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [groupedTopics, setGroupedTopics] = useState<Record<string, Topic[]>>(
    {}
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [newTopicName, setNewTopicName] = useState<string>("");
  const [newTopicMode, setNewTopicMode] = useState<boolean>(false);

  const groupTopics = useCallback((topicsToGroup: Topic[]) => {
    return topicsToGroup.reduce(
      (acc, topic) => {
        const categoryName = topic.category;
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(topic);
        return acc;
      },
      {} as Record<string, Topic[]>
    );
  }, []);

  useEffect(() => {
    const handleTopicsUpdate = (updatedTopics: Topic[]) => {
      setTopics(updatedTopics || []);
      setGroupedTopics(groupTopics(updatedTopics || []));
    };

    if (mode === "online") {
      online.on(OnlineEngineEvents.TOPICS_UPDATED, handleTopicsUpdate);
      const initialTopics = online.topics;
      if (initialTopics && initialTopics.length > 0) {
        setTopics(initialTopics);
        setGroupedTopics(groupTopics(initialTopics));
      }
      setIsAdmin(online.isAdmin);
    } else if (mode === "offline") {
      offline.on(GameEvent.TOPICS_UPDATED, handleTopicsUpdate);
      const initialTopics = offline.getTopics();
      if (initialTopics && initialTopics.length > 0) {
        setTopics(initialTopics);
        setGroupedTopics(groupTopics(initialTopics));
      }
      setIsAdmin(true);
    }

    return () => {
      if (mode === "online") {
        online.off(OnlineEngineEvents.TOPICS_UPDATED, handleTopicsUpdate);
      } else if (mode === "offline") {
        offline.off(GameEvent.TOPICS_UPDATED, handleTopicsUpdate);
      }
    };
  }, [online, offline, mode, groupTopics]);

  const removeTopic = (topic: Topic) => {
    if (!isAdmin) {
      toast.error("ليس لديك صلاحية حذف السوالف");
      return;
    }

    const topicsInCategory = groupedTopics[topic.category] || [];

    if (topicsInCategory.length <= 3) {
      toast.error("لا يمكن حذف السالفة، يجب أن يكون هناك 3 سوالف على الأقل");
      return;
    }

    if (mode === "online") {
      online.removeTopic(topic.id);
    } else if (mode === "offline") {
      offline.removeTopic(topic.id);
    }
  };

  const selectCategory = (category: TopicCategory) => {
    if (mode === "online") {
      online.selectCategory(category);
    } else if (mode === "offline") {
      offline.selectCategory(category);
    }

    onClose();
  };

  const toggleUpdateMode = (category: string) => {
    setUpdateMode((prev) =>
      prev === category ? null : (category as TopicCategory)
    );
  };

  const startEditing = (topic: Topic) => {
    if (!isAdmin) {
      toast.error("ليس لديك صلاحية تعديل السوالف");
      return;
    }
    setEditingTopicId(topic.id);
    setEditedTopicName(topic.name);
  };

  const submitEdit = useCallback(
    (topic: Topic) => {
      if (!isAdmin) {
        toast.error("ليس لديك صلاحية تعديل السوالف");
        return;
      }

      if (!updateMode) return;

      if (editedTopicName.trim() === topic.name.trim()) {
        setEditingTopicId(null);
        setEditedTopicName("");
        return;
      }

      if (!editedTopicName.trim()) {
        toast.error("اسم السالفة فارغ");
        return;
      }

      if (mode === "online") {
        online.updateTopic({
          ...topic,
          name: editedTopicName,
        });
      } else if (mode === "offline") {
        offline.updateTopic({
          ...topic,
          name: editedTopicName,
        });
      }

      setEditingTopicId(null);
      setEditedTopicName("");
    },
    [updateMode, editedTopicName, online, offline, isAdmin, mode]
  );

  const submitNewTopic = useCallback(() => {
    if (!isAdmin) {
      toast.error("ليس لديك صلاحية إضافة سوالف جديدة");
      return;
    }

    if (!newTopicName.trim()) {
      toast.error("اسم السالفة الجديد فارغ");
      setNewTopicName("");
      return;
    }

    if (!updateMode) {
      toast.error("يجب اختيار فئة السالفة");
      return;
    }

    const newTopic: Omit<Topic, "id"> = {
      name: newTopicName,
      category: updateMode,
    };

    if (mode === "online") {
      online.addTopic(newTopic);
    } else if (mode === "offline") {
      offline.addTopic(newTopic);
    }

    setNewTopicName("");
    setNewTopicMode(false);
  }, [newTopicName, updateMode, online, offline, isAdmin, mode]);

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
              <h3 className={styles.categoryTitle}>
                {translateCategory(updateMode)}
              </h3>
              {isAdmin && (
                <button
                  className={styles.addTopic}
                  onClick={() => setNewTopicMode(!newTopicMode)}
                >
                  <FaPlus /> أضف سوالف جديدة
                </button>
              )}
            </div>

            {newTopicMode && isAdmin ? (
              <div
                className={`${
                  theme === "dark" ? styles.dark : styles.light
                } ${styles.topicItem} ${styles.addTopicHolder}`}
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
            ) : null}

            {groupedTopics[updateMode]?.map((topic) => (
              <div
                key={topic.id}
                className={`${
                  theme === "dark" ? styles.dark : styles.light
                } ${styles.topicItem}`}
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
                    readOnly={editingTopicId !== topic.id || !isAdmin}
                    onClick={() => {
                      if (editingTopicId !== topic.id && isAdmin)
                        startEditing(topic);
                    }}
                    autoFocus={editingTopicId === topic.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitEdit(topic);
                    }}
                  />
                </div>

                {isAdmin && (
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
                )}
              </div>
            ))}
          </div>
        ) : (
          Object.keys(groupedTopics).map((categoryName) => (
            <div
              className={styles.category}
              key={categoryName}
              onClick={() => {
                if (isAdmin) {
                  selectCategory(categoryName as TopicCategory);
                } else {
                  toggleUpdateMode(categoryName);
                }
              }}
            >
              <Image
                src={`/images/topics/${categoryName}.png`}
                fill
                alt={categoryName}
                sizes="width:100%"
              />
              <span className={styles.title}>
                {translateCategory(categoryName as TopicCategory)}
              </span>
              {isAdmin && (
                <>
                  <div
                    className={styles.edit}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUpdateMode(categoryName);
                    }}
                  >
                    <FaEdit />
                    تعديل
                  </div>
                  <div className={styles.choose}>
                    <FaEdit />
                    اختيار
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export default TopicModal;
