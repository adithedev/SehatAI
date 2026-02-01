// prescriptions.js - FIXED saving + display + stats (2025-02-01)

let currentEditId = null;

// ────────────────────────────────────────────────
// Load data
// ────────────────────────────────────────────────
function loadPrescriptions() {
  const saved = localStorage.getItem('sehatData');
  let prescriptions = [];
  if (saved) {
    try {
      const data = JSON.parse(saved);
      prescriptions = data.prescriptions || [];
    } catch (e) {
      console.error("Error loading prescriptions:", e);
    }
  }
  renderPrescriptions(prescriptions);
  updateStats(prescriptions);
}

// ────────────────────────────────────────────────
// Render cards (full fields displayed)
// ────────────────────────────────────────────────
function renderPrescriptions(prescriptions, filter = 'all') {
  const grid = document.getElementById('prescriptionsGrid');

  let filtered = [...prescriptions];

  if (filter === 'active') {
    filtered = filtered.filter(p => !isExpired(p));
  } else if (filter === 'expired') {
    filtered = filtered.filter(isExpired);
  } else if (filter === 'refill') {
    filtered = filtered.filter(p => (p.refills || 0) <= 1);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>No prescriptions found</h3>
        <p>${filter === 'all' ? 'Add your first prescription' : `No ${filter} prescriptions`}</p>
        <button class="btn-primary" onclick="document.getElementById('addPrescriptionBtn').click()">
          Add Prescription
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="prescription-card">
      <div class="prescription-header">
        <h4>${p.name || 'Unnamed'}</h4>
        <div class="prescription-actions">
          <button onclick="viewPrescription('${p.id}')" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button onclick="editPrescription('${p.id}')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button onclick="deletePrescription('${p.id}')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="prescription-detail">
        <div class="prescription-label">Dosage</div>
        <div class="prescription-value">${p.dosage || '—'}</div>
      </div>

      <div class="prescription-detail">
        <div class="prescription-label">Frequency</div>
        <div class="prescription-value">${p.frequency || '—'}</div>
      </div>

      ${p.form ? `
        <div class="prescription-detail">
          <div class="prescription-label">Form</div>
          <div class="prescription-value">${p.form}</div>
        </div>
      ` : ''}

      ${p.timeOfDay ? `
        <div class="prescription-detail">
          <div class="prescription-label">Time of Day</div>
          <div class="prescription-value">${p.timeOfDay}</div>
        </div>
      ` : ''}

      ${p.startDate ? `
        <div class="prescription-detail">
          <div class="prescription-label">Start Date</div>
          <div class="prescription-value">${new Date(p.startDate).toLocaleDateString()}</div>
        </div>
      ` : ''}

      <div class="prescription-detail">
        <div class="prescription-label">Duration</div>
        <div class="prescription-value">${p.duration || 'Ongoing'}</div>
      </div>

      ${p.doctor ? `
        <div class="prescription-detail">
          <div class="prescription-label">Doctor</div>
          <div class="prescription-value">${p.doctor}</div>
        </div>
      ` : ''}

      ${p.pharmacy ? `
        <div class="prescription-detail">
          <div class="prescription-label">Pharmacy</div>
          <div class="prescription-value">${p.pharmacy}</div>
        </div>
      ` : ''}

      ${p.refills !== undefined ? `
        <div class="prescription-detail">
          <div class="prescription-label">Refills Remaining</div>
          <div class="prescription-value">${p.refills}</div>
        </div>
      ` : ''}

      ${p.notes ? `
        <div class="prescription-notes">${p.notes}</div>
      ` : ''}

      ${p.reminder ? `
        <div class="prescription-detail">
          <strong>Reminder set</strong>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ────────────────────────────────────────────────
// Status & stats
// ────────────────────────────────────────────────
function isExpired(p) {
  // You can add real expiry logic here later
  return false;
}

function updateStats(prescriptions) {
  const total = prescriptions.length;
  const refillNeeded = prescriptions.filter(p => (p.refills || 0) <= 1).length;

  document.getElementById('countAll').textContent = total;
  document.getElementById('countActive').textContent = total - prescriptions.filter(isExpired).length;
  document.getElementById('countExpired').textContent = prescriptions.filter(isExpired).length;
  document.getElementById('countRefill').textContent = refillNeeded;

  document.getElementById('statActive').textContent = total;
  document.getElementById('statToday').textContent = total; // placeholder
  document.getElementById('statNeedRefill').textContent = refillNeeded;
}

// ────────────────────────────────────────────────
// Modal open/close
// ────────────────────────────────────────────────
const modal = document.getElementById('prescriptionModal');
const viewModal = document.getElementById('viewPrescriptionModal');

document.getElementById('addPrescriptionBtn')?.addEventListener('click', () => {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Prescription';
  document.getElementById('prescriptionForm').reset();
  modal.classList.add('active');
});

[document.getElementById('closePrescriptionModal'), document.getElementById('cancelPrescription')].forEach(el => {
  el?.addEventListener('click', () => {
    modal.classList.remove('active');
    currentEditId = null;
  });
});

// ────────────────────────────────────────────────
// SAVE - this is the fixed saving logic
// ────────────────────────────────────────────────
document.getElementById('prescriptionForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  // Get or initialize data
  let data = JSON.parse(localStorage.getItem('sehatData') || '{}');
  data.prescriptions = data.prescriptions || [];

  // Collect form values
  const prescription = {
    id: currentEditId || Date.now().toString(),
    name: document.getElementById('medName')?.value.trim() || 'Unnamed',
    dosage: document.getElementById('medDosage')?.value.trim() || '',
    form: document.getElementById('medForm')?.value || '',
    frequency: document.getElementById('medFrequency')?.value || '',
    timeOfDay: Array.from(document.getElementById('medTimeOfDay')?.selectedOptions || [])
      .map(opt => opt.value.trim())
      .filter(Boolean)
      .join(', '),
    startDate: document.getElementById('medStartDate')?.value || '',
    duration: document.getElementById('medDuration')?.value.trim() || 'Ongoing',
    doctor: document.getElementById('medDoctor')?.value.trim() || '',
    pharmacy: document.getElementById('medPharmacy')?.value.trim() || '',
    refills: Number(document.getElementById('medRefills')?.value) || 0,
    notes: document.getElementById('medNotes')?.value.trim() || '',
    reminder: document.getElementById('medReminder')?.checked || false,
    dateAdded: new Date().toISOString()
  };

  console.log("Saving prescription:", prescription); // ← debug - check console

  if (currentEditId) {
    const index = data.prescriptions.findIndex(p => p.id === currentEditId);
    if (index !== -1) {
      data.prescriptions[index] = prescription;
    }
  } else {
    data.prescriptions.push(prescription);
  }

  localStorage.setItem('sehatData', JSON.stringify(data));

  modal.classList.remove('active');
  currentEditId = null;
  loadPrescriptions();

  // Optional: show success feedback
  alert("Prescription saved successfully!");
});

// ────────────────────────────────────────────────
// View, Edit, Delete
// ────────────────────────────────────────────────
function viewPrescription(id) {
  const data = JSON.parse(localStorage.getItem('sehatData') || '{}');
  const rx = data.prescriptions?.find(p => p.id === id);
  if (!rx) {
    alert("Prescription not found");
    return;
  }

  document.getElementById('viewMedName').textContent = rx.name || 'Medication Details';

  let html = '';
  if (rx.dosage) html += `<div class="prescription-detail"><strong>Dosage:</strong> ${rx.dosage}</div>`;
  if (rx.form) html += `<div class="prescription-detail"><strong>Form:</strong> ${rx.form}</div>`;
  if (rx.frequency) html += `<div class="prescription-detail"><strong>Frequency:</strong> ${rx.frequency}</div>`;
  if (rx.timeOfDay) html += `<div class="prescription-detail"><strong>Time:</strong> ${rx.timeOfDay}</div>`;
  if (rx.startDate) html += `<div class="prescription-detail"><strong>Start:</strong> ${new Date(rx.startDate).toLocaleDateString()}</div>`;
  if (rx.duration) html += `<div class="prescription-detail"><strong>Duration:</strong> ${rx.duration}</div>`;
  if (rx.doctor) html += `<div class="prescription-detail"><strong>Doctor:</strong> ${rx.doctor}</div>`;
  if (rx.pharmacy) html += `<div class="prescription-detail"><strong>Pharmacy:</strong> ${rx.pharmacy}</div>`;
  html += `<div class="prescription-detail"><strong>Refills Remaining:</strong> ${rx.refills ?? 0}</div>`;
  if (rx.notes) html += `<div class="prescription-detail"><strong>Notes:</strong><br>${rx.notes}</div>`;
  if (rx.reminder) html += `<div class="prescription-detail"><strong>Reminder:</strong> Enabled</div>`;

  document.getElementById('prescriptionDetails').innerHTML = html || '<p>No details available.</p>';

  viewModal.classList.add('active');

  document.getElementById('editFromView').onclick = () => {
    viewModal.classList.remove('active');
    editPrescription(id);
  };
}

function editPrescription(id) {
  const data = JSON.parse(localStorage.getItem('sehatData') || '{}');
  const rx = data.prescriptions?.find(p => p.id === id);
  if (!rx) return;

  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Prescription';

  document.getElementById('medName').value = rx.name || '';
  document.getElementById('medDosage').value = rx.dosage || '';
  document.getElementById('medForm').value = rx.form || 'Tablet';
  document.getElementById('medFrequency').value = rx.frequency || 'Once daily';

  // Time of day multi-select
  const timeSelect = document.getElementById('medTimeOfDay');
  if (timeSelect) {
    Array.from(timeSelect.options).forEach(opt => {
      opt.selected = (rx.timeOfDay || '').split(', ').includes(opt.value);
    });
  }

  document.getElementById('medStartDate').value = rx.startDate || '';
  document.getElementById('medDuration').value = rx.duration || '';
  document.getElementById('medDoctor').value = rx.doctor || '';
  document.getElementById('medPharmacy').value = rx.pharmacy || '';
  document.getElementById('medRefills').value = rx.refills ?? 0;
  document.getElementById('medNotes').value = rx.notes || '';
  document.getElementById('medReminder').checked = rx.reminder || false;

  modal.classList.add('active');
}

function deletePrescription(id) {
  if (!confirm('Delete this prescription? This cannot be undone.')) return;

  let data = JSON.parse(localStorage.getItem('sehatData') || '{}');
  data.prescriptions = (data.prescriptions || []).filter(p => p.id !== id);
  localStorage.setItem('sehatData', JSON.stringify(data));
  loadPrescriptions();
}

// ────────────────────────────────────────────────
// Filters, Sort, Search
// ────────────────────────────────────────────────
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const saved = localStorage.getItem('sehatData');
    if (saved) {
      const data = JSON.parse(saved);
      renderPrescriptions(data.prescriptions || [], chip.dataset.filter);
    }
  });
});

document.getElementById('sortSelect')?.addEventListener('change', e => {
  const saved = localStorage.getItem('sehatData');
  if (!saved) return;

  const data = JSON.parse(saved);
  let list = [...(data.prescriptions || [])];

  switch (e.target.value) {
    case 'newest':
      list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
      break;
    case 'oldest':
      list.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded));
      break;
    case 'name':
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
  }

  renderPrescriptions(list);
});

document.getElementById('searchInput')?.addEventListener('input', e => {
  const query = e.target.value.toLowerCase().trim();
  const saved = localStorage.getItem('sehatData');
  if (!saved) return;

  const data = JSON.parse(saved);
  const filtered = (data.prescriptions || []).filter(p =>
    (p.name || '').toLowerCase().includes(query) ||
    (p.doctor || '').toLowerCase().includes(query) ||
    (p.notes || '').toLowerCase().includes(query) ||
    (p.frequency || '').toLowerCase().includes(query)
  );

  renderPrescriptions(filtered);
});

// Close view modal
document.getElementById('closeViewModal')?.addEventListener('click', () => viewModal.classList.remove('active'));
document.getElementById('closeDetailsBtn')?.addEventListener('click', () => viewModal.classList.remove('active'));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPrescriptions();
});