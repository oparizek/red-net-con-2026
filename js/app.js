(function () {
  "use strict";

  // State
  let sessions = [];
  let conference = {};
  let activeTypeFilter = "all";
  let activeDayFilter = "all";
  let countdownInterval = null;

  // DOM refs
  const nowPlayingSection = document.getElementById("now-playing");
  const nowPlayingContent = document.getElementById("now-playing-content");
  const scheduleList = document.getElementById("schedule-list");
  const noResults = document.getElementById("no-results");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  // ===== Init =====
  async function init() {
    try {
      const res = await fetch("data/schedule.json");
      const data = await res.json();
      conference = data.conference;
      sessions = data.sessions;
      bindFilters();
      bindModal();
      render();
      startCountdown();
    } catch (err) {
      scheduleList.innerHTML =
        '<p class="no-results">Nepodařilo se načíst program. Zkuste obnovit stránku.</p>';
    }
  }

  // ===== Filters =====
  function bindFilters() {
    document.querySelectorAll("[data-filter-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTypeFilter = btn.dataset.filterType;
        document.querySelectorAll("[data-filter-type]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        render();
      });
    });

    document.querySelectorAll("[data-filter-day]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeDayFilter = btn.dataset.filterDay;
        document.querySelectorAll("[data-filter-day]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        render();
      });
    });
  }

  // ===== Render =====
  function render() {
    var filtered = sessions.filter(function (s) {
      var matchType = activeTypeFilter === "all" || s.type === activeTypeFilter;
      var matchDay = activeDayFilter === "all" || s.day === activeDayFilter;
      return matchType && matchDay;
    });

    // Sort by day then start time
    filtered.sort(function (a, b) {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.startTime.localeCompare(b.startTime);
    });

    scheduleList.innerHTML = "";
    noResults.hidden = filtered.length > 0;

    var currentDay = "";

    filtered.forEach(function (session) {
      // Day separator
      if (session.day !== currentDay) {
        currentDay = session.day;
        var sep = document.createElement("div");
        sep.className = "day-separator";
        sep.textContent = formatDayLabel(session);
        scheduleList.appendChild(sep);
      }

      var card = createSessionCard(session);
      scheduleList.appendChild(card);
    });

    updateNowPlaying();
  }

  function createSessionCard(session) {
    var card = document.createElement("div");
    card.className = "session-card session-card--" + session.type;

    var status = getSessionStatus(session);
    if (status === "past") card.classList.add("session-card--past");
    if (status === "active") card.classList.add("session-card--active");

    var typeLabel = session.type === "talk" ? "Přednáška" : "Workshop";
    var typeClass = "session-card__type--" + session.type;

    var html =
      '<div class="session-card__top">' +
      '<span class="session-card__time">' +
      session.startTime +
      " – " +
      session.endTime +
      "</span>" +
      '<span class="session-card__type ' +
      typeClass +
      '">' +
      typeLabel +
      "</span>" +
      "</div>" +
      '<div class="session-card__title">' +
      escapeHtml(session.title) +
      "</div>";

    if (session.speaker) {
      html +=
        '<div class="session-card__speaker">' +
        escapeHtml(session.speaker.name) +
        "</div>";
    }

    html +=
      '<div class="session-card__venue">' +
      escapeHtml(session.venue) +
      (session.capacity ? " · max " + session.capacity + " účastníků" : "") +
      "</div>";

    if (status === "active") {
      var remaining = getRemainingTime(session);
      html +=
        '<div class="session-card__status session-card__status--active">' +
        "Probíhá · zbývá " +
        remaining +
        "</div>";
    } else if (status === "upcoming") {
      html +=
        '<div class="session-card__status session-card__status--upcoming">Nadcházející</div>';
    }

    card.innerHTML = html;

    card.addEventListener("click", function () {
      openModal(session);
    });

    return card;
  }

  // ===== Now Playing =====
  function updateNowPlaying() {
    var now = new Date();
    var activeSession = null;

    for (var i = 0; i < sessions.length; i++) {
      if (getSessionStatus(sessions[i]) === "active") {
        activeSession = sessions[i];
        break;
      }
    }

    if (activeSession) {
      nowPlayingSection.hidden = false;
      var remaining = getRemainingTime(activeSession);
      var speakerHtml = activeSession.speaker
        ? '<div class="now-card__speaker">' +
          escapeHtml(activeSession.speaker.name) +
          "</div>"
        : "";

      nowPlayingContent.innerHTML =
        '<div class="now-card">' +
        '<span class="now-card__badge">Právě probíhá</span>' +
        '<div class="now-card__title">' +
        escapeHtml(activeSession.title) +
        "</div>" +
        speakerHtml +
        '<div class="now-card__countdown">Zbývá ' +
        remaining +
        "</div>" +
        "</div>";

      nowPlayingContent.querySelector(".now-card").addEventListener("click", function () {
        openModal(activeSession);
      });
      nowPlayingContent.querySelector(".now-card").style.cursor = "pointer";
    } else {
      nowPlayingSection.hidden = true;
    }
  }

  // ===== Countdown =====
  function startCountdown() {
    countdownInterval = setInterval(function () {
      render();
    }, 30000); // Update every 30 seconds
  }

  // ===== Modal =====
  function bindModal() {
    modal.querySelector(".modal__backdrop").addEventListener("click", closeModal);
    modal.querySelector(".modal__close").addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });
  }

  function openModal(session) {
    var typeLabel = session.type === "talk" ? "Přednáška" : "Workshop";
    var typeStyle =
      session.type === "talk"
        ? "background:#fde8e8;color:#d62828"
        : "background:#e6f5f3;color:#2a9d8f";

    var html =
      '<div class="modal-detail">' +
      '<span class="modal-detail__type" style="' +
      typeStyle +
      '">' +
      typeLabel +
      "</span>" +
      '<h2 class="modal-detail__title">' +
      escapeHtml(session.title) +
      "</h2>" +
      '<div class="modal-detail__meta">' +
      formatDayLabel(session) +
      "<br>" +
      session.startTime +
      " – " +
      session.endTime +
      "<br>" +
      escapeHtml(session.venue) +
      (session.capacity ? " · max " + session.capacity + " účastníků" : "") +
      "</div>" +
      '<div class="modal-detail__description">' +
      escapeHtml(session.description) +
      "</div>";

    if (session.speaker) {
      html +=
        '<div class="modal-detail__speaker-section">' +
        '<div class="modal-detail__speaker-label">Přednášející</div>' +
        '<div class="modal-detail__speaker-name">' +
        escapeHtml(session.speaker.name) +
        "</div>" +
        '<div class="modal-detail__speaker-bio">' +
        escapeHtml(session.speaker.bio) +
        "</div>" +
        "</div>";
    }

    html += "</div>";

    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // ===== Helpers =====
  function getSessionDate(session, timeStr) {
    var parts = timeStr.split(":");
    var d = new Date(session.day + "T" + timeStr + ":00");
    return d;
  }

  function getSessionStatus(session) {
    var now = new Date();
    var start = getSessionDate(session, session.startTime);
    var end = getSessionDate(session, session.endTime);

    if (now >= start && now < end) return "active";
    if (now < start) return "upcoming";
    return "past";
  }

  function getRemainingTime(session) {
    var now = new Date();
    var end = getSessionDate(session, session.endTime);
    var diff = end - now;

    if (diff <= 0) return "0 min";

    var hours = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return hours + " h " + mins + " min";
    }
    return mins + " min";
  }

  function formatDayLabel(session) {
    var d = new Date(session.day + "T12:00:00");
    var days = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
    var months = [
      "ledna",
      "února",
      "března",
      "dubna",
      "května",
      "června",
      "července",
      "srpna",
      "září",
      "října",
      "listopadu",
      "prosince",
    ];
    return days[d.getDay()] + " " + d.getDate() + ". " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Start =====
  document.addEventListener("DOMContentLoaded", init);
})();
