// Data dan Inisialisasi
let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let currentAccount = null;

// Fungsi Utama
function createAccount() {
  const name = document.getElementById("signup-name").value.trim();
  const password = document.getElementById("signup-password").value;
  const pin = document.getElementById("signup-pin").value;

  // Validasi kuat
  if (!name || !password || pin.length !== 4 || !/^\d+$/.test(pin)) {
    showToast("Harap isi semua field dan pastikan PIN 4 digit angka", "error");
    return;
  }

  if (accounts.some(acc => acc.name === name)) {
    showToast("Nama sudah digunakan", "error");
    return;
  }

  const newAccount = { 
    name, 
    password, 
    pin, 
    balance: 0, 
    history: [] 
  };
  
  accounts.push(newAccount);
  saveData();
  showToast("Akun berhasil dibuat!", "success");
  showScreen("login-screen");
  clearForm("signup-form");
}

function login() {
  const name = document.getElementById("login-name").value.trim();
  const password = document.getElementById("login-password").value;
  const pin = document.getElementById("login-pin").value;

  const account = accounts.find(acc => 
    acc.name === name && 
    acc.password === password && 
    acc.pin === pin
  );

  if (account) {
    currentAccount = account;
    showScreen("menu-screen");
    showToast(`Selamat datang, ${account.name}!`, "success");
    clearForm("login-form");
  } else {
    showToast("Nama, PIN, atau Password salah!", "error");
  }
}

function logout() {
  currentAccount = null;
  showScreen("login-screen");
  clearForm("login-form");
}

// Transaksi
function deposit() {
  const amount = getNumericValue("deposit-amount");
  
  if (amount <= 0 || amount > 100_000_000_000) {
    showToast("Jumlah deposit tidak valid (maks: Rp 100 Miliar)", "error");
    return;
  }

  currentAccount.balance += amount;
  addHistory(`+ Rp ${formatCurrency(amount)}`, "deposit");
  saveData();
  
  showToast(`Deposit berhasil: Rp ${formatCurrency(amount)}`, "success");
  makeItRain();
  showScreen("balance-screen");
  clearForm("deposit-form");
}

function withdraw() {
  const amount = getNumericValue("withdraw-amount");
  
  if (amount <= 0) {
    showToast("Jumlah penarikan harus positif", "error");
    return;
  }
  
  if (amount > currentAccount.balance) {
    showToast("Saldo tidak cukup", "error");
    return;
  }

  currentAccount.balance -= amount;
  addHistory(`- Rp ${formatCurrency(amount)}`, "withdraw");
  saveData();
  
  showToast(`Penarikan berhasil: Rp ${formatCurrency(amount)}`, "success");
  showScreen("balance-screen");
  clearForm("withdraw-form");
}

function transferMoney() {
  // Validasi akun login
  if (!currentAccount) {
    showToast("Silakan login terlebih dahulu", "error");
    showScreen("login-screen");
    return;
  }

  // Ambil data input
  const recipientName = document.getElementById("transfer-recipient").value.trim();
  const amount = getNumericValue("transfer-amount");
  
  // Validasi input
  if (!recipientName) {
    showToast("Masukkan nama penerima", "error");
    return;
  }
  
  if (amount <= 0 || amount > 100_000_000) {
    showToast("Jumlah transfer tidak valid (maks: Rp 100 Juta)", "error");
    return;
  }

  // Cari akun penerima
  const recipientAccount = accounts.find(acc => acc.name === recipientName);
  
  // Validasi penerima
  if (!recipientAccount) {
    showToast("Penerima tidak ditemukan", "error");
    return;
  }
  
  if (recipientName === currentAccount.name) {
    showToast("Tidak bisa transfer ke diri sendiri", "error");
    return;
  }

  // Validasi saldo
  if (amount > currentAccount.balance) {
    showToast("Saldo tidak mencukupi", "error");
    return;
  }

  // Konfirmasi transfer
  if (!confirm(`Transfer Rp ${formatCurrency(amount)} ke ${recipientName}?`)) {
    return;
  }

  // Proses transfer
  currentAccount.balance -= amount;
  recipientAccount.balance += amount;

  // Catat transaksi
  const timestamp = new Date().toLocaleString("id-ID");
  currentAccount.history.unshift(`- Transfer Rp ${formatCurrency(amount)} ke ${recipientName} (${timestamp})`);
  recipientAccount.history.unshift(`+ Transfer Rp ${formatCurrency(amount)} dari ${currentAccount.name} (${timestamp})`);

  // Simpan perubahan 
  saveData();
  
  // Beri feedback
  showToast(`Transfer Rp ${formatCurrency(amount)} ke ${recipientName} berhasil!`, "success");
  showScreen("balance-screen");
  
  // Reset form
  document.getElementById("transfer-recipient").value = "";
  document.getElementById("transfer-amount").value = "";
}

function backToMenu() {
  if (currentAccount) {
    showScreen("menu-screen");
  } else {
    showToast("Sesi telah berakhir", "error");
    showScreen("login-screen");
  }
}

// Helper Functions
function addHistory(amount, type) {
  const timestamp = new Date().toLocaleString("id-ID");
  currentAccount.history.unshift(`${amount} (${timestamp}) - ${type}`);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  const screen = document.getElementById(id);
  screen.classList.add('active');

  // Update UI 
  if (id === 'balance-screen') {
    document.getElementById('balance-display').textContent = 
      `Rp ${formatCurrency(currentAccount.balance)}`;
  } 
  else if (id === 'history-screen') {
    const list = document.getElementById('history-list');
    list.innerHTML = currentAccount.history
      .map(item => `<li>${item}</li>`)
      .join('');
  }
}

function saveData() {
  localStorage.setItem("accounts", JSON.stringify(accounts));
}

function formatCurrency(amount) {
  return amount.toLocaleString("id-ID");
}

function getNumericValue(inputId) {
  const value = document.getElementById(inputId).value.replace(/\./g, '');
  return parseInt(value) || 0;
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

// Event Listeners
document.getElementById('deposit-amount').addEventListener('input', formatCurrencyInput);
document.getElementById('withdraw-amount').addEventListener('input', formatCurrencyInput);
document.getElementById('transfer-amount').addEventListener('input', formatCurrencyInput);

function formatCurrencyInput(event) {
  let value = event.target.value.replace(/\D/g, '');
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  event.target.value = value;
}

// Hapus semua Riwayat
function clearHistory() {
  if (!currentAccount) {
    showToast("Silakan login terlebih dahulu", "error");
    showScreen("login-screen");
    return;
  }

  if (confirm("Apakah Anda yakin ingin menghapus semua riwayat transaksi?")) {
    currentAccount.history = [];
    saveData();
    document.getElementById("history-list").innerHTML = "";
    showToast("Riwayat transaksi berhasil dihapus", "success");
  }
}

    // Fungsi untuk menampilkan modal konfirmasi transfer
    function showTransferConfirmationModal(recipientName, amount) {
      const modal = document.getElementById('transfer-confirm-modal');
      const recipientNameEl = document.getElementById('confirm-recipient-name');
      const transferAmountEl = document.getElementById('confirm-transfer-amount');
      const balanceAfterEl = document.getElementById('confirm-balance-after');
      
      // Isi detail transfer
      recipientNameEl.textContent = recipientName;
      transferAmountEl.textContent = formatCurrency(amount);
      balanceAfterEl.textContent = formatCurrency(currentAccount.balance - amount);
      
      // Tampilkan modal
      modal.style.display = 'block';
      
      // Setup event listeners untuk tombol modal
      document.getElementById('confirm-transfer-btn').onclick = function() {
        processTransfer(recipientName, amount);
        modal.style.display = 'none';
      };
      
      document.getElementById('cancel-transfer-btn').onclick = function() {
        modal.style.display = 'none';
      };
      
      // Tutup modal ketika klik X
      document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
      };
      
      // Tutup modal ketika klik di luar modal
      window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      };
    }

    // Fungsi untuk memproses transfer setelah dikonfirmasi
    function processTransfer(recipientName, amount) {
      const recipientAccount = accounts.find(acc => acc.name === recipientName);
      
      // Proses transfer
      currentAccount.balance -= amount;
      recipientAccount.balance += amount;

      // Catat transaksi
      const timestamp = new Date().toLocaleString("id-ID");
      currentAccount.history.unshift(`- Transfer Rp ${formatCurrency(amount)} ke ${recipientName} (${timestamp})`);
      recipientAccount.history.unshift(`+ Transfer Rp ${formatCurrency(amount)} dari ${currentAccount.name} (${timestamp})`);

      // Simpan perubahan 
      saveData();
      
      // Beri feedback
      showToast(`Transfer Rp ${formatCurrency(amount)} ke ${recipientName} berhasil!`, "success");
      showScreen("balance-screen");
      
      // Reset form
      document.getElementById("transfer-recipient").value = "";
      document.getElementById("transfer-amount").value = "";
    }

    // Ganti fungsi transferMoney untuk menggunakan modal
    function transferMoney() {
      // Validasi akun login
      if (!currentAccount) {
        showToast("Silakan login terlebih dahulu", "error");
        showScreen("login-screen");
        return;
      }

      // Ambil data input
      const recipientName = document.getElementById("transfer-recipient").value.trim();
      const amount = getNumericValue("transfer-amount");
      
      // Validasi input
      if (!recipientName) {
        showToast("Masukkan nama penerima", "error");
        return;
      }
      
      if (amount <= 0 || amount > 100_000_000) {
        showToast("Jumlah transfer tidak valid (maks: Rp 100 Juta)", "error");
        return;
      }

      // Cari akun penerima
      const recipientAccount = accounts.find(acc => acc.name === recipientName);
      
      // Validasi penerima
      if (!recipientAccount) {
        showToast("Penerima tidak ditemukan", "error");
        return;
      }
      
      if (recipientName === currentAccount.name) {
        showToast("Tidak bisa transfer ke diri sendiri", "error");
        return;
      }

      // Validasi saldo
      if (amount > currentAccount.balance) {
        showToast("Saldo tidak mencukupi", "error");
        return;
      }

      // Tampilkan modal konfirmasi
      showTransferConfirmationModal(recipientName, amount);
    }

// Toast Notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.getElementById("toast-container").appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// Animasi Hujan Uang
function makeItRain() {
  const container = document.getElementById('money-rain');
  container.innerHTML = '';
  
  for (let i = 0; i < 60; i++) {
    const money = document.createElement('div');
    money.className = 'money';
    money.style.left = `${Math.random() * 100}vw`;
    money.style.animationDuration = `${Math.random() * 2 + 3}s`;
    money.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    container.appendChild(money);
    setTimeout(() => money.remove(), 4000);
  }
}