/**
 * party-status-mutate.js — inbox mutation deep-merge
 *
 * Applies a `mutations` payload (per comms-protocol design §5.4) into a
 * party-status.json object in place. Keys are character folder slugs; values
 * are partial character objects containing only the fields being changed.
 *
 * Merge semantics:
 *   - Objects deep merge (new keys add, existing scalar/array values replace).
 *   - Arrays full-replace (Conditions, etc.). The companion computes the new
 *     full list and sends it entire.
 *   - Only top-level keys that already exist in statusObj are touched.
 *     Unknown slug keys are a silent no-op — safer than creating mystery
 *     characters from malformed payloads.
 */

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Recursively deep-merge `patch` into `target` in place.
 * - Objects recurse.
 * - Arrays and scalars replace.
 */
function deepMergeInto(target, patch) {
  for (const [k, pv] of Object.entries(patch)) {
    const tv = target[k];
    if (isPlainObject(pv) && isPlainObject(tv)) {
      deepMergeInto(tv, pv);
    } else {
      // Scalar, array, or type-mismatch: replace.
      target[k] = pv;
    }
  }
}

/**
 * Deep-merge a mutations payload into a party-status.json object.
 * Returns { changed: boolean, applied: string[] } — list of slug keys
 * actually modified.
 *
 * Unknown slug keys (not present in statusObj) are silently ignored.
 * Null or non-object mutations payload is a no-op.
 */
function applyMutations(statusObj, mutations) {
  const applied = [];
  if (!isPlainObject(mutations) || !isPlainObject(statusObj)) {
    return { changed: false, applied };
  }

  for (const [slug, patch] of Object.entries(mutations)) {
    if (!Object.prototype.hasOwnProperty.call(statusObj, slug)) continue;
    if (!isPlainObject(patch)) continue;
    deepMergeInto(statusObj[slug], patch);
    applied.push(slug);
  }

  return { changed: applied.length > 0, applied };
}

module.exports = { applyMutations };
