/**
 * ArtVista Firestore Data Model & Collection Setup for Artist Battle
 * 
 * This file provides:
 *  1. Firestore collection/field structures for battles, artworks, and votes (schema reference).
 *  2. Ready-to-use Firestore collection references for the frontend to store/retrieve battle data,
 *     user artwork uploads, and voting info in real-time.
 * 
 * Usage:
 * - As a data shape reference for document structure in Firestore
 * - As the module to import collection references for reading/writing Firestore
 *
 * Firestore Collections (all auto-synced):
 *   - battles: stores all battle challenge records
 *   - artworks: stores all submitted artworks for battles
 *   - votes: stores votes for artworks in each battle
 * 
 * To use in React:
 *   import { battlesCol, artworksCol, votesCol } from './firestoreDataModel';
 */

/**
 * BATTLE DOCUMENT
 * Collection: battles
 * 
 * {
 *   id: string;              // Firestore doc ID (auto or custom)
 *   referencePhoto: {        // Info about the reference photo for this battle
 *     imageUrl: string;      // URL to reference photo
 *     source: string;        // "Pexels" | "Pixabay" | etc.
 *     photoId: string;       // (optional) Source-specific photo ID
 *     meta: object;          // Any further source info
 *   },
 *   artistA: string;         // Username or UserID of first artist
 *   artistB: string;         // Username or UserID of second artist
 *   status: string;          // "open" | "completed" | "voting" | etc.
 *   createdAt: Timestamp;    // Firestore timestamp (serverTimestamp)
 *   completedAt: Timestamp?; // When both artworks submitted (optional)
 *   artworkAId: string?;     // Firestore doc ID in artworks collection (optional)
 *   artworkBId: string?;     // Firestore doc ID in artworks collection (optional)
 *   votesA: number;          // Number of votes received by A (optional, for denorm/caching)
 *   votesB: number;          // Number of votes received by B
 * }
 */

/**
 * ARTWORK SUBMISSION DOCUMENT
 * Collection: artworks
 * 
 * {
 *   id: string;              // Firestore doc ID (auto or custom)
 *   battleId: string;        // Battle this submission belongs to
 *   artist: string;          // Username or UserID of artist
 *   imageUrl: string;        // URL of uploaded image (in Firebase Storage or external)
 *   submittedAt: Timestamp;  // Submission time
 *   meta: object;            // Optionally: file info, dimensions, etc.
 * }
 */

/**
 * VOTE DOCUMENT
 * Collection: votes
 * 
 * {
 *   id: string;              // Firestore doc ID
 *   battleId: string;        // Battle the vote belongs to
 *   voterId: string;         // Username or UserID (or anon token)
 *   votedFor: "A" | "B";     // Which artwork: "A" or "B"
 *   votedAt: Timestamp;      // When vote was cast
 * }
 */

/** =========================
 * FIRESTORE COLLECTION REFERENCES
 * These can be directly imported & used in your React frontend for Firestore CRUD operations.
 * Usage example (with firebase/firestore v9+):
 *   import { battlesCol, artworksCol, votesCol } from "./firestoreDataModel";
 *   import { addDoc, getDocs, onSnapshot } from "firebase/firestore";
 *   await addDoc(battlesCol, {...});
 * ==============================
 */
import { db } from "./firebase";
import { collection } from "firebase/firestore";

// PUBLIC_INTERFACE
/** Firestore battles collection reference (Artist Battles) */
export const battlesCol = collection(db, "battles");
// PUBLIC_INTERFACE
/** Firestore artworks collection reference (Battle Artwork submissions) */
export const artworksCol = collection(db, "artworks");
// PUBLIC_INTERFACE
/** Firestore votes collection reference */
export const votesCol = collection(db, "votes");

/** =========================
 * Firestore Collection Shape Reference (JS JSDoc, NOT enforced in DB)
 * Use these as shape guidelines for documents in Firestore
 =============================\
 */

/**
 * Example: BATTLE DOCUMENT (in "battles")
   {
     id: string;              // Firestore doc ID (auto or custom)
     referencePhoto: {        // Info about the reference photo for this battle
       imageUrl: string;      // URL to reference photo
       source: string;        // "Pexels" | "Pixabay" | etc.
       photoId: string;       // (optional) Source-specific photo ID
       meta: object;          // Any further source info
     },
     artistA: string;         // Username or UserID of first artist
     artistB: string;         // Username or UserID of second artist
     status: string;          // "open" | "completed" | "voting" | etc.
     createdAt: Timestamp;    // Firestore timestamp (serverTimestamp)
     completedAt: Timestamp?; // When both artworks submitted (optional)
     artworkAId: string?;     // Firestore doc ID in artworks collection (optional)
     artworkBId: string?;     // Firestore doc ID in artworks collection (optional)
     votesA: number;          // Number of votes received by A (cache/denorm, optional)
     votesB: number;
   }
 */

/**
 * Example: ARTWORK SUBMISSION DOCUMENT (in "artworks")
   {
     id: string;              // Firestore doc ID (auto or custom)
     battleId: string;        // Battle this submission belongs to
     artist: string;          // Username or UserID of artist
     imageUrl: string;        // URL of uploaded image (Firebase Storage or external)
     submittedAt: Timestamp;  // Submission time
     meta: object;            // Optionally: file info, dimensions, etc.
   }
 */

/**
 * Example: VOTE DOCUMENT (in "votes")
   {
     id: string;              // Firestore doc ID
     battleId: string;        // Battle the vote belongs to
     voterId: string;         // Username or UserID (or anon token)
     votedFor: "A" | "B";     // Which artwork: "A" or "B"
     votedAt: Timestamp;      // When vote was cast
   }
 */
