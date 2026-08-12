(function () {
  "use strict";

  var form = document.getElementById("rsvp-form");
  var submitBtn = document.getElementById("submit-btn");
  var errorBox = document.getElementById("form-error");
  var successCard = document.getElementById("success-card");
  var dietaryOtherWrap = document.getElementById("dietary-other-wrap");
  var dietaryOtherInput = document.getElementById("dietary_other");
  var dietaryGroup = document.getElementById("dietary-group");

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
        launchConfetti();
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
    var count = 42;

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
})();
