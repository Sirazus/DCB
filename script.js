const BASE_URL = "https://sdentalch-medicalassisstantbot.hf.space";
const API_KEY = "YGHDADUASDASDijuh7uyhj";
let sessionId = null;

async function createSession() {
  try {
    const res = await fetch(`${BASE_URL}/create-session`, { method: "POST" });
    const data = await res.json();
    sessionId = data.session_id;
  } catch (err) { console.error("Error creando sesión:", err); }
}
createSession();

const chatForm = document.getElementById("chat-form");
const chatMessages = document.getElementById("chat-messages");
const input = document.getElementById("message-input");

// Detectar tecla Enter vs Shift+Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit(); // fuerza envío
  }
});
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;
  input.value = "";

  // Añadir mensaje usuario
  addMessage(userMessage, "user");

  // Añadir indicador escribiendo
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "flex items-start gap-3";
  typingDiv.innerHTML = `
    <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
      <i class="fas fa-tooth"></i>
    </div>
    <div class="bg-white p-4 rounded-xl rounded-tl-none shadow-sm">
      <div class="flex items-center space-x-1">
        <span class="h-2 w-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span class="h-2 w-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span class="h-2 w-2 bg-slate-300 rounded-full animate-bounce"></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "MedicalAssisstantBot/v1",
        messages: [{ role: "user", content: userMessage }],
        stream: false,
        conversation_id: sessionId,
        user_id: "frontend-user"
      })
    });

    const data = await res.json();

    // Quitar indicador
    typingDiv.remove();

    const botReply = data?.choices?.[0]?.message?.content || "⚠️ No hay respuesta";
    addMessage(botReply, "bot");
  } catch (err) {
    typingDiv.remove();
    addMessage("❌ Error al conectar con ORIS.", "bot");
  }
});

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "flex items-start gap-3 " + (sender === "user" ? "justify-end" : "");
  if (sender === "user") {
    div.innerHTML = `
      <div class="bg-blue-500 text-white p-4 rounded-xl rounded-br-none shadow-md max-w-lg">
        <p class="text-sm">${text}</p>
      </div>
      <div class="w-10 h-10 bg-slate-300 text-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
        <i class="fas fa-user"></i>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
        <i class="fas fa-tooth"></i>
      </div>
      <div class="bg-white p-4 rounded-xl rounded-tl-none shadow-md max-w-lg border border-slate-200">
        <p class="text-sm text-slate-700">${text}</p>
      </div>
    `;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
