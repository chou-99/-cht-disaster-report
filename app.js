const form = document.querySelector('#disaster-form');
const reportsList = document.querySelector('#reports-list');
const filterSelect = document.querySelector('#filter');

const STORAGE_KEY = 'disaster-reports';

const defaultReports = [
  {
    id: crypto.randomUUID(),
    reporterName: '林小姐',
    contact: '0912-***-321',
    location: '安平區健康路與永華路口',
    category: '淹水',
    description: '午後豪雨造成路面積水約20公分，車輛行進困難。',
    timestamp: new Date().toISOString(),
    photoData: null,
  },
  {
    id: crypto.randomUUID(),
    reporterName: '王先生',
    contact: '0933-***-876',
    location: '仁德區中山路高架橋下',
    category: '交通事故',
    description: '小客車與機車擦撞，現場有輕傷者，警方已到場處理。',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    photoData: null,
  },
];

function loadReports() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReports));
    return defaultReports;
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse saved reports', error);
  }

  return defaultReports;
}

let reports = loadReports();

function saveReports() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function createReportCard(report) {
  const template = document.querySelector('#report-card-template');
  const card = template.content.firstElementChild.cloneNode(true);

  card.dataset.category = report.category;
  card.querySelector('.report-card__category').textContent = report.category;
  card.querySelector('.report-card__time').textContent = formatDate(report.timestamp);
  card.querySelector('.report-card__location').textContent = report.location;
  card.querySelector('.report-card__description').textContent = report.description;
  card.querySelector('.report-card__reporter').textContent = `通報人：${report.reporterName}`;
  card.querySelector('.report-card__contact').textContent = `聯絡方式：${report.contact}`;

  const photoEl = card.querySelector('.report-card__photo');
  if (report.photoData) {
    photoEl.src = report.photoData;
    photoEl.hidden = false;
  } else {
    photoEl.hidden = true;
  }

  return card;
}

function renderReports(filter = 'all') {
  reportsList.innerHTML = '';

  const filtered =
    filter === 'all' ? reports : reports.filter((report) => report.category === filter);

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = '目前沒有符合條件的通報。';
    reportsList.appendChild(empty);
    return;
  }

  filtered
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((report) => reportsList.appendChild(createReportCard(report)));
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const newReport = {
    id: crypto.randomUUID(),
    reporterName: formData.get('reporterName').trim(),
    contact: formData.get('contact').trim(),
    location: formData.get('location').trim(),
    category: formData.get('category'),
    description: formData.get('description').trim(),
    timestamp: new Date().toISOString(),
    photoData: null,
  };

  const file = formData.get('photo');
  if (file && file.size) {
    try {
      newReport.photoData = await readFileAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file', error);
    }
  }

  reports = [newReport, ...reports];
  saveReports();
  renderReports(filterSelect.value);
  form.reset();
  form.querySelector('input, select, textarea')?.focus();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', (event) => {
  handleSubmit(event);
});

filterSelect.addEventListener('change', () => {
  renderReports(filterSelect.value);
});

renderReports();
