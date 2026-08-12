(function () {
  "use strict";

  var form = document.getElementById("rsvp-form");
  var submitBtn = document.getElementById("submit-btn");
  var errorBox = document.getElementById("form-error");
  var successCard = document.getElementById("success-card");
  var dietaryOtherWrap = document.getElementById("dietary-other-wrap");
  var dietaryOtherInput = document.getElementById("dietary_other");
  var dietaryGroup = document.getElementById("dietary-group");
  var calendarLink = document.getElementById("calendar-link");

  dietaryGroup.addEventListener("change", function (e) {
    if (e.target.name !== "dietary") return;
    var isOther = e.target.value === "other";
    dietaryOtherWrap.hidden = !isOther;
    if (isOther) {
      dietaryOtherInput.focus();
    } else {
      dietaryOtherInput.value = "";
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function getRadioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function buildCalendarLink() {
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BPMS Casino Night//RSVP//EN",
      "BEGIN:VEVENT",
      "UID:bpms-casino-night-2026@bpmsevent",
      "DTSTAMP:20260812T000000Z",
      "DTSTART;VALUE=DATE:20261128",
      "DTEND;VALUE=DATE:20261129",
      "SUMMARY:BPMS Casino Night - Year-end Function",
      "LOCATION:BPMS School Hall",
      "DESCRIPTION:Casino Night year-end function. Time still TBC - watch for updates.",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    return URL.createObjectURL(blob);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    var fullName = form.full_name.value.trim();
    var email = form.email.value.trim();
    var attending = getRadioValue("attending");
    var bringingPartner = getRadioValue("bringing_partner");
    var dietary = getRadioValue("dietary");
    var dietaryOther = dietaryOtherInput.value.trim();
    var tablePreference = getRadioValue("table_preference");

    if (!fullName) return showError("Please enter your full name.");
    if (!email) return showError("Please enter your email address.");
    if (!attending) return showError("Please let us know if you're attending.");
    if (!bringingPartner) return showError("Please let us know about bringing a partner.");
    if (!dietary) return showError("Please choose a dietary option.");
    if (dietary === "other" && !dietaryOther) return showError("Please tell us your dietary requirement.");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    fetch("/api/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        attending: attending,
        bringing_partner: bringingPartner,
        dietary: dietary,
        dietary_other: dietaryOther,
        table_preference: tablePreference,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Something went wrong. Please try again.");
          }
          return data;
        });
      })
      .then(function () {
        form.hidden = true;
        successCard.hidden = false;
        if (attending === "yes") {
          calendarLink.href = buildCalendarLink();
          calendarLink.download = "casino-night.ics";
          calendarLink.hidden = false;
        }
        successCard.scrollIntoView({ behavior: "smooth", block: "start" });
        launchConfetti();
        refreshLiveCount();
      })
      .catch(function (err) {
        showError(err.message || "Something went wrong. Please try again.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit RSVP";
      });
  });

  function launchConfetti() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var canvas = document.getElementById("confetti-canvas");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    var glyphs = ["♠", "♥", "♦", "♣"];
    var colors = ["#f6e3a6", "#d9b658", "#c8203c"];
    var pieces = [];
    var count = 48;

    for (var i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * width,
        y: -20 - Math.random() * height * 0.6,
        speed: 1.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 1.2,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 6,
        size: 12 + Math.random() * 10,
        glyph: glyphs[i % glyphs.length],
        color: colors[i % colors.length],
      });
    }

    var start = performance.now();
    var duration = 3200;

    function frame(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      pieces.forEach(function (p) {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = p.size + "px sans-serif";
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    requestAnimationFrame(frame);
  }

  /* ---------------- countdown ---------------- */
  (function countdown() {
    var el = document.getElementById("countdown");
    var target = new Date("2026-11-28T00:00:00");

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function render() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        el.innerHTML =
          '<div class="tile"><div class="num">&#127920;</div><div class="unit">It\'s tonight!</div></div>';
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);

      var units = [
        [days, "Days"],
        [hours, "Hours"],
        [mins, "Min"],
      ];
      if (!reduceMotion) units.push([secs, "Sec"]);

      el.innerHTML = units
        .map(function (u) {
          return (
            '<div class="tile"><div class="num">' +
            String(u[0]).padStart(2, "0") +
            '</div><div class="unit">' +
            u[1] +
            "</div></div>"
          );
        })
        .join("");
    }

    render();
    if (!reduceMotion) setInterval(render, 1000);
  })();

  /* ---------------- featured roulette wheel ---------------- */
  (function wheel() {
    var order = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22,
      18, 29, 7, 28, 12, 35, 3, 26,
    ];
    var reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    var wheelEl = document.getElementById("wheel");
    if (!wheelEl) return;

    var radius = (wheelEl.getBoundingClientRect().width / 2) * 0.82;
    var segAngle = 360 / order.length;
    var stops = [];

    order.forEach(function (num, i) {
      var start = segAngle * i;
      var end = segAngle * (i + 1);
      var color = num === 0 ? "#0b5c2e" : reds.indexOf(num) > -1 ? "#a3172f" : "#111";
      stops.push(color + " " + start + "deg " + end + "deg");

      var angle = start + segAngle / 2;
      var el = document.createElement("div");
      el.className = "wheel-number";
      el.textContent = num;
      el.style.transform =
        "rotate(" + angle + "deg) translate(" + radius + "px) rotate(-" + angle + "deg) translate(-50%,-50%)";
      wheelEl.appendChild(el);
    });

    wheelEl.style.background = "conic-gradient(from 0deg," + stops.join(",") + ")";
  })();

  /* ---------------- live RSVP counter ---------------- */
  function refreshLiveCount() {
    var section = document.getElementById("live-counter");
    var countEl = document.getElementById("live-count");
    var labelEl = section.querySelector(".label");

    fetch("/api/rsvp-count")
      .then(function (res) {
        if (!res.ok) throw new Error("count unavailable");
        return res.json();
      })
      .then(function (data) {
        var target = data.count || 0;
        if (target === 0) {
          labelEl.textContent = "Be the first to RSVP!";
        } else {
          labelEl.textContent =
            target === 1 ? "person already in for Casino Night" : "people already in for Casino Night";
        }
        section.hidden = false;
        animateCount(countEl, target);
      })
      .catch(function () {
        /* silently skip if unavailable */
      });
  }

  function animateCount(el, target) {
    if (target === 0) {
      el.textContent = "0";
      return;
    }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    var start = performance.now();
    var duration = 1000;
    function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  refreshLiveCount();
})();
