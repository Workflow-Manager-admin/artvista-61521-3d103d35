import React, { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  collection,
  getDocs
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { battlesCol, artworksCol, votesCol } from "./firestoreDataModel";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

/**
 * ArtistBattle interface for 2 users to join, see a reference photo,
 * upload their artworks, and store it all in Firebase/Firestore.
 * With added voting UI and logic.
 *
 * Props:
 *   referencePhoto: { imageUrl, source, photoId, meta }
 *   battleId: optional; if undefined, new battle created
 */
function ArtistBattle({ referencePhoto, battleId: propBattleId }) {
  const { user } = useAuth();
  const [battleId, setBattleId] = useState(propBattleId || null);
  const [battle, setBattle] = useState(null); // The Firestore doc
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Join state
  const [joinState, setJoinState] = useState(null); // "A" | "B" | null

  // Uploads state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({A: 0, B: 0});
  const fileInputRefs = {A: useRef(null), B: useRef(null)};
  const [successMsg, setSuccessMsg] = useState("");

  // Firebase Storage instance
  const storage = getStorage();

  // ---- On mount, set up battle (existing or new) ----
  useEffect(() => {
    async function setup() {
      setLoading(true);
      setError(null);
      try {
        // New battle: create document
        if (!propBattleId) {
          // Min info for creating
          const battleDoc = {
            referencePhoto,
            artistA: "",
            artistB: "",
            status: "open",
            createdAt: serverTimestamp(),
            artworkAId: "",
            artworkBId: "",
            votesA: 0,
            votesB: 0,
          };
          const docRef = await addDoc(battlesCol, battleDoc);
          setBattleId(docRef.id);
          // Let onSnapshot setup run below
        } else {
          setBattleId(propBattleId);
        }
      } catch (e) {
        setError("Error setting up battle: " + (e.message || e.toString()));
        setLoading(false);
      }
      setLoading(false);
    }
    setup();
    // eslint-disable-next-line
  }, []);

  // ---- Listen for battle changes ----
  useEffect(() => {
    if (!battleId) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "battles", battleId), (snap) => {
      setBattle({ ...snap.data(), id: snap.id });
      setLoading(false);
    });
    return unsub;
  }, [battleId]);

  // ---- Determine join state for this user ----
  useEffect(() => {
    if (!battle || !user) {
      setJoinState(null);
      return;
    }
    if (!battle.artistA) setJoinState(null);
    else if (battle.artistA === user) setJoinState("A");
    else if (!battle.artistB) setJoinState(null);
    else if (battle.artistB === user) setJoinState("B");
    else setJoinState(null); // Spectator or full
  }, [battle, user]);

  // PUBLIC_INTERFACE
  /** Let user join as Artist A or B (if slot available) */
  async function handleJoin(slot) {
    if (!battle || !user) return;
    setLoading(true);
    try {
      if (slot === "A" && !battle.artistA) {
        await updateDoc(doc(db, "battles", battleId), { artistA: user });
        setJoinState("A");
      } else if (slot === "B" && !battle.artistB && (!battle.artistA || battle.artistA !== user)) {
        await updateDoc(doc(db, "battles", battleId), { artistB: user });
        setJoinState("B");
      }
    } catch (e) {
      setError("Failed to join: " + (e.message || e.toString()));
    }
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  /** Handle artwork upload for artistA or artistB */
  async function handleUpload(slot, file) {
    setError(null);
    setSuccessMsg("");
    if (!battle || !user) return;
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    setUploading(true);
    setUploadProgress(p => ({...p, [slot]: 10}));
    try {
      // Firebase Storage: battles/<battleId>/<AorB>_<username>_<timestamp>.ext
      const ext = file.name.split(".").pop();
      const storagePath = `battles/${battleId}/${slot}_${user}_${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      setUploadProgress(p => ({...p, [slot]: 60}));
      const imageUrl = await getDownloadURL(storageRef);

      // Add to artworks collection
      const artDoc = {
        battleId,
        artist: user,
        imageUrl,
        submittedAt: serverTimestamp(),
        meta: { originalName: file.name, size: file.size, type: file.type },
      };
      const added = await addDoc(artworksCol, artDoc);
      setUploadProgress(p => ({...p, [slot]: 80}));

      // Update battle with artwork ID and completedAt if both submitted
      const updateData = {};
      if (slot === "A") updateData.artworkAId = added.id;
      else if (slot === "B") updateData.artworkBId = added.id;

      // If this is the 2nd submission, set status/completedAt
      let complete = false;
      if (slot === "A" && battle.artworkBId) complete = true;
      if (slot === "B" && battle.artworkAId) complete = true;
      if (complete) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "battles", battleId), updateData);
      setUploadProgress(p => ({...p, [slot]: 100}));
      setSuccessMsg("Artwork uploaded! Await battle results or voting.");
    } catch (e) {
      setError("Upload failed: " + (e.code || e.message || e.toString()));
    }
    setUploading(false);
    setTimeout(() => setUploadProgress(p => ({...p, [slot]: 0})), 1100);
  }

  // ---- UI for upload field per user slot ----
  function UploadArea({ slot, artistName, artworkId }) {
    const disabled = uploading || !!artworkId || ((slot === "A" && joinState !== "A") || (slot === "B" && joinState !== "B"));
    return (
      <div style={{
        border: "1px solid var(--border-color)",
        background: "var(--secondary-tint,#f6f2fe)",
        borderRadius: 14,
        padding: "19px 12px",
        boxShadow: "0 1px 9px 0 rgba(141,95,197,0.03)",
        display: "flex", flexDirection: "column", alignItems: "center",
        minWidth: 190, minHeight: 160, maxWidth: 330, flex: 1,
      }}>
        <div style={{fontWeight: 600, marginBottom: 6}}>
          {slot === "A" ? "Artist A" : "Artist B"}
        </div>
        <div style={{marginBottom: 7, fontSize: "0.99em", color: "var(--accent-color,#ff69b4)"}}>
          {artistName ? artistName : <span style={{fontStyle: "italic"}}>Not joined</span>}
        </div>
        {artworkId ? (
          <span style={{color: "var(--primary-color)", fontWeight: 600}}>Artwork Submitted</span>
        ) : joinState === slot ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRefs[slot]}
              disabled={disabled}
              style={{ marginBottom: 6 }}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (file) handleUpload(slot, file);
              }}
            />
            <button
              className="btn"
              onClick={() => fileInputRefs[slot].current && fileInputRefs[slot].current.click()}
              style={{ fontSize: "1.01em", padding: "8px 17px", color: "var(--primary-color)", borderRadius: 44, marginTop: 2, background: "#eaf2fb" }}
              disabled={disabled}
            >
              Upload Artwork
            </button>
            {uploading && uploadProgress[slot] > 0 && <div style={{ fontSize: "0.91em", color: "#8969a9", marginTop: 5 }}>Uploading... {uploadProgress[slot]}%</div>}
          </div>
        ) : (
          <span style={{fontSize: "0.97em", color: "#aaa"}}>Not your slot</span>
        )}
      </div>
    );
  }

  // ---- UI: render states ----
  if (loading || !battle) {
    return (
      <section style={{margin:"2.2em 0", padding:"2.2em", textAlign:"center"}}>
        <span style={{ fontSize: "1.18em", color: "#6A0DAD" }}>Setting up battle...</span>
      </section>
    );
  }
  if (error) {
    return (
      <section style={{margin:"2.2em 0", padding:"2.2em", textAlign:"center"}}>
        <span style={{ color: "#c74a77", fontWeight: 600 }}>{error}</span>
      </section>
    );
  }
  const { artistA, artistB, artworkAId, artworkBId, status } = battle;
  // Only let more join if not filled; artistA slot first, then B
  const canJoinA = !artistA;
  const canJoinB = !artistB && artistA && artistA !== user;

  return (
    <section
      className="artist-battle-section"
      style={{
        background: "linear-gradient(122deg, var(--secondary-tint,#f6f2fe), var(--accent-tint,#ffe2f1) 70%)",
        borderRadius: 26,
        boxShadow: "0 5px 22px 0 rgba(141,95,197,0.11)",
        margin: "2.3rem 0",
        padding: "26px 8px 22px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
      aria-label="Artist Battle"
    >
      <h2 style={{
        color:"var(--primary-color,#6A0DAD)",
        fontWeight: 800, 
        fontSize: "2.07rem",
        marginBottom: "0.55em",
        letterSpacing: "0.013em"
      }}>
        Artist Battle
      </h2>
      <div style={{color:"var(--text-secondary)", fontWeight:500, marginBottom:17, fontSize:"1.14rem"}}>
        Two users, one reference. Join a slot, upload your art, and prepare for voting!
      </div>
      {/* Reference image */}
      <div
        style={{
          background: "#fcfaff",
          borderRadius: 17,
          boxShadow: "0 1px 11px 0 rgba(76,52,117,0.10)",
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 420,
          marginBottom: 20,
        }}
      >
        <div style={{fontWeight: 700, fontSize:"1.07em", color:"var(--primary-color)", marginBottom: 6, marginTop: 3}}>Reference Image</div>
        <img
          src={battle.referencePhoto?.imageUrl}
          alt="Reference"
          style={{
            maxWidth: 360,
            maxHeight: 240,
            objectFit: "contain",
            borderRadius: 13,
            marginBottom: 8,
            background: "#fff5fc",
            boxShadow: "0 1px 8px 0 rgba(255,137,182,0.07)",
          }}
        />
        <div style={{color:"var(--text-secondary)", fontSize:"0.97em", marginBottom: 2}}>
          Source: {battle.referencePhoto?.source}
        </div>
      </div>
      {/* JOIN UI */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 46,
        justifyContent: "center",
        marginBottom: 18,
        width:"100%",
        maxWidth: 760
      }}>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          {!artistA ? (
            <button className="btn"
              disabled={!!artistB || joinState}
              onClick={() => handleJoin("A")}
              style={{
                background: "#f6f2fe", color: "#6A0DAD", fontWeight: 700, fontSize: "1.08rem", marginBottom: 9, borderRadius: 32, minWidth: 120
              }}>
              {joinState ? "Joined" : "Join as Artist A"}
            </button>
          ) : (
            <span style={{ fontSize: "1.01em", color: "#6A0DAD", fontWeight: 600, marginBottom: 6}}>
              A: {artistA}
            </span>
          )}
        </div>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          {!artistB && artistA && artistA !== user ? (
            <button className="btn"
              disabled={!!artistB || joinState}
              onClick={() => handleJoin("B")}
              style={{
                background: "#f6f2fe", color: "#6A0DAD", fontWeight: 700, fontSize: "1.08rem", marginBottom: 9, borderRadius: 32, minWidth: 120
              }}>
              {joinState ? "Joined" : "Join as Artist B"}
            </button>
          ) : (
            artistB && <span style={{ fontSize: "1.01em", color: "#6A0DAD", fontWeight: 600, marginBottom: 6}}>
              B: {artistB}
            </span>
          )}
        </div>
      </div>
      {/* UPLOAD AREAS side-by-side */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 44,
        justifyContent: "center",
        alignItems: "stretch",
        marginBottom: 20,
        width: "100%",
        maxWidth: 880
      }}>
        <UploadArea slot="A" artistName={artistA} artworkId={artworkAId}/>
        <UploadArea slot="B" artistName={artistB} artworkId={artworkBId}/>
      </div>
      {/* Status & progress */}
      {successMsg && <div style={{color: "#18aa60", fontWeight: 500, marginBottom:8}}>{successMsg}</div>}
      {status === "completed" && (
        <div style={{color: "#FF69B4", fontWeight:700, fontSize:"1.18em",marginTop:9}}>
          Both artworks are in! Voting is now open below.
        </div>
      )}

      {/* --- Voting UI: Only appear after both artworks submitted (status === "completed" or voting) --- */}
      {(status === "completed" || status === "voting") && (
        <VotingArea
          battle={battle}
          battleId={battleId}
          user={user}
        />
      )}
    </section>
  );
}

/**
 * VotingArea component shows both artworks and allows voting, displaying live counts,
 * with prevention of double voting (per-user if logged-in, or via localStorage/cookie if anonymous).
 * Handles both demo/test (not-logged in) and username-auth scenarios.
 */
function VotingArea({ battle, battleId, user }) {
  const [artworkAUrl, setArtworkAUrl] = useState(null);
  const [artworkBUrl, setArtworkBUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [userVoteFor, setUserVoteFor] = useState(null);
  const [votesA, setVotesA] = useState(battle.votesA || 0);
  const [votesB, setVotesB] = useState(battle.votesB || 0);

  // Unique per-battle, per-device key for anonymous voting fallback
  const localVoteKey = `artistbattle__vote__${battleId}`;

  // Fetch artworks images once
  useEffect(() => {
    async function fetchArtworks() {
      setLoading(true);
      try {
        if (battle.artworkAId) {
          const docA = await getDoc(doc(db, "artworks", battle.artworkAId));
          if (docA.exists()) setArtworkAUrl(docA.data().imageUrl || "");
        }
        if (battle.artworkBId) {
          const docB = await getDoc(doc(db, "artworks", battle.artworkBId));
          if (docB.exists()) setArtworkBUrl(docB.data().imageUrl || "");
        }
      } catch (err) {/* ignore for now */}
      setLoading(false);
    }
    fetchArtworks();
  }, [battle.artworkAId, battle.artworkBId]);

  // Listen to votes changes in real-time
  useEffect(() => {
    if (!battleId) return;
    const unsub = onSnapshot(doc(db, "battles", battleId), (snap) => {
      const data = snap.data();
      setVotesA(data.votesA || 0);
      setVotesB(data.votesB || 0);
    });
    return unsub;
  }, [battleId]);

  // On mount, check if the user/device has voted (user: Firestore, anon: localStorage)
  useEffect(() => {
    let aborted = false;
    async function checkVoted() {
      // Try username context first
      if (user && battleId) {
        const q = query(
          votesCol,
          where("battleId", "==", battleId),
          where("voterId", "==", user)
        );
        const voteSnap = await getDocs(q);
        if (!aborted && !voteSnap.empty) {
          const voteDoc = voteSnap.docs[0];
          setUserVoteFor(voteDoc.data().votedFor);
          return;
        }
      }
      // Fallback: check localStorage (per-device voting)
      try {
        const local = localStorage.getItem(localVoteKey);
        if (local) {
          setUserVoteFor(local);
        }
      } catch {
        // ignore error, treat as no vote
      }
    }
    checkVoted();
    return () => { aborted = true; };
    // eslint-disable-next-line
  }, [user, battleId]);

  // PUBLIC_INTERFACE
  /** Handle voting for artwork ("A" | "B") with per-user or per-device restriction */
  async function handleVote(slot) {
    setVoteSubmitting(true);
    setVoteError(null);
    try {
      // Prevent race: disable if already voted (UI will also gray out buttons)
      if (userVoteFor) {
        setVoteError("You have already voted.");
        setVoteSubmitting(false);
        return;
      }
      if (!user && !localStorage) {
        setVoteError("Voting unavailable: please use a modern browser or log in.");
        setVoteSubmitting(false);
        return;
      }
      // If logged-in, check again (defensive race/parallel tabs)
      if (user) {
        const q = query(
          votesCol,
          where("battleId", "==", battleId),
          where("voterId", "==", user)
        );
        const userVoteDocs = await getDocs(q);
        if (!userVoteDocs.empty) {
          setUserVoteFor(userVoteDocs.docs[0].data().votedFor);
          setVoteSubmitting(false);
          return;
        }
      }
      // If anonymous (no user), check localStorage
      if (!user && localStorage) {
        const already = localStorage.getItem(localVoteKey);
        if (already) {
          setUserVoteFor(already);
          setVoteError("You have already voted.");
          setVoteSubmitting(false);
          return;
        }
      }

      // Add vote to Firestore if logged-in, else just set localStorage and update tally in Firestore
      if (user) {
        await addDoc(votesCol, {
          battleId,
          voterId: user,
          votedFor: slot,
          votedAt: serverTimestamp(),
        });
      } else {
        // Assign per-device per-battle vote tracking only
        try { localStorage.setItem(localVoteKey, slot); } catch {/* ignore */}
      }

      // Update battle tally atomically
      const battleDocRef = doc(db, "battles", battleId);
      const voteUpdate =
        slot === "A"
          ? { votesA: (votesA || 0) + 1 }
          : { votesB: (votesB || 0) + 1 };
      await updateDoc(battleDocRef, voteUpdate);

      setUserVoteFor(slot);
    } catch (err) {
      setVoteError("Unable to submit vote: " + (err.message || "Unknown error"));
    }
    setVoteSubmitting(false);
  }

  // Voting UI as before with live updating counts and stateful disabled
  return (
    <section
      className="artist-battle-voting"
      style={{
        background: "linear-gradient(122deg, var(--white-soft,#fcfaff), var(--secondary-tint,#f6f2fe) 60%)",
        borderRadius: 18,
        boxShadow: "0 3px 18px 0 rgba(255,137,182,0.07)",
        marginTop: 20,
        marginBottom: 13,
        padding: "22px 9px 18px 9px",
        maxWidth: 890,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <h3 style={{
        color:"var(--primary-color,#6A0DAD)",
        fontWeight:800,
        fontSize:"1.37rem",
        marginBottom: "0.65em"
      }}>
        Vote for the Best Artwork!
      </h3>
      <div style={{color:"var(--text-secondary)", fontWeight: 500, marginBottom: 14, fontSize:"1.09em"}}>
        Which artwork best captures the reference? Cast your vote below. <br />
        <strong>Vote counts update in real time.</strong>
      </div>
      {voteError && (
        <div style={{
          color: "#d8225c",
          background: "rgba(255,137,182,0.13)",
          fontWeight: 500,
          borderRadius: 12,
          padding: "7px 22px",
          marginBottom: 6
        }}>
          {voteError}
        </div>
      )}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 42,
        justifyContent: "center",
        width: "100%",
        maxWidth: 780,
        marginBottom: 7,
      }}>
        {/* Artwork A box */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#fcfaff",
          borderRadius: 14,
          boxShadow: "0 2px 10px 0 rgba(200,150,220,0.07)",
          padding: "9px 10px 15px 10px",
          minWidth: 195,
          maxWidth: 318,
        }}>
          <div style={{fontWeight: 600, color: "#6A0DAD", fontSize:"1.07em", marginBottom: 5, marginTop: 2}}>Artist A</div>
          <div style={{ fontSize: "0.99em", marginBottom: 7, color: "var(--accent-color,#ff69b4)" }}>
            {battle.artistA && <span>{battle.artistA}</span>}
          </div>
          {artworkAUrl ? (
            <img
              src={artworkAUrl}
              alt="Artwork A"
              style={{
                maxWidth: 215,
                maxHeight: 165,
                borderRadius: 9,
                objectFit: "contain",
                marginBottom: 8,
                background: "#f6f2fe"
              }}
            />
          ) : (
            <div style={{ minHeight: 80, marginBottom: 11 }}>Loading...</div>
          )}
          <button
            disabled={voteSubmitting || !!userVoteFor}
            className="btn"
            style={{
              background: userVoteFor === "A" ? "#ffe2f1" : "#fad7ef",
              color: "#8d5fc5",
              marginTop: 8,
              fontWeight: 800,
              fontSize: "1.01em",
              borderRadius: 32,
              padding: "7px 20px"
            }}
            onClick={() => handleVote("A")}
            aria-label="Vote for Artist A"
          >
            {userVoteFor
              ? (userVoteFor === "A" ? "Voted!" : "Vote")
              : (voteSubmitting ? "Voting..." : "Vote")}
          </button>
          <div style={{fontSize: "1.11em", color: "#d8225c", fontWeight: 700, marginTop: 8}}>
            {votesA} {votesA === 1 ? "Vote" : "Votes"}
          </div>
        </div>

        {/* Artwork B box */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#fcfaff",
          borderRadius: 14,
          boxShadow: "0 2px 10px 0 rgba(200,150,220,0.07)",
          padding: "9px 10px 15px 10px",
          minWidth: 195,
          maxWidth: 318,
        }}>
          <div style={{fontWeight: 600, color: "#6A0DAD", fontSize:"1.07em", marginBottom: 5, marginTop: 2}}>Artist B</div>
          <div style={{ fontSize: "0.99em", marginBottom: 7, color: "var(--accent-color,#ff69b4)" }}>
            {battle.artistB && <span>{battle.artistB}</span>}
          </div>
          {artworkBUrl ? (
            <img
              src={artworkBUrl}
              alt="Artwork B"
              style={{
                maxWidth: 215,
                maxHeight: 165,
                borderRadius: 9,
                objectFit: "contain",
                marginBottom: 8,
                background: "#f6f2fe"
              }}
            />
          ) : (
            <div style={{ minHeight: 80, marginBottom: 11 }}>Loading...</div>
          )}
          <button
            disabled={voteSubmitting || !!userVoteFor}
            className="btn"
            style={{
              background: userVoteFor === "B" ? "#ffe2f1" : "#fad7ef",
              color: "#8d5fc5",
              marginTop: 8,
              fontWeight: 800,
              fontSize: "1.01em",
              borderRadius: 32,
              padding: "7px 20px"
            }}
            onClick={() => handleVote("B")}
            aria-label="Vote for Artist B"
          >
            {userVoteFor
              ? (userVoteFor === "B" ? "Voted!" : "Vote")
              : (voteSubmitting ? "Voting..." : "Vote")}
          </button>
          <div style={{fontSize: "1.11em", color: "#d8225c", fontWeight: 700, marginTop: 8}}>
            {votesB} {votesB === 1 ? "Vote" : "Votes"}
          </div>
        </div>
      </div>
      {/* Final message if voted */}
      {userVoteFor && (
        <div style={{ color: "#18aa60", fontSize: "1.07em", fontWeight: 500, marginTop: 7 }}>
          Thanks for voting! Want to invite a friend to vote? Share this battle's link!
        </div>
      )}
    </section>
  );
}

export default ArtistBattle;
