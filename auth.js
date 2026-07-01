(function(){
  function getCurrent(){ try { return localStorage.getItem('sp_user'); } catch(e) { return null; } }
  function getToken(){ try { return localStorage.getItem('sp_token'); } catch(e) { return null; } }
  function setCurrent(user){ try { if(user) localStorage.setItem('sp_user', user); else localStorage.removeItem('sp_user'); } catch(e) {} }
  function setToken(token){ try { if(token) localStorage.setItem('sp_token', token); else localStorage.removeItem('sp_token'); } catch(e) {} }

  async function apiRequest(path, data){
    try {
      var headers = { 'Content-Type': 'application/json' };
      var user = getCurrent();
      var token = getToken();
      if (user && token) {
        headers['X-User'] = user;
        headers['X-Auth-Token'] = token;
      }
      var response = await fetch(path, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      var body = await response.json().catch(function(){ return null; });
      if (!response.ok) {
        return { ok: false, msg: (body && body.msg) || 'server_error' };
      }
      return body || { ok: false, msg: 'server_error' };
    } catch (error) {
      return { ok: false, msg: 'network_error' };
    }
  }

  async function registerUser(username, password){
    if (!username || !password) return { ok: false, msg: 'missing_fields' };
    var result = await apiRequest('/api/register', { username: username, password: password });
    if (result.ok) {
      setCurrent(username);
      setToken(result.token || '');
      if (window.SP && result.state) {
        var merged = window.SP.mergeState(window.SP.getState(), result.state);
        window.SP.saveState(merged);
        if (typeof window.onRemoteStateLoaded === 'function') {
          window.onRemoteStateLoaded();
        }
      }
    }
    updateNav();
    return result;
  }

  async function loginUser(username, password){
    if (!username || !password) return { ok: false, msg: 'missing_fields' };
    var result = await apiRequest('/api/login', { username: username, password: password });
    if (result.ok) {
      setCurrent(username);
      setToken(result.token || '');
      if (window.SP && result.state) {
        var merged = window.SP.mergeState(window.SP.getState(), result.state);
        window.SP.saveState(merged);
        if (typeof window.onRemoteStateLoaded === 'function') {
          window.onRemoteStateLoaded();
        }
      }
    }
    updateNav();
    return result;
  }

  function logoutUser(){
    setCurrent(null);
    setToken(null);
    updateNav();
  }

  function updateNav(){
    var btn = document.getElementById('account-btn');
    if (!btn) return;
    var cur = getCurrent();
    btn.textContent = cur || 'Log In';
    btn.title = cur ? 'Signed in as ' + cur : 'Log in or register';
    btn.href = 'account.html';
  }

  document.addEventListener('DOMContentLoaded', function(){
    updateNav();
    if (window.SP && getCurrent() && getToken()) {
      window.SP.loadRemoteState().then(function(){
        if (typeof window.onRemoteStateLoaded === 'function') {
          window.onRemoteStateLoaded();
        }
      });
    }
  });

  window.auth = {
    current: getCurrent,
    token: getToken,
    register: registerUser,
    login: loginUser,
    logout: logoutUser
  };
})();
