#!/usr/bin/env node

/**
 * debug-report.js — SubagentStop hook script for GM Arcanum
 *
 * Parses a sub-agent's transcript JSONL and writes a debug report.
 * Triggered by the SubagentStop hook. Reads hook input from stdin.
 *
 * Toggle via env var in .claude/settings.json:
 *   "env": { "GM_ARCANUM_DEBUG": "1" }   // 1 = summary, 2 = verbose
 */

const fs = require("fs");
const path = require("path");

/**
 * Read all of stdin as a string (works cross-platform including Windows).
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const debugLevel = parseInt(process.env.GM_ARCANUM_DEBUG || "0", 10);
  if (!debugLevel) process.exit(0);

  let hookInput;
  try {
    const raw = await readStdin();
    hookInput = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const {
    agent_id: agentId,
    agent_type: agentType,
    agent_transcript_path: transcriptPath,
    cwd,
  } = hookInput;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // Parse transcript JSONL
  const lines = fs
    .readFileSync(transcriptPath, "utf8")
    .trim()
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Also read meta file if it exists
  const metaPath = transcriptPath.replace(".jsonl", ".meta.json");
  let meta = {};
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch {
    // no meta file
  }

  // Extract tool calls, text blocks, timestamps
  const toolCalls = [];
  const textBlocks = [];
  let firstTimestamp = null;
  let lastTimestamp = null;
  let progressCount = 0;

  for (const entry of lines) {
    if (entry.timestamp) {
      if (!firstTimestamp) firstTimestamp = entry.timestamp;
      lastTimestamp = entry.timestamp;
    }

    if (entry.type === "progress") {
      progressCount++;
      continue;
    }

    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input || {},
          id: block.id,
        });
      } else if (block.type === "tool_result") {
        // Match result to its tool call
        const match = toolCalls.find((tc) => tc.id === block.tool_use_id);
        if (match) {
          match.result = block.content;
          match.is_error = block.is_error || false;
        }
      } else if (block.type === "text" && entry.type === "assistant") {
        textBlocks.push(block.text);
      }
    }
  }

  // Calculate duration
  let durationStr = "unknown";
  if (firstTimestamp && lastTimestamp) {
    const ms = new Date(lastTimestamp) - new Date(firstTimestamp);
    const secs = Math.round(ms / 1000);
    if (secs < 60) {
      durationStr = `${secs}s`;
    } else {
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      durationStr = `${mins}m ${remSecs}s`;
    }
  }

  // Tool type breakdown
  const toolCounts = {};
  for (const tc of toolCalls) {
    toolCounts[tc.name] = (toolCounts[tc.name] || 0) + 1;
  }

  // Build report
  const reportLines = [];
  const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const agentLabel = meta.agentType || agentType || "unknown";
  const agentDesc = meta.description || "";

  reportLines.push(`# Debug Report: ${agentLabel}`);
  reportLines.push("");
  reportLines.push(`| Field | Value |`);
  reportLines.push(`|-------|-------|`);
  reportLines.push(`| Agent Type | ${agentLabel} |`);
  reportLines.push(`| Agent ID | ${agentId || "unknown"} |`);
  if (agentDesc) {
    reportLines.push(`| Description | ${agentDesc} |`);
  }
  reportLines.push(`| Started | ${firstTimestamp || "unknown"} |`);
  reportLines.push(`| Finished | ${lastTimestamp || "unknown"} |`);
  reportLines.push(`| Duration | ${durationStr} |`);
  reportLines.push(`| Tool Calls | ${toolCalls.length} |`);
  reportLines.push(`| Transcript Lines | ${lines.length} |`);
  reportLines.push("");

  // Tool breakdown
  reportLines.push("## Tool Call Breakdown");
  reportLines.push("");
  reportLines.push("| Tool | Count |");
  reportLines.push("|------|-------|");
  const sorted = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) {
    reportLines.push(`| ${name} | ${count} |`);
  }
  reportLines.push("");

  // Tool call sequence
  reportLines.push("## Tool Call Sequence");
  reportLines.push("");
  for (let i = 0; i < toolCalls.length; i++) {
    const tc = toolCalls[i];
    const arg = summarizeToolInput(tc.name, tc.input);
    const errorFlag = tc.is_error ? " **[ERROR]**" : "";
    reportLines.push(`${i + 1}. **${tc.name}** — ${arg}${errorFlag}`);
  }
  reportLines.push("");

  // Last assistant message
  if (textBlocks.length > 0) {
    const lastText = textBlocks[textBlocks.length - 1];
    reportLines.push("## Final Output");
    reportLines.push("");
    const truncated =
      lastText.length > 1200 ? lastText.substring(0, 1200) + "..." : lastText;
    reportLines.push(truncated);
    reportLines.push("");
  }

  // Verbose mode: full tool details and reasoning
  if (debugLevel >= 2) {
    reportLines.push("---");
    reportLines.push("");
    reportLines.push("## Verbose: Full Tool Details");
    reportLines.push("");

    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i];
      reportLines.push(`### ${i + 1}. ${tc.name}`);
      reportLines.push("");
      reportLines.push("**Input:**");
      reportLines.push("```json");
      reportLines.push(JSON.stringify(tc.input, null, 2));
      reportLines.push("```");

      if (tc.result !== undefined) {
        reportLines.push("");
        reportLines.push("**Result:**");
        reportLines.push("```");
        const resultStr =
          typeof tc.result === "string"
            ? tc.result
            : JSON.stringify(tc.result, null, 2);
        // Truncate very long results
        const truncResult =
          resultStr.length > 2000
            ? resultStr.substring(0, 2000) + "\n... [truncated]"
            : resultStr;
        reportLines.push(truncResult);
        reportLines.push("```");
      }
      reportLines.push("");
    }

    reportLines.push("## Verbose: Assistant Reasoning");
    reportLines.push("");
    for (let i = 0; i < textBlocks.length; i++) {
      reportLines.push(`### Block ${i + 1}`);
      reportLines.push("");
      reportLines.push(textBlocks[i]);
      reportLines.push("");
    }
  }

  // Write report
  const debugDir = path.join(cwd || process.cwd(), "debug");
  try {
    fs.mkdirSync(debugDir, { recursive: true });
  } catch {
    // dir may already exist
  }

  const safeAgentType = agentLabel.replace(/[^a-zA-Z0-9-]/g, "-");
  const filename = `${safeAgentType}-${now}.md`;
  const reportPath = path.join(debugDir, filename);

  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");
}

/**
 * Produce a short summary of a tool call's input for the sequence list.
 */
function summarizeToolInput(toolName, input) {
  switch (toolName) {
    case "Read":
      return shortPath(input.file_path);
    case "Write":
      return shortPath(input.file_path);
    case "Edit":
      return shortPath(input.file_path);
    case "Glob":
      return `pattern: ${input.pattern || "?"}`;
    case "Grep":
      return `/${input.pattern || "?"}/ ${input.path ? "in " + shortPath(input.path) : ""}`.trim();
    case "Bash":
      return `\`${(input.command || "").substring(0, 80)}\``;
    case "Agent":
      return `${input.subagent_type || "general"}: ${(input.description || input.prompt || "").substring(0, 60)}`;
    case "Skill":
      return input.skill || "?";
    case "WebFetch":
      return input.url || "?";
    case "WebSearch":
      return input.query || "?";
    default: {
      const str = JSON.stringify(input);
      return str.length > 80 ? str.substring(0, 80) + "..." : str;
    }
  }
}

/**
 * Shorten a file path to just the last 3 segments for readability.
 */
function shortPath(filePath) {
  if (!filePath) return "?";
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts.length > 3 ? ".../" + parts.slice(-3).join("/") : filePath;
}

main().catch(() => process.exit(0));
