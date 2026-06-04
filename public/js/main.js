// NyondoStock - Main JS


const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  // Close sidebar 
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

// Highlight active sidebar link
const currentPath = window.location.pathname;
document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href && currentPath.startsWith(href) && href !== '/') {
    link.classList.add('active');
  } else if (href === '/dashboard' && currentPath === '/dashboard') {
    link.classList.add('active');
  }
});

// Auto-dismiss alerts after 4 seconds
document.querySelectorAll('.alert.alert-success, .alert.alert-danger').forEach(alert => {
  setTimeout(() => {
    const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
    if (bsAlert) bsAlert.close();
  }, 4000);
});

// Format number inputs with commas (display only)
function formatNumber(n) {
  return parseInt(n || 0).toLocaleString();
}

// Confirm before delete forms
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm || 'Are you sure?')) {
      e.preventDefault();
    }
  });
});

// Phone validation for Uganda
function validateUgandaPhone(phone) {
  return /^(07|06)\d{8}$/.test(phone.replace(/\s/g, ''));
}

document.querySelectorAll('input[type="tel"]').forEach(input => {
  input.addEventListener('blur', function() {
    const val = this.value.replace(/\s/g, '');
    if (val && !validateUgandaPhone(val)) {
      this.classList.add('is-invalid');
      let msg = this.parentNode.querySelector('.invalid-feedback');
      if (!msg) {
        msg = document.createElement('div');
        msg.className = 'invalid-feedback';
        this.parentNode.appendChild(msg);
      }
      msg.textContent = 'Must be a valid Ugandan phone (07XXXXXXXX or 06XXXXXXXX)';
    } else {
      this.classList.remove('is-invalid');
    }
  });
});

// Download functionality for reports and receipts
function downloadReceipt(saleId) {
  const element = document.querySelector('.receipt-card');
  if (!element) return alert('Receipt content is not available for download.');
  if (typeof html2pdf === 'undefined') {
    window.print();
    return;
  }
  const opt = {
    margin: 10,
    filename: `receipt-${saleId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3, backgroundColor: '#ffffff', letterRendering: true, useCORS: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    pagebreak: { mode: ['css', 'legacy'] }
  };
  try {
    html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('PDF download failed:', err);
    window.print();
  }
}

function downloadReport() {
  const element = document.querySelector('.report-content');
  if (element) {
    window.print();
    return;
  }
  alert('Report content not found.');
}
