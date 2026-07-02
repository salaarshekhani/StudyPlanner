(function(){
  function setTheme(t){
    try { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('sp_theme', t); } catch(e){}
    var btn = document.getElementById('theme-toggle');
    if(btn) {
      btn.setAttribute('aria-pressed', String(t==='dark'));
      btn.textContent = t==='dark' ? 'Dark Mode' : 'Light Mode';
    }
  }

  try { var stored = localStorage.getItem('sp_theme'); if(stored) document.documentElement.setAttribute('data-theme', stored); } catch(e){}

  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('theme-toggle');
    var cur = document.documentElement.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(cur);
    if(!btn) return;
    btn.addEventListener('click', function(){
      var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(now);
    });
  });
})();