// ---- Demo data store (localStorage) — todo esto es simulado, sin dinero real ----
const Store = {
  init(){
    if(localStorage.getItem('gc_balance') === null){
      localStorage.setItem('gc_balance', '25430.50');
    }
    if(localStorage.getItem('gc_history') === null){
      const seed = [
        { id: 'AP-1042', evento: 'Copa Espaillat — Bout 4', lado: 'B', monto: 800, cuota: 1.95, resultado: 'win', fecha: 'Hoy 3:12 pm' },
        { id: 'AP-1039', evento: 'Copa Espaillat — Bout 2', lado: 'A', monto: 500, cuota: 1.85, resultado: 'loss', fecha: 'Hoy 2:40 pm' },
        { id: 'AP-1031', evento: 'Gallera Moca — Bout 7', lado: 'A', monto: 1200, cuota: 2.10, resultado: 'win', fecha: 'Ayer 8:05 pm' },
        { id: 'AP-1022', evento: 'Gallera Moca — Bout 3', lado: 'B', monto: 300, cuota: 1.75, resultado: 'loss', fecha: 'Ayer 6:50 pm' },
      ];
      localStorage.setItem('gc_history', JSON.stringify(seed));
    }
  },
  getBalance(){ return parseFloat(localStorage.getItem('gc_balance') || '0'); },
  setBalance(v){ localStorage.setItem('gc_balance', String(Math.max(0, v))); },
  addFunds(v){ this.setBalance(this.getBalance() + v); },
  getHistory(){ return JSON.parse(localStorage.getItem('gc_history') || '[]'); },
  addBet(entry){
    const h = this.getHistory();
    h.unshift(entry);
    localStorage.setItem('gc_history', JSON.stringify(h));
  }
};

function money(n){
  return 'RD$ ' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderBalancePill(){
  const el = document.getElementById('balance-pill');
  if(el) el.textContent = money(Store.getBalance());
}

function showToast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---- Auth (simulado) ----
function isAuthed(){ return localStorage.getItem('gc_auth') === '1'; }
function login(){ localStorage.setItem('gc_auth', '1'); }
function logout(){ localStorage.removeItem('gc_auth'); window.location.href = 'login.html'; }
function requireAuth(){
  if(!isAuthed()){
    const next = location.pathname.split('/').pop();
    window.location.href = 'login.html?next=' + encodeURIComponent(next);
  }
}
function renderNavAuth(){
  const guest = document.getElementById('nav-guest');
  const user = document.getElementById('nav-user');
  if(!guest || !user) return;
  guest.style.display = isAuthed() ? 'none' : 'flex';
  user.style.display = isAuthed() ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  Store.init();
  renderBalancePill();
  renderNavAuth();
});
