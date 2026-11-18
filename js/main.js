/* TriBloom Farms · website behaviour (no libraries needed) */

// Change this one number if enquiries should go to a different WhatsApp.
const WHATSAPP_NUMBER = "919148869977"; // country code + number, no "+" or spaces

(function () {
  const header = document.getElementById("siteHeader");
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("nav");

  // Header turns solid after the hero
  const wa = document.getElementById("waFloat");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
    wa.classList.toggle("hide", window.scrollY < window.innerHeight * 0.7);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); closeLightbox(); } });

  // Fade sections in as they scroll into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal, .board").forEach((el) => io.observe(el));

  // Videos load and play only when visible (saves mobile data)
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) {
        const s = v.querySelector("source[data-src]");
        if (s) { s.src = s.dataset.src; s.removeAttribute("data-src"); v.load(); }
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("video.lazy-video").forEach((v) => vio.observe(v));
  }

  // Departures board clock (Bengaluru time)
  const clock = document.getElementById("boardClock");
  const tick = () => {
    try {
      clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date()) + " IST";
    } catch (e) { clock.textContent = ""; }
  };
  tick(); setInterval(tick, 30000);

  // Gallery lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  let lastFocus = null;
  document.querySelectorAll(".g").forEach((g) => g.addEventListener("click", () => {
    lastFocus = g;
    const img = g.querySelector("img");
    lbImg.src = g.dataset.full; lbImg.alt = img.alt;
    lbCap.textContent = g.querySelector("span")?.textContent || "";
    lb.hidden = false; document.body.style.overflow = "hidden";
    document.getElementById("lbClose").focus();
  }));
  function closeLightbox() {
    if (lb.hidden) return;
    lb.hidden = true; document.body.style.overflow = ""; lbImg.src = "";
    if (lastFocus) lastFocus.focus();
  }
  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  // Enquiry form → WhatsApp message
  const form = document.getElementById("quoteForm");
  const err = document.getElementById("formError");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    err.textContent = "";
    const f = new FormData(form);
    const name = (f.get("name") || "").toString().trim();
    const country = (f.get("country") || "").toString().trim();
    form.name.classList.toggle("invalid", !name);
    form.country.classList.toggle("invalid", !country);
    if (!name || !country) { err.textContent = "Please add your name and country/city."; return; }
    const varieties = f.getAll("v").join(", ");
    const lines = [
      "Hello TriBloom Farms, I'd like a quote.",
      "",
      "Name: " + name,
      f.get("company") ? "Company: " + f.get("company") : "",
      "Country/city: " + country,
      varieties ? "Interested in: " + varieties : "",
      f.get("volume") ? "Weekly volume: " + f.get("volume") : "",
      f.get("message") ? "Message: " + f.get("message") : "",
    ].filter((l, i) => l !== "" || i === 1);
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });

  document.getElementById("waFloat").href = "https://wa.me/" + WHATSAPP_NUMBER;
  document.getElementById("year").textContent = new Date().getFullYear();
})();
