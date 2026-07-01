function makeDefaultState() {
    return {
        subjects: [],
        completedSessions: {},
        pomodoroLog: {},
        todos: {},
        weekOffset: 0,
        selectedSubject: null,
        pomoConfig: { focus: 25, short: 5, long: 15 },
        sessionHistory: [],
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null
    };
}

function getDateKey(date) {
    var d = date instanceof Date ? date : new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function calculateStreak(sessionHistory) {
    if (!sessionHistory || !sessionHistory.length) return { current: 0, longest: 0 };
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dates = {};
    sessionHistory.forEach(function(s) {
        var dateKey = getDateKey(s.date);
        dates[dateKey] = true;
    });
    var dateArr = Object.keys(dates).sort().reverse();
    var current = 0, longest = 0, checkDate = new Date(today);
    for (var i = 0; i < dateArr.length; i++) {
        var sessionDateKey = dateArr[i];
        var checkKey = getDateKey(checkDate);
        if (sessionDateKey === checkKey) {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    dateArr.forEach(function(d) {
        var streak = 1;
        for (var j = dateArr.indexOf(d) + 1; j < dateArr.length; j++) {
            var curr = new Date(dateArr[j]);
            var prev = new Date(dateArr[j - 1]);
            if ((curr - prev) / 86400000 === 1) {
                streak++;
            } else {
                break;
            }
        }
        if (streak > longest) longest = streak;
    });
    return { current: current, longest: longest };
}

function getCurrentUser() {
    try { return localStorage.getItem('sp_user'); } catch (e) { return null; }
}

function getAuthToken() {
    try { return localStorage.getItem('sp_token'); } catch (e) { return null; }
}

function setCurrentUser(user) {
    try {
        if (user) localStorage.setItem('sp_user', user);
        else localStorage.removeItem('sp_user');
    } catch (e) {}
}

function setAuthToken(token) {
    try {
        if (token) localStorage.setItem('sp_token', token);
        else localStorage.removeItem('sp_token');
    } catch (e) {}
}

function clearCurrentUser() {
    try { localStorage.removeItem('sp_user'); } catch (e) {}
}

function clearAuthToken() {
    try { localStorage.removeItem('sp_token'); } catch (e) {}
}

function getState() {
    try {
        var raw = localStorage.getItem('sp_v1');
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return makeDefaultState();
}

function mergeState(localState, remoteState) {
    if (!remoteState || typeof remoteState !== 'object') return localState || makeDefaultState();
    if (!localState || typeof localState !== 'object') return remoteState;

    var remoteHasData = (remoteState.subjects && remoteState.subjects.length) ||
        (remoteState.todos && Object.keys(remoteState.todos).length) ||
        (remoteState.pomodoroLog && Object.keys(remoteState.pomodoroLog).length);

    if (!remoteHasData) return localState;

    var merged = makeDefaultState();
    Object.keys(merged).forEach(function (key) {
        merged[key] = remoteState[key] !== undefined ? remoteState[key] : localState[key];
    });
    return merged;
}

function saveState(state) {
    try { localStorage.setItem('sp_v1', JSON.stringify(state)); }
    catch (e) { alert('Could not save planner state locally.'); }
    var user = getCurrentUser();
    if (user) {
        syncState(user, state);
    }
}

async function syncState(user, state) {
    var token = getAuthToken();
    if (!user || !token) return;
    try {
        await fetch('/api/save-state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User': user,
                'X-Auth-Token': token
            },
            body: JSON.stringify({ state: state })
        });
    } catch (e) {
        console.warn('Could not sync state to server:', e);
    }
}

async function fetchRemoteState() {
    var user = getCurrentUser();
    var token = getAuthToken();
    if (!user || !token) return null;
    try {
        var response = await fetch('/api/state', {
            method: 'GET',
            headers: {
                'X-User': user,
                'X-Auth-Token': token
            }
        });
        var body = await response.json().catch(function () { return null; });
        if (!response.ok) return null;
        return body.state || null;
    } catch (e) {
        return null;
    }
}

async function loadRemoteState() {
    var remote = await fetchRemoteState();
    if (!remote) return getState();
    var merged = mergeState(getState(), remote);
    saveState(merged);
    return merged;
}

window.SP = {
    makeDefaultState: makeDefaultState,
    getCurrentUser: getCurrentUser,
    getAuthToken: getAuthToken,
    setCurrentUser: setCurrentUser,
    setAuthToken: setAuthToken,
    clearCurrentUser: clearCurrentUser,
    clearAuthToken: clearAuthToken,
    getState: getState,
    saveState: saveState,
    mergeState: mergeState,
    fetchRemoteState: fetchRemoteState,
    loadRemoteState: loadRemoteState,
    syncState: syncState
};