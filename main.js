(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // ---- Boot sequence (once per session) ----
  let booted = false;
  try { booted = sessionStorage.getItem("booted") === "1"; } catch (e) {}
  if (!booted && !reduce) {
    const boot = document.createElement("div");
    boot.id = "boot";
    boot.setAttribute("aria-hidden", "true");
    const lines = [
      '<span class="hd">HK · SALA DE CONTROLE</span>',
      "&gt; PLC ............... <span class=\"ok\">OK</span>",
      "&gt; SCADA ............. <span class=\"ok\">OK</span>",
      "&gt; OPC ............... <span class=\"ok\">OK</span>",
      "&gt; PIMS .............. <span class=\"ok\">OK</span>",
    ];
    boot.innerHTML = '<pre></pre><span class="bar"></span>';
    document.body.appendChild(boot);
    const pre = boot.querySelector("pre");
    lines.forEach((l, i) => setTimeout(() => { pre.innerHTML += (i ? "\n" : "") + l; }, 120 + i * 170));
    const end = () => { boot.classList.add("done"); setTimeout(() => boot.remove(), 500); };
    const t = setTimeout(end, 1350);
    boot.addEventListener("click", () => { clearTimeout(t); end(); });
    try { sessionStorage.setItem("booted", "1"); } catch (e) {}
  }

  // ---- Language ----
  const langBtn = $("#langBtn");
  const setLang = (lang) => {
    root.dataset.lang = lang;
    root.lang = lang === "en" ? "en" : "pt-BR";
    langBtn.textContent = lang === "en" ? "PT" : "EN";
    store.set("lang", lang);
    updateYear(currentJob, false);
  };
  langBtn.addEventListener("click", () => setLang(root.dataset.lang === "pt" ? "en" : "pt"));

  // ---- Header, progress bar, mobile menu ----
  const top = $("#top");
  const progress = $("#progress");
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }
  });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // ---- Scroll spy (top nav + side rail) ----
  const spyLinks = $$("[data-spy]");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      spyLinks.forEach((a) => a.classList.toggle("active", a.dataset.spy === id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-section]").forEach((s) => spy.observe(s));

  // ---- Clock (Brasília time) ----
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);

  // ---- Hero spotlight + HMI tilt ----
  const hero = $(".hero");
  const hmi = $(".hmi");
  if (finePointer && !reduce) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      hmi.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      hmi.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", () => { hmi.style.setProperty("--rx", "0deg"); hmi.style.setProperty("--ry", "0deg"); });
  }

  // ---- Seamless loops: duplicate photo strips ----
  $$(".strip-track").forEach((t) => {
    [...t.children].forEach((fig) => {
      const c = fig.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      t.appendChild(c);
    });
  });

  // ---- Project filters ----
  const cards = $$("#bento .card");
  const filterBtns = $$(".filters button");
  filterBtns.forEach((b) => {
    const f = b.dataset.filter;
    const n = f === "all" ? cards.length : cards.filter((c) => c.dataset.cat.split(" ").includes(f)).length;
    b.querySelector("em").textContent = String(n).padStart(2, "0");
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.toggle("on", x === b));
      cards.forEach((c) => {
        const show = f === "all" || c.dataset.cat.split(" ").includes(f);
        c.classList.toggle("hide", !show);
        if (show) c.classList.add("in");
      });
    });
  });

  // ---- Journey: sticky year board + progress line ----
  const jobs = $$(".job");
  const yearNow = $("#yearNow"), yearTo = $("#yearTo"), yearOrg = $("#yearOrg");
  const jobsBox = $(".jobs"), lineFill = $("#lineFill");
  let currentJob = jobs[0];
  function updateYear(job, animate = true) {
    if (!job || !yearNow) return;
    const [pt, en] = job.dataset.y2.split("|");
    yearNow.textContent = job.dataset.y1;
    yearTo.innerHTML = `<span lang="pt">${pt}</span><span lang="en">${en || pt}</span>`;
    yearOrg.textContent = job.dataset.org;
    jobs.forEach((j) => j.classList.toggle("active", j === job));
    if (animate) { yearNow.classList.remove("flip"); void yearNow.offsetWidth; yearNow.classList.add("flip"); }
  }
  const jobSpy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && en.target !== currentJob) { currentJob = en.target; updateYear(currentJob); }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  jobs.forEach((j) => jobSpy.observe(j));

  // ---- Scroll-driven bits (rAF throttled) ----
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", h > 0 ? (y / h).toFixed(4) : 0);
    top.classList.toggle("scrolled", y > 20);
    if (jobsBox) {
      const r = jobsBox.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height));
      lineFill.style.setProperty("--fill", (p * 100).toFixed(1) + "%");
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // ---- Videos: play only while visible ----
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !reduce) en.target.play().catch(() => {});
      else en.target.pause();
    });
  }, { threshold: 0.15 });
  $$(".loops video, .hero-video").forEach((v) => { if (reduce) v.removeAttribute("autoplay"); vio.observe(v); });

  // ---- Project dialog ----
  const dlg = $("#projDialog");
  $$("[data-proj]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".proj", dlg).forEach((p) => p.classList.toggle("active", p.id === "p-" + btn.dataset.proj));
      dlg.showModal();
      dlg.scrollTop = 0;
    });
  });
  $("[data-close]", dlg).addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => $$("video", dlg).forEach((v) => v.pause()));
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  // ---- Lightbox ----
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  const lbCap = $("p", lb);
  const zoomable = ".strip img, .feature-stage img, .rc img, dialog .pics img";
  document.addEventListener("click", (e) => {
    const img = e.target.closest(zoomable);
    if (!img || lb.contains(img)) return;
    const fig = img.closest("figure");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.dataset.cap || fig?.querySelector("figcaption")?.innerText || img.alt;
    lb.showModal();
  });
  lb.addEventListener("click", () => lb.close());

  // ---- Init ----
  let initial = store.get("lang") || (navigator.language.startsWith("pt") ? "pt" : "en");
  setLang(initial);
  onScroll();
})();
