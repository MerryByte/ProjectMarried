(function () {
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
    var url = "/api/site-settings?select=upload_unlock_at&_=" + Date.now();
    request(url, {}, function (rows) {
      if (!rows[0] || !rows[0].upload_unlock_at) return;
      var date = new Date(rows[0].upload_unlock_at);
      if (!isFinite(date.getTime())) return;
      var shortDate = document.getElementById("weddingDateShort");
      var longDate = document.getElementById("weddingDateLong");
      var options = { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" };
      if (shortDate) shortDate.textContent = new Intl.DateTimeFormat("en-US", options).format(date);
      options.month = "long";
      if (longDate) longDate.textContent = new Intl.DateTimeFormat("en-US", options).format(date);
    });
  }
  loadDate(window.WEDDING_CONFIG);
})();
