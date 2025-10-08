import React, { useState, useEffect } from "react";
import { AppKitProvider, useAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { Core } from "@walletconnect/core";
import { WebSocketTransport } from "@walletconnect/jsonrpc-ws-connection";
import { KeyValueStorage } from "@walletconnect/keyvaluestorage";

const PROJECT_ID = "180a7164cfa9e5388daf1160841f65a0";
const storage = new KeyValueStorage({ database: "fofs_avatar" });

const AVATARS = [
  { id: 1, name: "Oddball", image: "/avatars/oddball.png" },
  { id: 2, name: "Whimsy", image: "/avatars/whimsy.png" },
  { id: 3, name: "Bizarre", image: "/avatars/bizarre.png" }
];

export default function App() {
  const { account } = useAppKit(WagmiAdapter);
  const [wcSession, setWcSession] = useState(null);
  const [ownedAvatars, setOwnedAvatars] = useState([]);

  useEffect(() => {
    // Load owned avatars from storage
    const stored = storage.getItem("ownedAvatars");
    if (stored) setOwnedAvatars(JSON.parse(stored));
  }, []);

  const connectWalletConnect = async () => {
    const core = new Core({ projectId: PROJECT_ID, storage });
    const transport = new WebSocketTransport("wss://relay.walletconnect.com");
    await transport.open();
    const session = await core.session.create({
      requiredNamespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["eth_sendTransaction", "personal_sign"],
          events: ["chainChanged", "accountsChanged"]
        }
      }
    });
    setWcSession(session);
    alert("WalletConnect session connected!");
  };

  const claimAvatar = async (avatar) => {
    const newOwned = [...ownedAvatars, avatar];
    setOwnedAvatars(newOwned);
    await storage.setItem("ownedAvatars", JSON.stringify(newOwned));
    alert(`You claimed avatar: ${avatar.name}`);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🌟 FOFs NFT Avatar Profile 🌟</h1>
      {!account && !wcSession ? (
        <div>
          <button onClick={connectWalletConnect}>Connect via WalletConnect</button>
        </div>
      ) : (
        <p>Connected account: {account || "WalletConnect session active"}</p>
      )}

      <h2>Available Avatars</h2>
      <ul>
        {AVATARS.map((avatar) => (
          <li key={avatar.id} style={{ margin: "10px 0" }}>
            <img src={avatar.image} alt={avatar.name} width={50} /> {avatar.name}
            <button onClick={() => claimAvatar(avatar)} style={{ marginLeft: 10 }}>
              Claim
            </button>
          </li>
        ))}
      </ul>

      <h2>Your Avatars</h2>
      <ul>
        {ownedAvatars.map((avatar, i) => (
          <li key={i}>
            <img src={avatar.image} alt={avatar.name} width={50} /> {avatar.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppWrapper() {
  return (
    <AppKitProvider>
      <App />
    </AppKitProvider>
  );
}
