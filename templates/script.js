// script.js - Working version (no page refresh + basic API integration)

const API_URL = "http://localhost:5000/api/analyze";

const startForm   = document.getElementById("start-form");
const startInput  = document.getElementById("startInput");
const chatForm    = document.getElementById("chat-form");
const chatInput   = document.getElementById("chatInput");
const chat        = document.getElementById("chat");
const centerPrompt = document.getElementById("centerPrompt");

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
function addMessage(text, role, isLoading = false) {
    const msg = document.createElement("div");
    msg.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = `bubble ${isLoading ? "loading" : ""}`;
    bubble.innerHTML = text;

    msg.appendChild(bubble);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function removeLoading() {
    const loading = document.querySelector(".bubble.loading");
    if (loading) loading.parentElement.remove();
}

// ────────────────────────────────────────────────
// CALL BACKEND
// ────────────────────────────────────────────────
async function analyzeSymptoms(text) {
    addMessage("Analyzing symptoms…", "assistant", true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ symptoms: text })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        removeLoading();
        showResponse(data);

    } catch (error) {
        removeLoading();
        addMessage(
            "Sorry, could not connect to the analysis service.<br>" +
            "Make sure the backend is running.<br><br>Error: " + error.message,
            "assistant"
        );
        console.error("Fetch error:", error);
    }
}

// ────────────────────────────────────────────────
// SHOW NICE RESPONSE
// ────────────────────────────────────────────────
function showResponse(data) {
    let html = "";

    // Severity
    if (data.severity) {
        let color = "";
        if (data.severity === "high")   color = "color: #e63946;";
        if (data.severity === "medium") color = "color: #f4a261;";
        if (data.severity === "low")    color = "color: #06d6a0;";

        html += `<strong style="${color}">Severity: ${data.severity.toUpperCase()}</strong><br><br>`;
    }

    // Detected symptoms
    if (data.detected_symptoms?.length > 0) {
        html += `<strong>Detected symptoms:</strong><br>`;
        html += data.detected_symptoms.map(s => `• ${s}`).join("<br>");
        html += "<br><br>";
    }

    // Possible conditions
    if (data.conditions?.length > 0) {
        html += `<strong>Possible conditions:</strong><br>`;
        data.conditions.forEach(c => {
            const prob = Math.round(c.probability * 100);
            html += `• ${c.name} (${prob}%)<br>`;
        });
        html += "<br>";
    }

    // Note / message
    if (data.message) {
        html += `<strong>Note:</strong><br>${data.message}<br><br>`;
    }

    // Recommendations
    if (data.recommendations?.length > 0) {
        html += `<strong>Recommendations:</strong><br>`;
        html += data.recommendations.map(r => `• ${r}`).join("<br>");
    }

    addMessage(html || "No detailed response available.", "assistant");
}

// ────────────────────────────────────────────────
// FORM HANDLING (this stops the refresh)
// ────────────────────────────────────────────────
function handleSubmit(e, inputEl, isStart = false) {
    e.preventDefault();
    e.stopPropagation();

    const text = inputEl.value.trim();
    if (!text) return;

    if (isStart) {
        centerPrompt.classList.add("hidden");
        chat.classList.remove("hidden");
        if (chatForm) chatForm.classList.remove("hidden");
    }

    addMessage(text, "user");
    inputEl.value = "";
    analyzeSymptoms(text);
}

if (startForm) {
    startForm.addEventListener("submit", e => handleSubmit(e, startInput, true));
}

if (chatForm) {
    chatForm.addEventListener("submit", e => handleSubmit(e, chatInput, false));
}

// Allow Enter key to submit (without Shift)
[startInput, chatInput].forEach(input => {
    if (input) {
        input.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = input.closest("form");
                if (form) form.dispatchEvent(new Event("submit"));
            }
        });
    }
});

console.log("Chat script loaded – ready to use");