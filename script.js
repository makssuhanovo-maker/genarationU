const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = document.querySelectorAll(".reveal");
const observedSections = document.querySelectorAll("main section[id]");
const navigationEntry = performance.getEntriesByType("navigation")[0];

window.addEventListener("load", () => {
  if (window.location.hash) return;
  if (navigationEntry?.type === "back_forward") return;
  window.scrollTo(0, 0);
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeId = entry.target.getAttribute("id");
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${activeId}`;
        link.classList.toggle("is-active", isActive);
      });
    });
  },
  {
    rootMargin: "-35% 0px -45% 0px",
    threshold: 0
  }
);

observedSections.forEach((section) => sectionObserver.observe(section));
