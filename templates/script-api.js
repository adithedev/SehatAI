// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:5000/api';

// ==================== STATE MANAGEMENT ====================
const state = {
  currentView: 'chat',
  profile: {
    name: 'Guest User',
    email: 'guest@sehat.com',
    age: '',
    bloodType: '',
    height: '',
    weight: '',
    conditions: [],
    allergies: [],
    emergencyContact: { name: '', phone: '' }
  },
  consultations: [],
  prescriptions: [],
  history: []
};

// Load from localStorage
function loadState() {
  const saved = localStorage.getItem('sehatData');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(state, data);
    updateUI();
  }
}

// Save to localStorage
function saveState() {
  localStorage.setItem('sehatData', JSON.stringify(state));
}

// ==================== DOM ELEMENTS ====================
const centerPrompt = document.getElementById("centerPrompt");
const startForm = document.getElementById("startForm");
const startInput = document.getElementById("startInput");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chat = document.getElementById("chat");

// Views
const chatView = document.getElementById("chatView");
const profileView = document.getElementById("profileView");
const prescriptionsView = document.getElementById("prescriptionsView");
const historyView = document.getElementById("historyView");

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const newChatBtn = document.getElementById('newChatBtn');

// Profile elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const consultationCount = document.getElementById('consultationCount');
const prescriptionCount = document.getElementById('prescriptionCount');
const healthScore = document.getElementById('healthScore');

// ==================== VIEW MANAGEMENT ====================
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view-container').forEach(v => {
    v.classList.remove('active');
  });
  
  // Show selected view
  const viewMap = {
    chat: chatView,
    profile: profileView,
    prescriptions: prescriptionsView,
    history: historyView
  };
  
  if (viewMap[viewName]) {
    viewMap[viewName].classList.add('active');
    state.currentView = viewName;
  }
  
  // Update nav items
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    }
  });
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchView(item.dataset.view);
  });
});

// ==================== CHAT FUNCTIONALITY ====================
startForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = startInput.value.trim();
  if (!text) return;

  centerPrompt.classList.add("hidden");
  chat.classList.remove("hidden");
  chatForm.classList.remove("hidden");

  addMessage(text, "user");
  startInput.value = "";
  
  // Store consultation
  const consultation = {
    id: Date.now(),
    date: new Date().toISOString(),
    symptoms: text,
    response: null
  };
  
  processSymptoms(text, consultation);
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";
  
  const consultation = {
    id: Date.now(),
    date: new Date().toISOString(),
    symptoms: text,
    response: null
  };
  
  processSymptoms(text, consultation);
});

function addMessage(text, role) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  
  msg.appendChild(bubble);
  chat.appendChild(msg);
  
  // Smooth scroll to bottom
  setTimeout(() => {
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

function addBotMessage(html) {
  const msg = document.createElement("div");
  msg.className = "message assistant";
  
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = html;
  
  msg.appendChild(bubble);
  chat.appendChild(msg);
  
  setTimeout(() => {
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

function addLoadingMessage() {
  const msg = document.createElement("div");
  msg.className = "message assistant";
  msg.id = "loading-message";
  
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="display: flex; gap: 6px;">
        <div style="width: 8px; height: 8px; background: #2D5F8D; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;"></div>
        <div style="width: 8px; height: 8px; background: #2D5F8D; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.2s;"></div>
        <div style="width: 8px; height: 8px; background: #2D5F8D; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.4s;"></div>
      </div>
      <span style="color: #737373;">Analyzing your symptoms...</span>
    </div>
    <style>
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    </style>
  `;
  
  msg.appendChild(bubble);
  chat.appendChild(msg);
  
  setTimeout(() => {
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

function removeLoadingMessage() {
  const loading = document.getElementById('loading-message');
  if (loading) {
    loading.remove();
  }
}

// ==================== SYMPTOM PROCESSING WITH API ====================
async function processSymptoms(text, consultation) {
  // Add loading indicator
  addLoadingMessage();
  
  try {
    // Call the API
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: text })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove loading indicator
    removeLoadingMessage();
    
    // Build response message based on API response
    let responseHTML = '';
    
    if (data.severity === 'emergency') {
      responseHTML = `
        <strong style="color: #E63946;">⚠️ Emergency Alert</strong><br><br>
        ${data.message}<br><br>
        <strong>Immediate Actions Required:</strong>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        <br>
        <a href="${data.search_url}" target="_blank" style="color: #2D5F8D; text-decoration: underline;">
          Search for more information →
        </a>
        <br><br>
        <em style="color: #737373; font-size: 14px;">${data.disclaimer || 'This is not a medical diagnosis. Always consult with a qualified healthcare provider.'}</em>
      `;
    } else if (data.severity === 'mild') {
      responseHTML = `
        <strong style="color: #06D6A0;">✓ Mild Symptoms Detected</strong><br><br>
        ${data.detected_symptoms.length > 0 ? 
          `Detected symptoms: <em>${data.detected_symptoms.join(', ')}</em><br><br>` : ''
        }
        ${data.message}<br><br>
        <strong>Recommendations:</strong>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        ${data.conditions && data.conditions.length > 0 ? `
          <br>
          <strong>Possible Conditions:</strong>
          <ul>
            ${data.conditions.map(c => 
              `<li>${c.name} (${(c.probability * 100).toFixed(1)}% match)</li>`
            ).join('')}
          </ul>
        ` : ''}
        <br>
        <em style="color: #737373; font-size: 14px;">${data.disclaimer || 'This is not a medical diagnosis.'}</em>
      `;
    } else if (data.severity === 'moderate') {
      responseHTML = `
        <strong style="color: #F4A261;">📊 Symptom Analysis</strong><br><br>
        ${data.detected_symptoms.length > 0 ? 
          `Detected symptoms: <em>${data.detected_symptoms.join(', ')}</em><br><br>` : ''
        }
        ${data.conditions && data.conditions.length > 0 ? `
          <strong>Possible Conditions:</strong>
          <ul>
            ${data.conditions.map(c => `
              <li>
                <strong>${c.name}</strong> 
                <span style="background: ${
                  c.confidence === 'high' ? '#06D6A0' : 
                  c.confidence === 'moderate' ? '#F4A261' : '#A3A3A3'
                }; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">
                  ${(c.probability * 100).toFixed(1)}%
                </span>
              </li>
            `).join('')}
          </ul>
          <br>
        ` : ''}
        <strong>Recommendations:</strong>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        <br>
        <a href="${data.search_url}" target="_blank" style="color: #2D5F8D; text-decoration: underline;">
          Learn more about these symptoms →
        </a>
        <br><br>
        <em style="color: #737373; font-size: 14px;">${data.disclaimer || 'This is not a medical diagnosis. Always consult with a qualified healthcare provider.'}</em>
      `;
    } else {
      // Unknown/error case
      responseHTML = `
        <strong>Unable to Analyze</strong><br><br>
        ${data.message}<br><br>
        <strong>Recommendations:</strong>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      `;
    }
    
    addBotMessage(responseHTML);
    
    // Save consultation
    consultation.response = responseHTML;
    consultation.severity = data.severity;
    consultation.detectedSymptoms = data.detected_symptoms;
    consultation.possibleConditions = data.conditions;
    
    state.consultations.push(consultation);
    state.history.push(consultation);
    saveState();
    updateUI();
    
  } catch (error) {
    console.error('Error processing symptoms:', error);
    removeLoadingMessage();
    
    // Fallback to local processing
    const responseHTML = `
      <strong style="color: #E63946;">⚠️ Connection Error</strong><br><br>
      Unable to connect to the analysis service. This could be because:<br>
      <ul>
        <li>The backend server is not running</li>
        <li>There's a network connectivity issue</li>
        <li>The API endpoint is incorrect</li>
      </ul>
      <br>
      <strong>To fix this:</strong><br>
      1. Make sure your Python backend is running: <code>python app.py</code><br>
      2. Check that it's accessible at: <code>${API_URL}</code><br>
      3. Ensure CORS is properly configured<br><br>
      <em>For now, using basic symptom detection...</em>
    `;
    
    addBotMessage(responseHTML);
    
    // Try local fallback
    processSymptomsFallback(text, consultation);
  }
}

// Fallback local processing (when API is unavailable)
function processSymptomsFallback(text, consultation) {
  const textLower = text.toLowerCase();
  
  // Simple local detection
  const commonSymptoms = extractCommonSymptoms(textLower);
  
  if (commonSymptoms.length === 0) {
    addBotMessage(`
      <strong>Symptom Description Received</strong><br><br>
      I've recorded your symptoms, but I need the backend AI to provide proper analysis.<br><br>
      Please make sure the Python backend is running for full functionality.
    `);
    return;
  }
  
  const symptomsText = commonSymptoms.join(', ');
  addBotMessage(`
    <strong>Basic Symptom Detection (Local)</strong><br><br>
    Detected: <em>${symptomsText}</em><br><br>
    For detailed analysis including possible conditions and recommendations, 
    please connect to the Python backend.<br><br>
    <em>This is a limited offline mode.</em>
  `);
  
  consultation.detectedSymptoms = commonSymptoms;
  consultation.severity = 'unknown';
  state.consultations.push(consultation);
  state.history.push(consultation);
  saveState();
  updateUI();
}

function extractCommonSymptoms(text) {
  const symptoms = [];
  const symptomMap = {
    'fever': ['fever', 'pyrexia', 'high temperature'],
    'cough': ['cough', 'coughing'],
    'headache': ['headache', 'head pain', 'cephalalgia'],
    'sore throat': ['sore throat', 'throat pain'],
    'runny nose': ['runny nose', 'nasal discharge'],
    'body pain': ['body pain', 'myalgia', 'muscle pain'],
    'nausea': ['nausea', 'feeling sick'],
    'vomiting': ['vomiting', 'throwing up'],
    'diarrhea': ['diarrhea', 'loose stool'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'weakness'],
    'chills': ['chills', 'shivering'],
    'congestion': ['congestion', 'stuffy nose', 'blocked nose']
  };
  
  for (const [symptom, keywords] of Object.entries(symptomMap)) {
    if (keywords.some(kw => text.includes(kw))) {
      symptoms.push(symptom);
    }
  }
  
  return symptoms;
}

// ==================== NEW CHAT ====================
newChatBtn.addEventListener('click', () => {
  chat.innerHTML = '';
  chat.classList.add('hidden');
  chatForm.classList.add('hidden');
  centerPrompt.classList.remove('hidden');
  switchView('chat');
});

// ==================== PROFILE MANAGEMENT ====================
function updateUI() {
  // Update profile display
  profileName.textContent = state.profile.name;
  profileEmail.textContent = state.profile.email;
  consultationCount.textContent = state.consultations.length;
  prescriptionCount.textContent = state.prescriptions.length;
  
  // Update profile form
  document.getElementById('profileAge').value = state.profile.age || '';
  document.getElementById('profileBloodType').value = state.profile.bloodType || 'Select';
  document.getElementById('profileHeight').value = state.profile.height || '';
  document.getElementById('profileWeight').value = state.profile.weight || '';
  document.getElementById('emergencyName').value = state.profile.emergencyContact.name || '';
  document.getElementById('emergencyPhone').value = state.profile.emergencyContact.phone || '';
  
  // Update conditions
  updateMedicalTags('medicalConditions', state.profile.conditions);
  updateMedicalTags('allergies', state.profile.allergies);
  
  // Update prescriptions
  renderPrescriptions();
  
  // Update history
  renderHistory();
}

function updateMedicalTags(containerId, items) {
  const container = document.getElementById(containerId);
  const addBtn = container.querySelector('.tag-add');
  
  // Clear existing tags except add button
  container.querySelectorAll('.medical-tag').forEach(tag => tag.remove());
  
  // Add tags
  items.forEach((item, index) => {
    const tag = document.createElement('div');
    tag.className = 'medical-tag';
    tag.innerHTML = `
      ${item}
      <button class="tag-remove" data-index="${index}">×</button>
    `;
    container.insertBefore(tag, addBtn);
    
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      items.splice(index, 1);
      saveState();
      updateUI();
    });
  });
}

// Add condition
document.getElementById('addConditionBtn').addEventListener('click', () => {
  const condition = prompt('Enter medical condition:');
  if (condition && condition.trim()) {
    state.profile.conditions.push(condition.trim());
    saveState();
    updateUI();
  }
});

// Add allergy
document.getElementById('addAllergyBtn').addEventListener('click', () => {
  const allergy = prompt('Enter allergy:');
  if (allergy && allergy.trim()) {
    state.profile.allergies.push(allergy.trim());
    saveState();
    updateUI();
  }
});

// Save profile
document.querySelector('.save-profile-btn').addEventListener('click', () => {
  state.profile.age = document.getElementById('profileAge').value;
  state.profile.bloodType = document.getElementById('profileBloodType').value;
  state.profile.height = document.getElementById('profileHeight').value;
  state.profile.weight = document.getElementById('profileWeight').value;
  state.profile.emergencyContact.name = document.getElementById('emergencyName').value;
  state.profile.emergencyContact.phone = document.getElementById('emergencyPhone').value;
  
  saveState();
  
  // Show success message
  alert('✓ Profile saved successfully!');
});

// Edit profile button
document.querySelector('.edit-profile-btn').addEventListener('click', () => {
  const name = prompt('Enter your name:', state.profile.name);
  if (name) {
    state.profile.name = name;
    const email = prompt('Enter your email:', state.profile.email);
    if (email) {
      state.profile.email = email;
      saveState();
      updateUI();
    }
  }
});

// ==================== PRESCRIPTIONS ====================
const prescriptionModal = document.getElementById('prescriptionModal');
const prescriptionForm = document.getElementById('prescriptionForm');
const addPrescriptionBtn = document.getElementById('addPrescriptionBtn');
const closePrescriptionModal = document.getElementById('closePrescriptionModal');
const cancelPrescription = document.getElementById('cancelPrescription');

addPrescriptionBtn.addEventListener('click', () => {
  prescriptionModal.classList.add('active');
});

closePrescriptionModal.addEventListener('click', () => {
  prescriptionModal.classList.remove('active');
  prescriptionForm.reset();
});

cancelPrescription.addEventListener('click', () => {
  prescriptionModal.classList.remove('active');
  prescriptionForm.reset();
});

prescriptionModal.addEventListener('click', (e) => {
  if (e.target === prescriptionModal) {
    prescriptionModal.classList.remove('active');
    prescriptionForm.reset();
  }
});

prescriptionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const prescription = {
    id: Date.now(),
    name: document.getElementById('medName').value,
    dosage: document.getElementById('medDosage').value,
    frequency: document.getElementById('medFrequency').value,
    duration: document.getElementById('medDuration').value,
    notes: document.getElementById('medNotes').value,
    dateAdded: new Date().toISOString()
  };
  
  state.prescriptions.push(prescription);
  saveState();
  updateUI();
  
  prescriptionModal.classList.remove('active');
  prescriptionForm.reset();
});

function renderPrescriptions() {
  const grid = document.getElementById('prescriptionsGrid');
  
  if (state.prescriptions.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>No prescriptions yet</h3>
        <p>Add your first prescription to track medications</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = state.prescriptions.map(rx => `
    <div class="prescription-card">
      <div class="prescription-header">
        <h4>${rx.name}</h4>
        <div class="prescription-actions">
          <button onclick="deletePrescription(${rx.id})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="prescription-detail">
        <div class="prescription-label">Dosage</div>
        <div class="prescription-value">${rx.dosage}</div>
      </div>
      <div class="prescription-detail">
        <div class="prescription-label">Frequency</div>
        <div class="prescription-value">${rx.frequency}</div>
      </div>
      <div class="prescription-detail">
        <div class="prescription-label">Duration</div>
        <div class="prescription-value">${rx.duration || 'Ongoing'}</div>
      </div>
      ${rx.notes ? `<div class="prescription-notes">${rx.notes}</div>` : ''}
    </div>
  `).join('');
}

function deletePrescription(id) {
  if (confirm('Are you sure you want to delete this prescription?')) {
    state.prescriptions = state.prescriptions.filter(rx => rx.id !== id);
    saveState();
    updateUI();
  }
}

// ==================== HISTORY ====================
function renderHistory() {
  const timeline = document.getElementById('historyTimeline');
  
  if (state.history.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>No consultation history</h3>
        <p>Your past consultations will appear here</p>
      </div>
    `;
    return;
  }
  
  timeline.innerHTML = state.history.map((item, index) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const severityColors = {
      emergency: '#E63946',
      moderate: '#F4A261',
      mild: '#06D6A0',
      unknown: '#737373'
    };
    
    const markerColor = severityColors[item.severity] || '#2D5F8D';
    
    return `
      <div class="history-item">
        <div class="history-marker" style="background: ${markerColor}; box-shadow: 0 0 0 2px ${markerColor};"></div>
        <div class="history-card">
          <div class="history-date">${dateStr}</div>
          <div class="history-title">Consultation #${state.history.length - index}</div>
          ${item.detectedSymptoms && item.detectedSymptoms.length > 0 ? `
            <div class="history-symptoms">
              ${item.detectedSymptoms.map(s => `<span class="symptom-badge">${s}</span>`).join('')}
            </div>
          ` : ''}
          <p style="margin-top: 12px; color: #737373; font-size: 15px;">${item.symptoms}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Filter history
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // Implement filtering logic here
  });
});

// ==================== QUICK ACTIONS ====================
document.querySelectorAll('.quick-btn').forEach((btn, index) => {
  btn.addEventListener('click', () => {
    if (index === 0) { // Check Symptoms
      startInput.focus();
    } else if (index === 1) { // View Medications
      switchView('prescriptions');
    } else if (index === 2) { // Health Tips
      addBotMessage(`
        <strong>💡 Daily Health Tips:</strong><br><br>
        <ul style="line-height: 2;">
          <li><strong>Stay Hydrated:</strong> Drink at least 8 glasses of water daily</li>
          <li><strong>Regular Exercise:</strong> Aim for 30 minutes of physical activity</li>
          <li><strong>Balanced Diet:</strong> Include fruits, vegetables, and whole grains</li>
          <li><strong>Quality Sleep:</strong> Get 7-9 hours of sleep each night</li>
          <li><strong>Stress Management:</strong> Practice meditation or deep breathing</li>
          <li><strong>Regular Checkups:</strong> Visit your doctor for preventive care</li>
        </ul>
      `);
      centerPrompt.classList.add("hidden");
      chat.classList.remove("hidden");
      chatForm.classList.remove("hidden");
    }
  });
});

// ==================== API HEALTH CHECK ====================
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✓ Backend API is connected');
    }
  } catch (error) {
    console.warn('⚠️ Backend API is not available. Local fallback mode will be used.');
    console.warn('To enable full functionality, run: python app.py');
  }
}

// ==================== INITIALIZATION ====================
loadState();
updateUI();
checkAPIHealth();
