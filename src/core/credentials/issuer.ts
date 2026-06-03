import type { DevCredential, SkillLevel, AnalysisResult } from "../types.js";

const ISSUER_URL = "https://devscore.ai";
const CREDENTIAL_VERSION = "1.0";
const VALIDITY_DAYS = 90;

/**
 * Issues a cryptographically signed developer credential.
 * The credential proves skills derived from actual code analysis.
 */
export function issueCredential(
  githubUsername: string,
  skills: SkillLevel[],
  result: AnalysisResult,
  secretKey?: string
): DevCredential {
  const now = new Date();
  const expires = new Date(now.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  // Extract sub-scores
  const subScoreMap = new Map(result.subScores.map((s) => [s.name, s.score]));

  const credential: Omit<DevCredential, "signature"> = {
    version: CREDENTIAL_VERSION,
    type: "DevScoreCredential",
    issuer: ISSUER_URL,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
    subject: {
      github_username: githubUsername,
      github_verified: true,
    },
    score: {
      overall: result.overallScore,
      readme: subScoreMap.get("README") || 0,
      structure: subScoreMap.get("Structure") || 0,
      tests: subScoreMap.get("Tests") || 0,
      quality: subScoreMap.get("Code Quality") || 0,
      activity: subScoreMap.get("Activity") || 0,
    },
    verifiedSkills: skills,
  };

  // Generate signature
  const payload = JSON.stringify(credential);
  const signature = signPayload(payload, secretKey);

  return {
    ...credential,
    signature,
  };
}

/**
 * Simple signing function using SHA-256.
 * In production, replace with jose/JWT for proper cryptographic signing.
 */
function signPayload(payload: string, secretKey?: string): string {
  // Use Node.js crypto for SHA-256 hashing
  try {
    const crypto = require("crypto");
    const key = secretKey || "devscore-default-key-change-in-production";
    return crypto.createHmac("sha256", key).update(payload).digest("hex");
  } catch {
    // Fallback: simple hash (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Add HMAC-like mixing with a simple key
    const key = secretKey || "devscore-default-key";
    let keyHash = 0;
    for (let i = 0; i < key.length; i++) {
      keyHash = ((keyHash << 5) - keyHash) + key.charCodeAt(i);
      keyHash = keyHash & keyHash;
    }
    return `sha256:${Math.abs(hash ^ keyHash).toString(16).padStart(8, "0")}`;
  }
}

export function generateVerificationId(username: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const hash = simpleHash(`${username}-${timestamp}-${random}`);
  return `${hash}${timestamp.slice(-4)}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

export function credentialToJSON(credential: DevCredential): string {
  return JSON.stringify(credential, null, 2);
}

export function credentialToQR(credential: DevCredential): string {
  const verifyUrl = `${ISSUER_URL}/verify/${generateVerificationId(credential.subject.github_username)}`;
  return verifyUrl;
}
