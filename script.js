// Toggle Chatbot
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeChatbot = document.querySelector(".close-chatbot");
const chatbotContainer = document.querySelector(".chatbot-container");
const tryNowButton = document.getElementById("try-now-button");

if (chatbotToggler && closeChatbot && chatbotContainer) {
  chatbotToggler.addEventListener("click", () => {
    chatbotContainer.classList.toggle("active");
  });

  closeChatbot.addEventListener("click", () => {
    chatbotContainer.classList.remove("active");
  });
}

// Try Now Button Click Handler
if (tryNowButton) {
  tryNowButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (chatbotContainer) {
      chatbotContainer.classList.add("active");
    }
  });
}

// Full Chatbot Button Click Handler
const fullChatbotButton = document.getElementById("full-chatbot-button");
if (fullChatbotButton) {
  fullChatbotButton.addEventListener("click", (e) => {
    console.log("Navigating to full chatbot experience");
  });
}

// Chatbot Interaction
const inputField = document.querySelector(".chatbot-input");
const sendButton = document.querySelector("#send-button");
const chatMessages = document.querySelector(".chatbot-messages");

// Check if we're on the full chatbot page
const isFullChatbotPage = document.querySelector(".chatbot-fullpage") !== null;

// Initialize chat if elements exist
if (inputField && sendButton && chatMessages) {
  if (isFullChatbotPage) {
    inputField.focus();
  }

  sendButton.addEventListener("click", sendMessage);

  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

function addUserMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("user-message");
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function cleanText(text) {
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/\*\*/g, "");
  text = text.replace(/\*/g, "");
  text = text.replace(/#{1,6}\s/g, "");
  text = text.replace(/^\s*[-*]\s/gm, "• ");
  text = text.replace(/\s+/g, " ");
  text = text.replace(/\n\s+/g, "\n");
  text = text.replace(/\n+/g, "\n");
  return text.trim();
}

function formatResponse(text) {
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/\*\*/g, "");
  text = text.replace(/\*/g, "");

  let lines = text.split("\n");
  let formattedLines = [];
  let inList = false;

  for (let line of lines) {
    let indent = line.match(/^\s*/)[0];
    line = line.trim();

    if (!line) {
      if (!inList) formattedLines.push("");
      continue;
    }

    let isList = /^(\d+\.|[•\-\*])/.test(line);

    if (isList) {
      if (!inList) {
        formattedLines.push("");
      }
      inList = true;

      let indentLevel = Math.floor(indent.length / 2);
      let newIndent = "    ".repeat(indentLevel);

      if (/^[•\-\*]/.test(line)) {
        line = line.replace(/^[•\-\*]\s*/, "• ");
      }

      formattedLines.push(newIndent + line);
    } else {
      inList = false;

      if (line.length > 80) {
        let words = line.split(" ");
        let currentLine = "";

        for (let word of words) {
          if ((currentLine + " " + word).length > 80) {
            formattedLines.push(currentLine.trim());
            currentLine = word;
          } else {
            currentLine += (currentLine ? " " : "") + word;
          }
        }
        if (currentLine) {
          formattedLines.push(currentLine.trim());
        }
      } else {
        formattedLines.push(line);
      }
    }
  }

  return formattedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function addBotMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("bot-message");

  const messageContent = document.createElement("pre");
  messageContent.classList.add("message-content");

  const formattedMessage = formatResponse(message);

  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);

  typeWriter(formattedMessage, messageContent);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (ttsEnabled) {
    speakText(cleanText(message));
  }
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("typing-indicator");
  typingDiv.innerHTML = `
    <div class="typing-content">
      <span class="typing-text">FinTrackBot is typing...</span>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const typingDiv = document.querySelector(".typing-indicator");
  if (typingDiv) {
    typingDiv.remove();
  }
}

function sendMessage() {
  const messageInput = document.querySelector(".chatbot-input");
  const message = messageInput.value.trim();

  if (message === "") return;

  addUserMessage(message);
  messageInput.value = "";

  showTypingIndicator();

  fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }
      return response.json();
    })
    .then((data) => {
      hideTypingIndicator();

      if (data.status === "success") {
        addBotMessage(data.response);
      } else if (data.status === "rate_limit") {
        addBotMessage(data.response);
        setTimeout(() => {
          addBotMessage("You can try your question again now.");
        }, 2000);
      } else {
        addBotMessage(
          data.response || "Sorry, I encountered an error. Please try again."
        );
        console.error("Error:", data.error);
      }
    })
    .catch((error) => {
      hideTypingIndicator();

      if (error.message.includes("Failed to fetch")) {
        addBotMessage(
          "Unable to connect to the server. Please make sure the server is running and try again."
        );
      } else {
        addBotMessage(`Error: ${error.message}. Please try again later.`);
      }
      console.error("Error:", error);
    });
}

// Dark mode toggle
const darkModeToggle = document.getElementById("dark-mode-toggle");
if (darkModeToggle) {
  darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
  });
}

// Text-to-speech setup
let speechSynthesis = window.speechSynthesis;
let speaking = false;
let ttsEnabled = true;

function speakText(text) {
  if (!ttsEnabled) return;

  if (speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (voice) => voice.name.includes("female") || voice.name.includes("Female")
  );
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  speaking = true;
  utterance.onend = () => {
    speaking = false;
  };

  speechSynthesis.speak(utterance);
}

// Toggle TTS button
const ttsButton = document.getElementById("tts-button");
if (ttsButton) {
  ttsButton.classList.add("active");

  ttsButton.addEventListener("click", () => {
    ttsEnabled = !ttsEnabled;

    if (ttsEnabled) {
      ttsButton.classList.add("active");
      ttsButton.title = "Disable Text-to-Speech";
    } else {
      ttsButton.classList.remove("active");
      ttsButton.title = "Enable Text-to-Speech";
      if (speaking) {
        speechSynthesis.cancel();
      }
    }
  });
}

// Typewriter effect
function typeWriter(text, element, speed = 30) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

function calculateEMI() {
  const P = parseFloat(document.getElementById("loan-amount").value);
  const annualRate = parseFloat(document.getElementById("interest-rate").value);
  const years = parseFloat(document.getElementById("loan-tenure").value);

  const r = annualRate / (12 * 100);
  const n = years * 12;

  if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || r <= 0 || n <= 0) {
    document.getElementById("emi-result").textContent = "Please enter valid inputs.";
    return;
  }

  const EMI = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  document.getElementById("emi-result").textContent = `Estimated EMI: ₹${EMI.toFixed(2)} per month`;
}

function sendToBotEMI() {
  const P = document.getElementById("loan-amount").value;
  const R = document.getElementById("interest-rate").value;
  const Y = document.getElementById("loan-tenure").value;

  if (!P || !R || !Y) {
    alert("Please fill all fields before sending to the bot.");
    return;
  }

  const message = `What will be the EMI for a loan of ₹${P} with ${R}% interest over ${Y} years?`;

  // Set input field and trigger send
  inputField.value = message;
  sendMessage();
}
