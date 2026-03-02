const webhookEl = document.getElementById("webhook");
const apiKeyEl = document.getElementById("apiKey");
const extractBtn = document.getElementById("extractBtn");
const sendBtn = document.getElementById("sendBtn");
const previewEl = document.getElementById("preview");
const statusEl = document.getElementById("status");

let extractedPayload = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function saveSettings() {
  chrome.storage.local.set({
    webhook: webhookEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
  });
}

function loadSettings() {
  chrome.storage.local.get(["webhook", "apiKey"], (value) => {
    if (value.webhook) webhookEl.value = value.webhook;
    if (value.apiKey) apiKeyEl.value = value.apiKey;
  });
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isSupportedUrl(url) {
  if (!url) return false;
  return /^https:\/\/([a-z0-9-]+\.)?app\.jobmiru\.cloud\//i.test(url);
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING_ROLE_IMPORTER" });
    return;
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
}

async function extractFromPage() {
  try {
    setStatus("Extracting role data...");
    const tab = await getActiveTab();
    if (!tab?.id) {
      setStatus("No active tab found.");
      return;
    }

    if (!isSupportedUrl(tab.url)) {
      setStatus("Open a Jobmiru job page first (https://*.app.jobmiru.cloud/...).");
      return;
    }

    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_ROLE" });
    if (!response?.ok) {
      setStatus(`Extract failed: ${response?.error || "Unknown error"}`);
      return;
    }

    extractedPayload = response.payload;
    previewEl.textContent = JSON.stringify(extractedPayload, null, 2);
    setStatus("Extracted. Review and click Send to Sheet.");
  } catch (error) {
    setStatus(`Extract failed: ${String(error)}`);
  }
}

async function sendToSheet() {
  if (!extractedPayload) {
    setStatus("Extract first.");
    return;
  }

  const webhook = webhookEl.value.trim();
  const apiKey = apiKeyEl.value.trim();
  if (!webhook || !apiKey) {
    setStatus("Set Web App URL and API key first.");
    return;
  }

  try {
    setStatus("Sending to Google Sheet...");

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        ...extractedPayload,
        api_key: apiKey,
      }),
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: `Non-JSON response: ${text.slice(0, 120)}` };
    }

    if (!response.ok || data.ok === false) {
      setStatus(`Send failed: ${data.error || response.status}`);
      return;
    }

    if (data.skipped) {
      setStatus("Duplicate detected. Skipped.");
    } else {
      setStatus("Saved to Google Sheet.");
    }
  } catch (error) {
    setStatus(`Send failed: ${String(error)}`);
  }
}

loadSettings();
webhookEl.addEventListener("change", saveSettings);
apiKeyEl.addEventListener("change", saveSettings);
extractBtn.addEventListener("click", extractFromPage);
sendBtn.addEventListener("click", sendToSheet);
