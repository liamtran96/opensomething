const { invoke } = window.__TAURI__.core;

const messages = document.getElementById("messages");
const composer = document.getElementById("composer");
const input = document.getElementById("input");
const sendButton = composer.querySelector("button");

function addMessage(kind, text) {
  const bubble = document.createElement("div");
  bubble.className = `message ${kind}`;
  bubble.textContent = text;
  messages.append(bubble);
  messages.scrollTop = messages.scrollHeight;
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage("person", text);
  input.value = "";
  sendButton.disabled = true;

  try {
    addMessage("bot", await invoke("send_message", { message: text }));
  } catch (error) {
    addMessage("error", `The message failed: ${error}`);
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});
