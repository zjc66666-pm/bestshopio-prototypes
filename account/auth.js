/* Shared helpers for the SSO auth pages: register.html / forgot-password.html /
   staff-register.html. (signin.html and stores.html predate this and keep their
   own inline copies.) Exposes window.Auth. */
(function () {
  var EYE_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.34M6.1 6.1A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 3.9-.86"/><path d="m1 1 22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function toast(msg, kind) {
    var host = document.getElementById('toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.id = 'toast-host'; document.body.appendChild(host); }
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = (kind === 'err' ? '' : CHECK) + '<span>' + msg + '</span>';
    host.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  // wire every [data-eye] toggle inside scope (default document)
  function wireEyes(scope) {
    (scope || document).querySelectorAll('[data-eye]').forEach(function (b) {
      var inp = (scope || document).querySelector('#' + b.getAttribute('data-eye'));
      if (!inp) return;
      b.innerHTML = EYE_OFF;
      b.onclick = function () { var s = inp.type === 'password'; inp.type = s ? 'text' : 'password'; b.innerHTML = s ? EYE_OPEN : EYE_OFF; };
    });
  }

  function setErr(name, msg) {
    var el = document.querySelector('[data-err="' + name + '"]');
    var inp = document.getElementById(name);
    if (el) el.textContent = msg || '';
    if (inp) inp.classList.toggle('has-error', !!msg);
  }
  function clearErrs(names) { names.forEach(function (n) { setErr(n, ''); }); }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  // Send -> "Resend (59)" disabled countdown -> "Resend" enabled. PRD: 59s.
  function startCountdown(btn) {
    var n = 59;
    btn.disabled = true;
    btn.classList.add('txt');
    btn.textContent = 'Resend (' + n + ')';
    var timer = setInterval(function () {
      n -= 1;
      if (n <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = 'Resend'; return; }
      btn.textContent = 'Resend (' + n + ')';
    }, 1000);
  }

  window.Auth = {
    EYE_OPEN: EYE_OPEN, EYE_OFF: EYE_OFF, CHECK: CHECK,
    toast: toast, wireEyes: wireEyes, setErr: setErr, clearErrs: clearErrs,
    validEmail: validEmail, startCountdown: startCountdown,
  };
})();
