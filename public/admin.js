(function () {
  "use strict";

  var STORAGE_KEY = "casino_admin_password";

  var loginCard = document.getElementById("login-card");
  var loginForm = document.getElementById("login-form");
  var loginBtn = document.getElementById("login-btn");
  var loginError = document.getElementById("login-error");
  var passwordInput = document.getElementById("password");

  var adminBody = document.getElementById("admin-body");
  var summaryRow = document.getElementById("summary-row");
  var rowCount = document.getElementById("row-count");
  var tbody = document.getElementById("rsvp-tbody");
  var emptyState = document.getElementById("empty-state");
  var exportBtn = document.getElementById("export-btn");

  var DIETARY_LABELS = {
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    kosher: "Kosher",
    halal: "Halaal",
    gluten_free: "Gluten-free",
    none: "None",
    other: "Other",
  };
  var ATTENDING_LABELS = { yes: "Yes", no_ilse: "No (arranged w/ Ilse)" };
  var TABLE_PREF_LABELS = {
    playing: "Playing",
    not_playing: "Food",
    not_sure: "Not sure",
  };

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderSummary(summary) {
    var tiles = [
      { num: summary.total, label: "Total RSVPs" },
      { num: summary.attending_yes, label: "Attending" },
      { num: summary.attending_no, label: "Not attending" },
      { num: summary.bringing_partner, label: "Bringing partner" },
      { num: summary.playing_tables, label: "Playing tables" },
    ];
    summaryRow.innerHTML = tiles
      .map(function (t) {
        return (
          '<div class="stat-tile"><div class="num">' +
          t.num +
          '</div><div class="label">' +
          t.label +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderRows(rows) {
    if (!rows.length) {
      emptyState.hidden = false;
      tbody.innerHTML = "";
      return;
    }
    emptyState.hidden = true;
    tbody.innerHTML = rows
      .map(function (r) {
        var attendingBadge =
          r.attending === "yes"
            ? '<span class="badge yes">Yes</span>'
            : '<span class="badge no">' + escapeHtml(ATTENDING_LABELS[r.attending] || r.attending) + "</span>";
        var dietary = DIETARY_LABELS[r.dietary] || r.dietary || "";
        if (r.dietary === "other" && r.dietary_other) {
          dietary += " (" + escapeHtml(r.dietary_other) + ")";
        }
        return (
          "<tr>" +
          "<td>" + escapeHtml(r.full_name) + "</td>" +
          "<td>" + escapeHtml(r.email) + "</td>" +
          "<td>" + attendingBadge + "</td>" +
          "<td>" + (r.bringing_partner === "yes" ? "Yes" : r.bringing_partner === "no" ? "No" : "") + "</td>" +
          "<td>" + dietary + "</td>" +
          "<td>" + escapeHtml(TABLE_PREF_LABELS[r.table_preference] || "") + "</td>" +
          "<td>" + escapeHtml(formatDate(r.submitted_at)) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function loadData(password) {
    return fetch("/api/admin/rsvps", {
      headers: { "x-admin-password": password },
    }).then(function (res) {
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        throw new Error("unauthorized");
      }
      return res.json();
    });
  }

  function showAdmin(data) {
    loginCard.hidden = true;
    adminBody.hidden = false;
    renderSummary(data.summary);
    renderRows(data.rows);
    rowCount.textContent = data.rows.length + (data.rows.length === 1 ? " response" : " responses");
  }

  function attemptLogin(password, showErrorOnFail) {
    return loadData(password)
      .then(function (data) {
        sessionStorage.setItem(STORAGE_KEY, password);
        showAdmin(data);
        return true;
      })
      .catch(function () {
        if (showErrorOnFail) {
          loginError.textContent = "Incorrect password.";
          loginError.hidden = false;
        }
        return false;
      });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = "Checking…";
    attemptLogin(passwordInput.value, true).finally(function () {
      loginBtn.disabled = false;
      loginBtn.textContent = "View RSVPs";
    });
  });

  exportBtn.addEventListener("click", function () {
    var password = sessionStorage.getItem(STORAGE_KEY);
    if (!password) return;
    fetch("/api/admin/rsvps?format=csv", {
      headers: { "x-admin-password": password },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "casino-night-rsvps.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(function () {
        alert("Could not download CSV. Please try again.");
      });
  });

  var saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    attemptLogin(saved, false);
  }
})();
