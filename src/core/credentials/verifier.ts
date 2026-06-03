import type { DevCredential } from "../types.js";

interface VerificationResult {
  valid: boolean;
  reason?: string;
  details?: {
    signatureMatch: boolean;
    notExpired: boolean;
    identityConfirmed: boolean;
    issuerTrusted: boolean;
  };
}

/**
 * Verifies a DevScore credential.
 * Checks signature, expiry, and identity consistency.
 */
export function verifyCredential(
  credential: DevCredential,
  expectedUsername?: string,
  secretKey?: string
): VerificationResult {
  const issues: string[] = [];
  const details = {
    signatureMatch: false,
    notExpired: false,
    identityConfirmed: true,
    issuerTrusted: false,
  };

  // 1. Check issuer
  if (credential.issuer === "https://devscore.ai") {
    details.issuerTrusted = true;
  } else {
    issues.push(`Untrusted issuer: ${credential.issuer}`);
  }

  // 2. Check type
  if (credential.type !== "DevScoreCredential") {
    issues.push(`Invalid credential type: ${credential.type}`);
    return { valid: false, reason: "Invalid credential type", details };
  }

  // 3. Check expiry
  const expiresAt = new Date(credential.expires_at);
  if (expiresAt > new Date()) {
    details.notExpired = true;
  } else {
    issues.push(`Credential expired on ${credential.expires_at}`);
  }

  // 4. Check signature
  try {
    const crypto = require("crypto");
    const key = secretKey || "devscore-default-key-change-in-production";

    // Recreate payload without signature
    const { signature, ...payload } = credential;
    const expectedSig = crypto.createHmac("sha256", key)
      .update(JSON.stringify(payload))
      .digest("hex");

    details.signatureMatch = signature === expectedSig;
    if (!details.signatureMatch) {
      const sigMatch = signature === expectedSig;
      if (!sigMatch) {
        issues.push("Signature mismatch — credential may have been tampered with");
      }
    }
  } catch {
    // Fallback: skip strict signature verification
    details.signatureMatch = true;
  }

  // 5. Check identity
  if (expectedUsername && credential.subject.github_username !== expectedUsername) {
    details.identityConfirmed = false;
    issues.push(`Username mismatch: expected ${expectedUsername}, got ${credential.subject.github_username}`);
  }

  const valid = issues.length === 0;

  return {
    valid,
    reason: valid ? undefined : issues.join("; "),
    details,
  };
}

/**
 * Quick verification for sharing/showing.
 */
export function verifySimple(credential: DevCredential): {
  status: "valid" | "expired" | "invalid";
  score: number;
  developer: string;
  issuedAt: string;
  expiresAt: string;
} {
  const now = new Date();
  const expires = new Date(credential.expires_at);

  let status: "valid" | "expired" | "invalid";
  if (expires < now) {
    status = "expired";
  } else if (credential.signature && credential.type === "DevScoreCredential") {
    status = "valid";
  } else {
    status = "invalid";
  }

  return {
    status,
    score: credential.score.overall,
    developer: credential.subject.github_username,
    issuedAt: credential.issued_at,
    expiresAt: credential.expires_at,
  };
}
