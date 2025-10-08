import React, { useEffect, useState } from "react";
import { AppKitProvider, useAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { Core } from "@walletconnect/core";
import { WebSocketTransport } from "@walletconnect/jsonrpc-ws-connection";
import { KeyValueStorage } from "@walletconnect/keyvaluestorage";
import { rules } from "../src/avatarRules";

const PROJECT_ID = "180a7164cfa9e5388daf1160841f65a0";
const storage = new KeyValueStorage({ database: "fofs_avatar_hub" });

const AVATARS = [
  { id: 1, name: "Oddball", image: "/avatars/oddball.png" },
  { id: 2, name: "Whimsy", image: "/avatars/whimsy.png" },
  { id: 3, name: "Bizarre", image: "/avatars/bizarre.png" }
];

export default function Home() {
  const { account } = useAppKit(WagmiAdapter);
  const [wcSession, setWcSession] = useState(null);
  const [ownedAvatars, setOwnedAvatars] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const stored = storage.getItem("ownedAvatars");
    if (stored) setOwnedAvatars(JSON.parse(stored));
    updateLeaderboard();
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
    if (ownedAvatars.length >= rules.maxPerUser) {
      alert("You reached max avatars per user");
      return;
    }
    const newOwned = [...ownedAvatars, { ...avatar, level: 1, perks: 0 }];
    setOwnedAvatars(newOwned);
    await storage.setItem("ownedAvatars", JSON.stringify(newOwned));
    updateLeaderboard(newOwned);
    alert(`You claimed avatar: ${avatar.name}`);
  };

  const upgradeAvatar = async (index) => {
    const newOwned = [...ownedAvatars];
    newOwned[index].level += 1;
    newOwned[index].perks += rules.perksPerLevel;
    setOwnedAvatars(newOwned);
    await storage.setItem("ownedAvatars", JSON.stringify(newOwned));
    updateLeaderboard(newOwned);
  };

  const updateLeaderboard = (avatars = ownedAvatars) => {
    const board = avatars
      .sort((a, b) => b.level - a.level)
      .map((a, i) => ({ rank: i + 1, ...a }));
    setLeaderboard(board);
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif" }}>
      <h1>🌟 FOFs NFT Avatar Hub 🌟</h1>
      {!account && !wcSession ? (
        <button onClick={connectWalletConnect}>Connect Wallet (AppKit/WC2)</button>
      ) : (
        <p>Connected: {account || "WalletConnect session active"}</p>
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
            <img src={avatar.image} alt={avatar.name} width={50} /> {avatar.name} | Level: {avatar.level} | Perks: {avatar.perks}
            <button onClick={() => upgradeAvatar(i)} style={{ marginLeft: 10 }}>
              Upgrade
            </button>
          </li>
        ))}
      </ul>

      <h2>Leaderboard</h2>
      <ol>
        {leaderboard.map((a) => (
          <li key={a.id}>
            {a.name} | Level: {a.level} | Perks: {a.perks}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AppWrapper() {
  return (
    <AppKitProvider>
      <Home />
    </AppKitProvider>
  );
}
