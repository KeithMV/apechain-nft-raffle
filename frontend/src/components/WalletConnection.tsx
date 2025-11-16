import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnection() {
  return (
    <ConnectButton 
      chainStatus="icon"
      accountStatus="address"
      showBalance={false}
    />
  );
}