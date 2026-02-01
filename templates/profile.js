document.addEventListener('DOMContentLoaded', () => {
  initProfile();
});

/* =========================
   INIT
========================= */
function initProfile() {
  bindEvents();
  loadProfile();
}

/* =========================
   HELPERS
========================= */
function getSehatData() {
  const raw = localStorage.getItem('sehatData');
  const data = raw ? JSON.parse(raw) : {};

  // normalize structure
  data.profile ||= {};
  data.profile.conditions ||= [];
  data.profile.allergies ||= [];
  data.profile.emergencyContact ||= {};
  data.profile.insurance ||= {};
  data.consultations ||= [];
  data.prescriptions ||= [];

  return data;
}

function saveSehatData(data) {
  localStorage.setItem('sehatData', JSON.stringify(data));
}

/* =========================
   LOAD PROFILE
========================= */
function loadProfile() {
  const data = getSehatData();
  const p = data.profile;

  // Header
  document.getElementById('displayName').textContent = p.name || 'Guest User';
  document.getElementById('displayEmail').textContent = p.email || 'guest@sehat.com';

  // Stats
  document.getElementById('consultationCount').textContent =
    Array.isArray(data.consultations) ? data.consultations.length : 0;

  document.getElementById('prescriptionCount').textContent =
    Array.isArray(data.prescriptions) ? data.prescriptions.length : 0;

  // Personal info
  setValue('fullName', p.name);
  setValue('emailAddress', p.email);
  setValue('dateOfBirth', p.dob);
  setValue('gender', p.gender || 'Prefer not to say');
  setValue('phoneNumber', p.phone);
  setValue('bloodType', p.bloodType || 'Select');

  // Metrics
  setValue('height', p.height);
  setValue('weight', p.weight);
  setValue('activityLevel', p.activityLevel || 'Sedentary');

  calculateBMI();

  // Emergency
  setValue('emergencyName', p.emergencyContact.name);
  setValue('emergencyRelation', p.emergencyContact.relation);
  setValue('emergencyPhone', p.emergencyContact.phone);
  setValue('emergencyAltPhone', p.emergencyContact.altPhone);

  // Insurance
  setValue('insuranceProvider', p.insurance.provider);
  setValue('policyNumber', p.insurance.policyNumber);
  setValue('groupNumber', p.insurance.groupNumber);
  setValue('insuranceExpiry', p.insurance.expiry);

  // Tags
  updateTags('medicalConditions', p.conditions);
  updateTags('allergies', p.allergies);

  // Member since
  if (p.memberSince) {
    const d = new Date(p.memberSince);
    document.getElementById('memberSince').textContent =
      d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

function setValue(id, value = '') {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

/* =========================
   BMI
========================= */
function calculateBMI() {
  const h = parseFloat(document.getElementById('height').value);
  const w = parseFloat(document.getElementById('weight').value);
  const bmiField = document.getElementById('bmi');

  if (!h || !w) {
    bmiField.value = '';
    return;
  }

  const m = h / 100;
  const bmi = (w / (m * m)).toFixed(1);

  let label = '';
  if (bmi < 18.5) label = 'Underweight';
  else if (bmi < 25) label = 'Normal';
  else if (bmi < 30) label = 'Overweight';
  else label = 'Obese';

  bmiField.value = `${bmi} (${label})`;
}

/* =========================
   TAGS
========================= */
function updateTags(containerId, items) {
  const container = document.getElementById(containerId);
  const addBtn = container.querySelector('.tag-add');

  container.querySelectorAll('.medical-tag').forEach(t => t.remove());

  items.forEach((item, i) => {
    const tag = document.createElement('div');
    tag.className = 'medical-tag';
    tag.innerHTML = `
      ${item}
      <button class="tag-remove" data-index="${i}">×</button>
    `;
    tag.querySelector('button').onclick = () => removeTag(containerId, i);
    container.insertBefore(tag, addBtn);
  });
}

function removeTag(containerId, index) {
  const data = getSehatData();

  if (containerId === 'medicalConditions') {
    data.profile.conditions.splice(index, 1);
  } else {
    data.profile.allergies.splice(index, 1);
  }

  saveSehatData(data);
  loadProfile();
}

/* =========================
   EDIT MODE
========================= */
function toggleEditMode(section) {
  const map = {
    personal: ['fullName', 'emailAddress', 'dateOfBirth', 'gender', 'phoneNumber', 'bloodType'],
    metrics: ['height', 'weight', 'activityLevel'],
    emergency: ['emergencyName', 'emergencyRelation', 'emergencyPhone', 'emergencyAltPhone'],
    insurance: ['insuranceProvider', 'policyNumber', 'groupNumber', 'insuranceExpiry']
  };

  map[section].forEach(id => {
    const el = document.getElementById(id);
    el.disabled = !el.disabled;
  });
}

/* =========================
   SAVE / RESET / EXPORT
========================= */
function saveProfile() {
  const data = getSehatData();
  const p = data.profile;

  p.name = val('fullName');
  p.email = val('emailAddress');
  p.dob = val('dateOfBirth');
  p.gender = val('gender');
  p.phone = val('phoneNumber');
  p.bloodType = val('bloodType');
  p.height = val('height');
  p.weight = val('weight');
  p.activityLevel = val('activityLevel');

  p.emergencyContact.name = val('emergencyName');
  p.emergencyContact.relation = val('emergencyRelation');
  p.emergencyContact.phone = val('emergencyPhone');
  p.emergencyContact.altPhone = val('emergencyAltPhone');

  p.insurance.provider = val('insuranceProvider');
  p.insurance.policyNumber = val('policyNumber');
  p.insurance.groupNumber = val('groupNumber');
  p.insurance.expiry = val('insuranceExpiry');

  if (!p.memberSince) p.memberSince = new Date().toISOString();

  saveSehatData(data);
  alert('✓ Profile saved successfully');
  loadProfile();
}

function resetProfile() {
  if (confirm('Reset all unsaved changes?')) loadProfile();
}

function exportProfile() {
  const { profile } = getSehatData();
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sehat-profile-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function val(id) {
  return document.getElementById(id).value;
}

/* =========================
   EVENTS
========================= */
function bindEvents() {
  document.getElementById('editProfileBtn').onclick = () => {
    const name = prompt('Enter your name:', val('fullName'));
    if (!name) return;

    const email = prompt('Enter your email:', val('emailAddress'));
    if (!email) return;

    setValue('fullName', name);
    setValue('emailAddress', email);
    saveProfile();
  };

  document.getElementById('addConditionBtn').onclick = () => {
    const v = prompt('Enter medical condition:');
    if (!v) return;
    const d = getSehatData();
    d.profile.conditions.push(v.trim());
    saveSehatData(d);
    loadProfile();
  };

  document.getElementById('addAllergyBtn').onclick = () => {
    const v = prompt('Enter allergy:');
    if (!v) return;
    const d = getSehatData();
    d.profile.allergies.push(v.trim());
    saveSehatData(d);
    loadProfile();
  };

  document.getElementById('height').addEventListener('input', calculateBMI);
  document.getElementById('weight').addEventListener('input', calculateBMI);
}
