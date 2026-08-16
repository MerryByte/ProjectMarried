(function () {
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function request(url, headers, done) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Cache-Control", "no-cache");
    Object.keys(headers || {}).forEach(function (name) { xhr.setRequestHeader(name, headers[name]); });
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4 || xhr.status < 200 || xhr.status >= 300) return;
      try { done(JSON.parse(xhr.responseText)); } catch (error) { console.warn("Wedding date response was invalid.", error); }
    };
    xhr.send();
  }
  function loadDate(config) {
    if (!config || !config.supabaseUrl || !config.anonKey) return;
    var url = config.supabaseUrl.replace(/\/$/, "") + "/rest/v1/site_settings?select=upload_unlock_at&id=eq.wedding&limit=1&_=" + Date.now();
    request(url, { apikey: config.anonKey }, function (rows) {
      if (!rows[0] || !rows[0].upload_unlock_at) return;
      var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(rows[0].upload_unlock_at);
      if (!match) return;
      var month = months[Number(match[2]) - 1];
      var day = Number(match[3]);
      var year = match[1];
      var shortDate = document.getElementById("weddingDateShort");
      var longDate = document.getElementById("weddingDateLong");
      if (shortDate) shortDate.textContent = month.slice(0, 3) + " " + day + ", " + year;
      if (longDate) longDate.textContent = month + " " + day + ", " + year;
    });
  }
  if (window.WEDDING_CONFIG && window.WEDDING_CONFIG.supabaseUrl) loadDate(window.WEDDING_CONFIG);
  else request("/api/upload-config?_=" + Date.now(), {}, loadDate);
})();
