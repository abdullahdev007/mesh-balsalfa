"use client";
import React from 'react';
import Modal from 'react-modal';
import { useRouter, usePathname } from 'next/navigation';
import { OnlineEngineEvents } from '@/services/GameService';
import { useGame } from '@/context/GameContext';
import { toast } from 'react-hot-toast';
import styles from './styles.module.scss';
import { useTheme } from '@/context/ThemeContext';
import { FaInfoCircle, FaSpinner } from 'react-icons/fa';

export const ServerStatusModal = () => {
  const { online } = useGame();
  const router = useRouter();
  const pathname = usePathname();
  const toastId = React.useRef<string>(undefined);
  const { theme }= useTheme();
  const [status, setStatus] = React.useState({
    isConnected: online?.isServerConnected ?? false,
    showModal: !online?.isServerConnected, 
  });

  React.useEffect(() => {
    const handleStatus = (newStatus: { isConnected: boolean; showModal: boolean }) => {
      // Clear existing toast if any
      if (toastId.current) {
        toast.dismiss(toastId.current);
        toastId.current = undefined;
      }

      setStatus(newStatus);
      if (newStatus.isConnected) {
        router.push('/');
      }
    };

    online?.on(OnlineEngineEvents.CONNECTION_STATUS, handleStatus);
    return () => {
      online?.off(OnlineEngineEvents.CONNECTION_STATUS, handleStatus);
    };
  }, [online, router]);

  React.useEffect(() => {
    // Clear any existing toast when changing routes
    if (toastId.current) {
      toast.dismiss(toastId.current);
      toastId.current = undefined;
    }

    if (pathname === '/about') {
      setStatus(prev => ({ ...prev, showModal: false }));
      
      if (!status.isConnected) {
        toastId.current = toast.loading('جاري الاتصال بالخادم سيتم توجيهك للصفحة الرئيسية عندما يتم الاتصال', {
          duration: Infinity,
          position: 'top-center'
        });
      }
    } else {
      setStatus(prev => ({ ...prev, showModal: !status.isConnected }));
    }

    // Cleanup toast on unmount
    return () => {
      if (toastId.current) {
        toast.dismiss(toastId.current);
        toastId.current = undefined;
      }
    };
  }, [pathname, status.isConnected]);

  const handleAboutClick = () => {
    router.push('/about');
  };
  const customStyles: ReactModal.Styles = {
    content: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
      outline: 'none',
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  };

  if (!status.showModal) return null;

  return (
    <Modal
      isOpen={status.showModal}
      style={customStyles}
      contentLabel="Server Status Modal"
      ariaHideApp={false}
      className={`${styles.modal} ${styles[theme]}`}
      overlayClassName={`${styles.modalOverlay} ${styles[theme]}`}
    >
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <FaSpinner className={`${styles.spinner} ${!status.isConnected ? styles.spinning : ''}`} />
        </div>
        <h2 className={styles.title}>
          جاري الاتصال بالخادم
        </h2>
        <div className={styles.explanation}>
          <FaInfoCircle className={styles.infoIcon} />
          <p>نظراً لاستخدامنا خدمات استضافة مجانية، قد يستغرق تشغيل الخادم بعض الوقت عند أول اتصال</p>
        </div>
        <button onClick={handleAboutClick} className={styles.aboutButton}>
          اقرأ المزيد عن اللعبة
        </button>
      </div>
    </Modal>
  );
};