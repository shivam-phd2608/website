/* TriBloom Farms · website behaviour (no libraries needed) */

// ---------- Settings you may change ----------
// WhatsApp number: country code + number, no "+" or spaces
const WHATSAPP_NUMBER = "918088285812";
// Google Apps Script web app URL that emails enquiries (ends in /exec).
// Leave empty and the form will open WhatsApp instead.
const ENQUIRY_URL = "https://script.google.com/macros/s/AKfycbxbGuvCqQMs8UuDMM2pzve377sxDLxRdoT7f7SRZOteyc1FiwD_MCeKEzxYSlA8d0K0jg/exec";
// ----------------------------------------------

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

  // Enquiry form → email (via Google Apps Script), or WhatsApp if not set up
  const form = document.getElementById("quoteForm");
  const err = document.getElementById("formError");
  const ok = document.getElementById("formOk");
  const btn = document.getElementById("quoteBtn");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = ""; ok.textContent = "";
    const f = new FormData(form);
    const val = (k) => (f.get(k) || "").toString().trim();
    const data = {
      name: val("name"), company: val("company"), email: val("email"), phone: val("phone"),
      country: val("country"), volume: val("volume"), varieties: f.getAll("v").join(", "),
      message: val("message"), website: val("website"), page: location.href,
    };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    form.name.classList.toggle("invalid", !data.name);
    form.email.classList.toggle("invalid", !emailOk);
    form.country.classList.toggle("invalid", !data.country);
    if (!data.name || !emailOk || !data.country) { err.textContent = "Please add your name, a valid email and your country/city."; return; }

    if (!ENQUIRY_URL) { openWhatsApp(data); return; }

    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const res = await fetch(ENQUIRY_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "failed");
      form.reset();
      ok.textContent = "Thank you, " + data.name + ". Your enquiry has reached us and we'll reply soon.";
    } catch (ex) {
      err.textContent = "Sorry, we couldn't send that just now. Please WhatsApp or call +91 80882 85812.";
    } finally {
      btn.disabled = false; btn.textContent = "Send enquiry";
    }
  });

  function openWhatsApp(d) {
    const lines = [
      "Hello TriBloom Farms, I'd like a quote.", "",
      "Name: " + d.name, d.company && "Company: " + d.company, "Email: " + d.email, d.phone && "Phone: " + d.phone,
      "Country/city: " + d.country, d.varieties && "Interested in: " + d.varieties,
      d.volume && "Weekly volume: " + d.volume, d.message && "Message: " + d.message,
    ].filter((l) => l !== "" && l !== undefined && l !== false || false).join("\n");
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines), "_blank", "noopener");
  }

  document.getElementById("waFloat").href = "https://wa.me/" + WHATSAPP_NUMBER;
  document.getElementById("year").textContent = new Date().getFullYear();
})();
