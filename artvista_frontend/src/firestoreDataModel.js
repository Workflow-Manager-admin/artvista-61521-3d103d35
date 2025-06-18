/**
 * ArtVista Firestore Data Model for Artist Battle
 * 
 * This file defines Firestore collection/field structure for use with the Artist Battle feature.
 * Not actual Firestore schema, but documents the shape that battle, submission, and vote records
 * should use in the Firestore database.
 * 
 * Usage:
 * - For frontend: refer to these structures when reading/writing Firestore
 * - For devs: update as data fields evolve
 * 
 * Collections:
 *   - battles
 *   - artworks
 *   - votes
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

// You can use these interfaces with TypeScript, JSDoc, or as reference in React
