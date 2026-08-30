"use strict";

/////////////////////////////////////////////////////////////////////////
// UTILITY CLASSES

// Resize fires continuously while a window is dragged; coalesce the work into
// one callback per animation frame instead of one per event
function perFrame(fn) {
  let queued = false;
  return function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}

/////////////////////////////////////////////////////////////////////////
// HEADER SECTION
const LONG_DEV_INTRO = "Hello! I am Joshmar 👋🏻";
const SHORT_DEV_INTRO = "Hi! I'm Josh 👋🏻";
const headerIntro = document.querySelector(
  ".header__introductionbox"
)?.firstElementChild;

function updateSize() {
  if (!headerIntro) return;

  if (Number(window.innerWidth) <= 1200) {
    headerIntro.textContent = SHORT_DEV_INTRO;
  } else {
    headerIntro.textContent = LONG_DEV_INTRO;
  }
}

window.addEventListener("resize", perFrame(updateSize));
updateSize(); // Set the correct intro on load, not just on resize

/////////////////////////////////////////////////////////////////////////
// EXPERIENCE SECTION
const EXP_MAP = new Map([
  ["work", "work"],
  ["technical", "tech"],
  ["education", "edu"],
  ["languages", "lang"],
]);
const allDescription = document.querySelectorAll(".experience__description");

const expTitles = document.querySelectorAll(".experience__title");

function removeAllTitleSelection() {
  expTitles.forEach((title) =>
    title.classList.remove("experience__title--active")
  );
}

function hideAllDescription() {
  allDescription.forEach((descrption) => {
    descrption.classList.add("u-hidden");
  });
}

function activateTab(title) {
  const selection = title.firstElementChild.textContent.trim().toLowerCase();
  const currentDescription = document.querySelector(
    `.experience__description-${EXP_MAP.get(selection)}`
  );
  // Resolve the panel before hiding anything, so an unknown label can never
  // leave the section with every panel hidden
  if (!currentDescription) return;

  removeAllTitleSelection();
  title.classList.add("experience__title--active");

  // Roving tabindex: only the selected tab stays in the page tab order
  expTitles.forEach((tab) => {
    const isActive = tab === title;
    tab.setAttribute("aria-selected", isActive);
    tab.tabIndex = isActive ? 0 : -1;
  });

  hideAllDescription();
  currentDescription.classList.remove("u-hidden");
}

expTitles.forEach(function (title) {
  title.addEventListener("click", function (e) {
    e.preventDefault();
    activateTab(title);
  });
});

// Arrow keys move between tabs, as a role="tablist" leads users to expect
const ARROW_STEP = new Map([
  ["ArrowRight", 1],
  ["ArrowDown", 1],
  ["ArrowLeft", -1],
  ["ArrowUp", -1],
]);

document
  .querySelector(".experience__titlebox")
  ?.addEventListener("keydown", function (e) {
    const step = ARROW_STEP.get(e.key);
    if (!step) return;

    const tabs = [...expTitles];
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;

    e.preventDefault();
    const next = tabs[(current + step + tabs.length) % tabs.length];
    next.focus();
    activateTab(next);
  });

/////////////////////////////////////////////////////////////////////////
// NAVBAR SECTION
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".navMenu");
const NAV_BREAKPOINT = 760; // Matches the media query in _navbar.scss

function closeMenu() {
  hamburger?.classList.remove("active");
  navMenu?.classList.remove("active");
  hamburger?.setAttribute("aria-expanded", "false");
}

hamburger?.addEventListener("click", () => {
  const isOpen = Boolean(navMenu?.classList.toggle("active"));
  hamburger.classList.toggle("active", isOpen);
  hamburger.setAttribute("aria-expanded", isOpen);
});

// Close the menu once a destination is picked, and when the viewport grows
// past the breakpoint where the menu stops applying
navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener(
  "resize",
  perFrame(() => {
    if (window.innerWidth > NAV_BREAKPOINT) closeMenu();
  })
);

/////////////////////////////////////////////////////////////////////////
// LOTTIE ANIMATIONS
// Both the player script and the animation JSON come from third-party hosts.
// If either is unreachable the element renders nothing at all, so show a
// placeholder while it loads and collapse it if it never arrives.
const LOTTIE_TIMEOUT_MS = 8000;

document.querySelectorAll("dotlottie-player").forEach((player) => {
  // Collapse the wrapper only when the player is its only child; the header
  // shares its box with the coding illustration, which must stay visible
  const box = player.parentElement;
  const target = box && box.children.length === 1 ? box : player;
  target.classList.add("lottie--loading");

  let settled = false;
  const settle = (failed) => {
    if (settled) return;
    settled = true;
    target.classList.remove("lottie--loading");
    if (failed) target.classList.add("lottie--failed");
  };

  player.addEventListener("ready", () => settle(false));
  player.addEventListener("load", () => settle(false));
  player.addEventListener("error", () => settle(true));

  // The CDN script itself may never arrive, in which case no event ever fires
  setTimeout(() => settle(true), LOTTIE_TIMEOUT_MS);
});

/////////////////////////////////////////////////////////////////////////
// FOOTER SECTION
const footerDate = document.querySelector(".footer-date");
const date = new Date();
if (footerDate) footerDate.textContent = `© ${date.getFullYear()}`;

/////////////////////////////////////////////////////////////////////////
// REDUCED MOTION
// CSS covers the keyframes and transitions, but the Lottie players animate
// internally, so they have to be stopped through their own element API
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const players = document.querySelectorAll("dotlottie-player");
  // Stops any player that has not been upgraded by the CDN script yet
  players.forEach((player) => player.removeAttribute("autoplay"));

  customElements.whenDefined("dotlottie-player").then(() => {
    players.forEach((player) => player.pause?.());
  });

  // The project demos are autoplaying video; leave them on their poster frame
  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.removeAttribute("autoplay");
    video.pause();
  });
}
