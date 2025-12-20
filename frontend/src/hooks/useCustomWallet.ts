import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

export const useCustomWallet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleDisconnect = () => {
    disconnect();
    closeModal();
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    isConnected,
    address,
    disconnect: handleDisconnect
  };
};