(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = (name, data) => { try { window.umami && window.umami.track(name, data); } catch (e) {} };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // ---- Language ----
  const langBtn = $("#langBtn");
  const setLang = (lang) => {
    root.dataset.lang = lang;
    root.lang = lang === "en" ? "en" : "pt-BR";
    langBtn.textContent = lang === "en" ? "PT" : "EN";
    store.set("lang", lang);
  };
  langBtn.addEventListener("click", () => {
    const lang = root.dataset.lang === "pt" ? "en" : "pt";
    setLang(lang);
    track("idioma", { para: lang });
  });

  // ---- Header + mobile menu ----
  const top = $("#top");
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }
  });
  const onScroll = () => top.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // ---- Active nav link ----
  const spyLinks = $$("[data-spy]");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) spyLinks.forEach((a) => a.classList.toggle("active", a.dataset.spy === en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-section]").forEach((s) => spy.observe(s));

  // ---- Project filters ----
  const cards = $$("#bento .card");
  const filterBtns = $$(".filters button");
  filterBtns.forEach((b) => {
    const f = b.dataset.filter;
    const n = f === "all" ? cards.length : cards.filter((c) => c.dataset.cat.split(" ").includes(f)).length;
    b.querySelector("em").textContent = n;
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.toggle("on", x === b));
      track("filtro-projetos", { filtro: f });
      cards.forEach((c) => {
        const show = f === "all" || c.dataset.cat.split(" ").includes(f);
        c.classList.toggle("hide", !show);
        if (show) c.classList.add("in");
      });
    });
  });

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
      track("projeto-aberto", { projeto: btn.dataset.proj });
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
  setLang(store.get("lang") || (navigator.language.startsWith("pt") ? "pt" : "en"));
  onScroll();
})();
