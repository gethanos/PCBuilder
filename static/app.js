/**
 * MIT License
 * 
 * Copyright (c) 2019–2025 Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος), CITEd.gr VLE
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// app.js — v4.9 (fix: κουμπιά, modal search, φίλτρα)
// Σημαντικό: Δεν αλλάζει ΚΑΘΟΛΟΥ το HTML (index.php).
//
// Τι διορθώθηκε:
// - Τα κουμπιά δουλεύουν ακόμα κι αν αργεί/αποτυγχάνει το fetch (δεν μπλοκάρει όλο το script).
//   Κάνουμε lazy φόρτωση components και συνδέουμε listeners πριν ολοκληρωθεί το fetch.
// - Modal search λειτουργεί live (input/keyup) και υπερισχύει όταν είναι ανοιχτό το modal.
// - Τα global φίλτρα εφαρμόζονται μόνο στις σχετικές κατηγορίες (socket -> motherboard/cpu κ.λπ.).
// - Πιο ανεκτικές συγκρίσεις (RAM DDR4/DDR5), USB‑C headers, HDMI/DP variants.
// - PSU estimate με margin ανά χρήση και αντίστοιχο threshold στο validation.
// - Ασφάλειες (guards) και validation στο restore.
//
// Προσέγγιση φόρτωσης:
// - Ξεκινάμε fetch στο παρασκήνιο (loadComponents()), ΔΕΝ κάνουμε await πριν δέσουμε listeners.
// - Αν ανοίξεις modal πριν φορτώσει, θα δεις "Φόρτωση...". Αν αποτύχει, θα δεις μήνυμα σφάλματος.

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    const target = document.getElementById('tab-' + t.dataset.tab);
    if (target) target.classList.add('active');
    t.classList.add('active');
  }));

  // Filters
  const filterSocket = document.getElementById('filterSocket');
  const filterRamType = document.getElementById('filterRamType');
  const filterVideo = document.getElementById('filterVideo');
  const filterCaseSize = document.getElementById('filterCaseSize');
  const globalSearch = document.getElementById('globalSearch');

  // Usage selector
  const usageSelect = document.getElementById('usageSelect');
  let usage = usageSelect ? usageSelect.value : 'internet';
  if (usageSelect) usageSelect.addEventListener('change', () => { usage = usageSelect.value; renderSummary(); });

  // Modals
  const chooserModal = document.getElementById('chooserModal');
  const chooserBackdrop = chooserModal ? chooserModal.querySelector('.modal-backdrop') : null;
  const modalList = document.getElementById('modalList');
  const modalTitle = document.getElementById('modalTitle');
  const modalSearch = document.getElementById('modalSearch');
  const modalClose = document.getElementById('modalClose');
  const modalCloseX = document.getElementById('modalCloseX');

  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const helpBackdrop = helpModal ? helpModal.querySelector('.modal-backdrop') : null;
  const helpClose = document.getElementById('helpClose');
  const helpCloseX = document.getElementById('helpCloseX');

  const infoModal = document.getElementById('infoModal');
  const infoBackdrop = infoModal ? infoModal.querySelector('.modal-backdrop') : null;
  const infoClose = document.getElementById('infoClose');
  const infoCloseX = document.getElementById('infoCloseX');
  const infoTitle = document.getElementById('infoTitle');
  const infoItemNameEl = document.getElementById('infoItemName');
  const infoLinksList = document.getElementById('infoLinksList');

  function openModal(m){
    if (!m) return;
    m.setAttribute('aria-hidden', 'false');
    const input = m.querySelector('input');
    if (input) input.focus();
  }
  function closeModal(m){
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    if (m === chooserModal && modalList) modalList.innerHTML = '';
    if (m === infoModal && infoLinksList) infoLinksList.innerHTML = '';
  }

  if (helpBtn) helpBtn.addEventListener('click', () => openModal(helpModal));
  if (helpBackdrop) helpBackdrop.addEventListener('click', e => { if (e.target.dataset.close === 'true') closeModal(helpModal); });
  if (helpClose) helpClose.addEventListener('click', () => closeModal(helpModal));
  if (helpCloseX) helpCloseX.addEventListener('click', () => closeModal(helpModal));

  if (chooserBackdrop) chooserBackdrop.addEventListener('click', e => { if (e.target.dataset.close === 'true') closeModal(chooserModal); });
  if (modalClose) modalClose.addEventListener('click', () => closeModal(chooserModal));
  if (modalCloseX) modalCloseX.addEventListener('click', () => closeModal(chooserModal));

  if (infoBackdrop) infoBackdrop.addEventListener('click', e => { if (e.target.dataset.close === 'true') closeModal(infoModal); });
  if (infoClose) infoClose.addEventListener('click', () => closeModal(infoModal));
  if (infoCloseX) infoCloseX.addEventListener('click', () => closeModal(infoModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (helpModal && helpModal.getAttribute('aria-hidden') === 'false') closeModal(helpModal);
      if (chooserModal && chooserModal.getAttribute('aria-hidden') === 'false') closeModal(chooserModal);
      if (infoModal && infoModal.getAttribute('aria-hidden') === 'false') closeModal(infoModal);
    }
  });

  // Chooser targets
  const ids = {
    mb: {thumb:'mbThumb', text:'mbText', key:'motherboard'},
    cpu: {thumb:'cpuThumb', text:'cpuText', key:'cpu'},
    cooler: {thumb:'coolerThumb', text:'coolerText', key:'cpu_cooler'},
    gpu: {thumb:'gpuThumb', text:'gpuText', key:'gpu'},
    psu: {thumb:'psuThumb', text:'psuText', key:'psu'},
    case: {thumb:'caseThumb', text:'caseText', key:'case'},
    monitor: {thumb:'monThumb', text:'monText', key:'monitor'},
    keyboard: {thumb:'kbdThumb', text:'kbdText', key:'keyboard'},
    mouse: {thumb:'mouseThumb', text:'mouseText', key:'mouse'},
    os: {thumb:'osThumb', text:'osText', key:'operating_system'}
  };

  const ramList = document.getElementById('ramList');
  const addRamBtn = document.getElementById('addRamBtn');
  const storageList = document.getElementById('storageList');
  const addStorageBtn = document.getElementById('addStorageBtn');

  const validateBtn = document.getElementById('validateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const restoreBtn = document.getElementById('restoreBtn');
  const specsDiv = document.getElementById('specs');
  const resultDiv = document.getElementById('result');
  const historyEl = document.getElementById('history');
  const badgesDiv = document.getElementById('summaryBadges');

  // State φόρτωσης components
  let components = [];
  let componentsLoaded = false;
  let componentsError = null;
  let categoryInModal = null;

  // Συνδέουμε ΠΡΩΤΑ τα κουμπιά (ώστε να δουλεύουν άμεσα)
  document.querySelectorAll('.choose-btn').forEach(btn => btn.addEventListener('click', (e) => {
    categoryInModal = e.currentTarget.dataset.category;
    if (modalTitle) modalTitle.textContent = `Επιλογή — ${categoryInModal}`;
    if (modalSearch) modalSearch.value = '';
    populateModal(categoryInModal);
    openModal(chooserModal);
  }));

  if (addRamBtn) addRamBtn.addEventListener('click', () => {
    categoryInModal = 'ram';
    if (modalTitle) modalTitle.textContent = 'Επιλογή RAM';
    if (modalSearch) modalSearch.value = '';
    populateModal('ram');
    openModal(chooserModal);
  });
  if (addStorageBtn) addStorageBtn.addEventListener('click', () => {
    categoryInModal = 'storage';
    if (modalTitle) modalTitle.textContent = 'Επιλογή δίσκου';
    if (modalSearch) modalSearch.value = '';
    populateModal('storage');
    openModal(chooserModal);
  });

  // Modal search live
  if (modalSearch) {
    ['input','keyup'].forEach(evt => {
      modalSearch.addEventListener(evt, () => { if (categoryInModal) populateModal(categoryInModal); });
    });
  }

  // Global filters: αν είναι ανοιχτό modal, ανανέωσε τη λίστα
  [filterSocket, filterRamType, filterVideo, filterCaseSize].forEach(el => el && el.addEventListener('change', () => {
    if (chooserModal && chooserModal.getAttribute('aria-hidden') === 'false' && categoryInModal){
      populateModal(categoryInModal);
    }
  }));
  if (globalSearch) globalSearch.addEventListener('input', () => {
    if (chooserModal && chooserModal.getAttribute('aria-hidden') === 'false' && categoryInModal){
      populateModal(categoryInModal);
    }
  });

  if (resetBtn) resetBtn.addEventListener('click', () => {
    Object.keys(selected).forEach(k => Array.isArray(selected[k]) ? selected[k]=[] : selected[k]=0 );
    if (resultDiv) resultDiv.innerHTML='';
    if (specsDiv) specsDiv.innerHTML='Επίλεξε εξαρτήματα για να δεις προδιαγραφές.';
    if (badgesDiv) badgesDiv.innerHTML='';
    if (historyEl) historyEl.innerHTML='';
    saveDraft();
    renderPreview();
  });

  if (restoreBtn) restoreBtn.addEventListener('click', () => {
    const draft = localStorage.getItem('pcbuilder_draft');
    if (!draft) return;
    try {
      const obj = JSON.parse(draft);
      const keys = ['motherboard','cpu','cpu_cooler','gpu','psu','case','monitor','keyboard','mouse','operating_system','ram','storage'];
      const isValid = keys.every(k => k in obj) && Array.isArray(obj.ram) && Array.isArray(obj.storage);
      if (isValid) {
        Object.assign(selected, obj);
        renderPreview();
      } else {
        console.warn('Άκυρο schema στο draft, παράβλεψη.');
      }
    } catch (e) {
      console.warn('Αδυναμία ανάγνωσης draft:', e);
    }
  });

  if (validateBtn) validateBtn.addEventListener('click', () => runValidation());

  // Επιλογές χρήστη
  const selected = { motherboard:0, cpu:0, cpu_cooler:0, gpu:0, psu:0, case:0, monitor:0, keyboard:0, mouse:0, operating_system:0, ram:[], storage:[] };

  // Clear buttons
  document.querySelectorAll('.clear-btn').forEach(b => b.addEventListener('click', (e) => {
    const t = e.currentTarget.dataset.target;
    if (t==='mb') selected.motherboard=0;
    if (t==='cpu') selected.cpu=0;
    if (t==='cooler') selected.cpu_cooler=0;
    if (t==='gpu') selected.gpu=0;
    if (t==='psu') selected.psu=0;
    if (t==='case') selected.case=0;
    if (t==='monitor') selected.monitor=0;
    if (t==='keyboard') selected.keyboard=0;
    if (t==='mouse') selected.mouse=0;
    if (t==='os') selected.operating_system=0;
    saveDraft();
    renderPreview();
  }));

  // Helpers
  function byCategory(cat){ return components.filter(c => c.category === cat); }
  function findById(id){ return components.find(c => c.id === Number(id)); }
  function imgHtml(src,w=96,h=68){ return `<img src="${src||`https://placehold.co/${w}x${h}?text=No+Img`}" alt="" onerror="this.src='https://placehold.co/${w}x${h}?text=No+Img'" style="width:100%;height:auto">`; }
  function caseFormFactors(ck){
    const arr = Array.isArray(ck?.form_factor_support) ? ck.form_factor_support : [];
    return arr.map(s => s.trim()).filter(Boolean);
  }
  function caseSizeTag(ck){
    const ff = caseFormFactors(ck).join(' ').toLowerCase();
    if (ff.includes('mini-itx') || ff.includes('sff')) return 'μικρό';
    if (ff.includes('micro-atx')) return 'μεσαίο';
    if (ff.includes('atx') || ff.includes('e-atx')) return 'μεγάλο';
    return '';
  }
  function parseRamPack(r){
    const name = (r?.name || '').toLowerCase();
    let sticks = typeof r?.sticks === 'number' && r.sticks > 0 ? r.sticks : null;
    let sizePerStick = typeof r?.size_gb === 'number' && r.size_gb > 0 ? r.size_gb : null;
    const m = name.match(/(\d+)\s*x\s*(\d+)\s*gb/);
    if (m) { sticks = parseInt(m[1],10); sizePerStick = parseInt(m[2],10); }
    if (!sticks || !sizePerStick){
      const totalM = name.match(/(\d+)\s*gb/);
      if (totalM){
        const total = parseInt(totalM[1],10);
        if (!sticks && typeof r?.sticks === 'number' && r.sticks > 0) { sticks = r.sticks; sizePerStick = Math.floor(total / sticks); }
        else { sticks = sticks || 1; sizePerStick = sizePerStick || total; }
      }
    }
    sticks = sticks || 1; sizePerStick = sizePerStick || (typeof r?.size_gb === 'number' ? r.size_gb : 0);
    const total = sticks * (sizePerStick || 0);
    const type = r?.type || r?.ram_type || '';
    const speed = r?.speed_mhz || (name.match(/(\d{4,5})\s*mhz/) ? parseInt(RegExp.$1,10) : null);
    return { sticks, sizePerStick, totalGb: total, type, speed };
  }
  function tierLabel(t){
    const x = (t||'').toString().toLowerCase().trim();
    if (x==='low' || x.includes('χαμη')) return 'χαμηλό κόστος';
    if (x==='mid' || x.includes('μεσα')) return 'μεσαίο κόστος';
    if (x==='high' || x.includes('υψη')) return 'υψηλό κόστος';
    return t || '';
  }
  function normalizeTier(t){ const l = tierLabel(t); return l ? l : null; }
  function mbFormFactorBadge(mb){
    const f = (mb?.form_factor || '').trim();
    return f ? `<span class="badge">${f}</span>` : '';
  }
  function baseRamKind(s){
    const v = (s||'').toLowerCase();
    if (v.includes('ddr5')) return 'ddr5';
    if (v.includes('ddr4')) return 'ddr4';
    return v;
  }

  function renderTitle(it){
    const badge = (t)=>`<span class="badge">${t}</span>`;
    const tier = it.price_tier ? ` ${badge(tierLabel(it.price_tier))}` : '';
    switch(it.category){
      case 'motherboard': return `${it.name}${tier} ${badge(it.socket)} ${badge(it.ram_type)} ${mbFormFactorBadge(it)} ${badge('PCIe '+(it.pcie_version||'-'))}`;
      case 'cpu': return `${it.name}${tier} ${badge(it.socket)} ${badge((it.cores||'-')+' Cores')} ${badge((it.threads||'-')+' Threads')}`;
      case 'cpu_cooler': return `${it.name}${tier} ${badge(it.type)}`;
      case 'gpu': return `${it.name}${tier} ${badge((it.vram_gb||'-')+'GB')} ${badge((it.length_mm||'-')+'mm')} ${badge(((it.display_outputs||[])[0]||'').replace(/mini-/i,'mini '))}`;
      case 'psu': return `${it.name}${tier} ${badge((it.wattage||'-')+'W')} ${badge(it.efficiency||'')}`;
      case 'case': {
        const ff = caseFormFactors(it).map(x=>`<span class="badge">${x}</span>`).join(' ');
        const sizeTag = caseSizeTag(it);
        return `${it.name}${tier} ${ff} ${sizeTag ? `<span class="badge">${sizeTag}</span>` : ''}`;
      }
      case 'monitor': return `${it.name}${tier} ${badge((it.refresh_hz||'-')+'Hz')} ${badge((it.ports||[])[0]||'')}`;
      case 'ram': { const p = parseRamPack(it); return `${it.name}${tier} ${badge(`${p.sticks}x${p.sizePerStick}GB`)} ${badge(p.type)} ${p.speed ? badge(`${p.speed}MHz`) : ''}`; }
      case 'storage': return `${it.name}${tier} ${badge(it.interface)} ${badge((it.size_gb||'')+'GB')}`;
      default: return it.name + tier;
    }
  }

  function buildInfoLinks(item){
    const q = encodeURIComponent(item.name);
    const qSpecs = encodeURIComponent(item.name + ' specs');
    const qReview = encodeURIComponent(item.name + ' review');
    const links = [
      { title:'Google — Χαρακτηριστικά', url:`https://www.google.com/search?q=${qSpecs}` },
      { title:'Google — Αξιολογήσεις', url:`https://www.google.com/search?q=${qReview}` },
      { title:'YouTube — Κριτικές/Παρουσιάσεις', url:`https://www.youtube.com/results?search_query=${qReview}` },
      { title:'Reddit — Συζητήσεις', url:`https://www.reddit.com/search/?q=${q}` },
      { title:'PCPartPicker — Αναζήτηση', url:`https://pcpartpicker.com/search/?q=${q}` },
      { title:'Wikipedia — Αναζήτηση', url:`https://en.wikipedia.org/w/index.php?search=${q}` }
    ];
    const brand = (item.name.split(' ')[0] || '').toLowerCase();
    const known = ['asus','msi','gigabyte','asrock','intel','amd','corsair','seagate','western','samsung','kingston','adata','crucial','nzxt','lian','fractal','be','noctua','arctic','silverstone','xfx','evga','nvidia','radeon','aoc','lg','dell','hp','lenovo','philips'];
    if (known.some(b => brand.startsWith(b))) links.push({ title:'Επίσημος ιστότοπος (αναζήτηση)', url:`https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + item.name + ' site')}` });
    return links;
  }

  function openInfo(item){
    if (!infoTitle || !infoItemNameEl || !infoLinksList) return;
    infoTitle.textContent = 'Χρήσιμες πληροφορίες';
    infoItemNameEl.textContent = item.name;
    infoLinksList.innerHTML = '';
    buildInfoLinks(item).forEach(l => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${l.url}" target="_blank" rel="noopener">${l.title}</a><div class="muted">${decodeURIComponent(l.url).slice(0,120)}...</div>`;
      infoLinksList.appendChild(li);
    });
    openModal(infoModal);
  }

  function updateChooser(key, item){
    const elThumb = document.getElementById(ids[key].thumb);
    const elText = document.getElementById(ids[key].text);
    const infoBtn = document.querySelector(`.info-btn[data-target="${ids[key].key}"]`);
    if (elThumb) elThumb.innerHTML = item ? imgHtml(item.image) : '';
    if (elText) elText.innerHTML = item ? renderTitle(item) : '— Δεν επιλέχθηκε —';
    if (infoBtn){
      infoBtn.disabled = !item;
      infoBtn.onclick = () => { if (item) openInfo(item); };
    }
  }

  function renderPreview(){
    updateChooser('mb', findById(selected.motherboard));
    updateChooser('cpu', findById(selected.cpu));
    updateChooser('cooler', findById(selected.cpu_cooler));
    updateChooser('gpu', findById(selected.gpu));
    updateChooser('psu', findById(selected.psu));
    updateChooser('case', findById(selected.case));
    updateChooser('monitor', findById(selected.monitor));
    updateChooser('keyboard', findById(selected.keyboard));
    updateChooser('mouse', findById(selected.mouse));
    updateChooser('os', findById(selected.operating_system));

    // RAM list
    if (ramList) {
      ramList.innerHTML = '';
      selected.ram.forEach((rid, idx) => {
        const r = findById(rid); const p = r ? parseRamPack(r) : {sticks:0,sizePerStick:0,totalGb:0,type:'',speed:null};
        const div = document.createElement('div');
        div.className = 'chooser';
        div.innerHTML = `<div class="thumb">${imgHtml(r?.image,72,54)}</div>
          <div class="seltext">${r ? `${r.name} <span class="badge">${p.sticks}x${p.sizePerStick}GB</span> <span class="badge">${p.type}</span> ${p.speed ? `<span class="badge">${p.speed}MHz</span>` : ''}` : '— Δεν επιλέχθηκε —'}</div>
          <div class="chooser-actions compact"><button class="btn small info-list" data-id="${rid}" title="Χρήσιμες πληροφορίες">Πληρ.</button><button class="btn remove-ram" data-idx="${idx}">Καθ.</button></div>`;
        ramList.appendChild(div);
      });
    }

    // Storage list
    if (storageList) {
      storageList.innerHTML = '';
      selected.storage.forEach((sid, idx) => {
        const s = findById(sid);
        const div = document.createElement('div');
        div.className = 'chooser';
        div.innerHTML = `<div class="thumb">${imgHtml(s?.image,72,54)}</div>
          <div class="seltext">${s ? `${s.name} <span class="badge">${s.type}</span> <span class="badge">${s.interface} ${s.protocol||''}</span> <span class="badge">${s.size_gb||''}GB</span>` : '— Δεν επιλέχθηκε —'}</div>
          <div class="chooser-actions compact"><button class="btn small info-list" data-id="${sid}" title="Χρήσιμες πληροφορίες">Πληρ.</button><button class="btn remove-storage" data-idx="${idx}">Καθ.</button></div>`;
        storageList.appendChild(div);
      });
    }

    document.querySelectorAll('.remove-ram').forEach(b => b.addEventListener('click', (e) => { selected.ram.splice(Number(e.currentTarget.dataset.idx),1); renderPreview(); }));
    document.querySelectorAll('.remove-storage').forEach(b => b.addEventListener('click', (e) => { selected.storage.splice(Number(e.currentTarget.dataset.idx),1); renderPreview(); }));
    document.querySelectorAll('.info-list').forEach(b => b.addEventListener('click', (e) => { const id = Number(e.currentTarget.dataset.id); const it = findById(id); if (it) openInfo(it); }));

    renderSummary();
  }

  function renderSummary(){
    if (!badgesDiv) return;
    badgesDiv.innerHTML = '';
    const mb = findById(selected.motherboard);
    const cpu = findById(selected.cpu);
    const gpu = findById(selected.gpu);
    const psu = findById(selected.psu);
    const ck = findById(selected.case);
    const mon = findById(selected.monitor);
    const badgeEl = (text, cls='') => { const span = document.createElement('span'); span.className = 'badge ' + cls; span.textContent = text; return span; };

    if (mb && cpu) {
      const match = mb.socket === cpu.socket;
      badgesDiv.appendChild(badgeEl(match ? `Συμβατό socket (${mb.socket})` : `Ασυμβατότητα socket: μητρική ${mb.socket} vs CPU ${cpu.socket}`, match ? 'ok' : 'err'));
    }

    if (mb?.form_factor) badgesDiv.appendChild(badgeEl(`Μητρική: ${mb.form_factor}`, 'ok'));

    // RAM totals
    let totalRam = 0; let totalSticks = 0; let ramTypeMismatch = false;
    selected.ram.forEach(rid => {
      const r = findById(rid);
      if (r){
        const p = parseRamPack(r);
        totalRam += p.totalGb; totalSticks += p.sticks;
        const mbType = baseRamKind(mb?.ram_type || '');
        const rType = baseRamKind(p.type || '');
        if (mbType && rType && mbType !== rType) ramTypeMismatch = true;
      }
    });
    if (mb) {
      const okTotal = !mb.max_ram_gb || totalRam <= mb.max_ram_gb;
      badgesDiv.appendChild(badgeEl(`RAM: ${totalRam}GB / Μέγιστο: ${mb.max_ram_gb||'-'}GB`, okTotal ? 'ok' : 'warn'));
      const okSlots = totalSticks <= (mb.ram_slots||0);
      badgesDiv.appendChild(badgeEl(`RAM sticks: ${totalSticks}/${mb.ram_slots||0}`, okSlots ? 'ok' : 'warn'));
      if (ramTypeMismatch) badgesDiv.appendChild(badgeEl(`Τύπος RAM δεν ταιριάζει με τη μητρική`, 'err'));
    }

    if (mb) {
      let m2count = 0; selected.storage.forEach(sid => { const s=findById(sid); if (s && (s.interface||'').toLowerCase().includes('m.2')) m2count++; });
      const okM2 = m2count <= (mb.m2_slots||0);
      badgesDiv.appendChild(badgeEl(`Θέσεις M.2: ${m2count}/${mb.m2_slots||0}`, okM2 ? 'ok' : 'warn'));
    }

    // PSU estimate with usage margin
    let needed = 150;
    if (cpu?.tdp_w) needed += cpu.tdp_w;
    if (gpu?.recommended_psu_w) needed = Math.max(needed, gpu.recommended_psu_w);
    const margin = usage==='gaming_high' ? 150 : usage==='gaming_mid' ? 100 : 50;
    const advised = needed + margin;
    if (psu?.wattage) {
      const okPsu = psu.wattage >= advised;
      badgesDiv.appendChild(badgeEl(`Τροφοδοτικό: ${psu.wattage}W (εκτίμηση ανάγκης ~${advised}W)`, okPsu ? 'ok' : 'warn'));
    } else {
      badgesDiv.appendChild(badgeEl(`Τροφοδοτικό: εκτίμηση ανάγκης ~${advised}W`, 'warn'));
    }

    // Video ports matching
    if (gpu && mon) {
      const norm = (arr) => (arr||[]).map(p => p.toLowerCase().replace(/\s+/g,'').replace(/mini-/,'mini').replace(/displayport/,'dp'));
      const monPorts = norm(mon.ports||[]);
      const gpuPorts = norm(gpu.display_outputs||[]);
      const hasHDMI = monPorts.some(p => p.includes('hdmi')) && gpuPorts.some(p => p.includes('hdmi'));
      const hasDP = monPorts.some(p => p.includes('dp')) && gpuPorts.some(p => p.includes('dp'));
      const common = hasHDMI || hasDP;
      badgesDiv.appendChild(badgeEl(common ? 'Θύρες εικόνας: ΟΚ (HDMI/DP)' : 'Έλεγξε συμβατότητα θυρών εικόνας (HDMI/DP/mini‑HDMI/DP)', common ? 'ok' : 'warn'));
    }

    if (ck) {
      const ff = caseFormFactors(ck);
      ff.forEach(f => badgesDiv.appendChild(badgeEl(`Κουτί: ${f}`, 'ok')));
      const tag = caseSizeTag(ck);
      if (tag) badgesDiv.appendChild(badgeEl(`Μέγεθος: ${tag}`, 'ok'));

      const mbFF = (mb?.form_factor || '').toLowerCase();
      const caseSupportsMb = ff.map(x=>x.toLowerCase()).includes(mbFF);
      if (mbFF) badgesDiv.appendChild(badgeEl(caseSupportsMb ? `Κουτί υποστηρίζει ${mb.form_factor}` : `Το κουτί δεν υποστηρίζει ${mb.form_factor}`, caseSupportsMb ? 'ok' : 'err'));
    }

    if (gpu?.length_mm) badgesDiv.appendChild(badgeEl(`Μήκος GPU: ${gpu.length_mm}mm`, ''));
    if (ck?.max_gpu_length_mm) badgesDiv.appendChild(badgeEl(`Max GPU στο κουτί: ${ck.max_gpu_length_mm}mm`, ''));

    const tiers = {
      cpu: findById(selected.cpu)?.price_tier,
      gpu: findById(selected.gpu)?.price_tier,
      ram: selected.ram.map(rid => findById(rid)?.price_tier).filter(Boolean),
      storage: selected.storage.map(sid => findById(sid)?.price_tier).filter(Boolean),
      psu: findById(selected.psu)?.price_tier,
      case: findById(selected.case)?.price_tier,
      monitor: findById(selected.monitor)?.price_tier,
      motherboard: findById(selected.motherboard)?.price_tier
    };

    const hasAnyStorage = selected.storage.length > 0;
    const hasNvme = selected.storage.some(sid => { const s=findById(sid); const iface=(s?.interface||'').toLowerCase(); const proto=(s?.protocol||'').toLowerCase(); return iface.includes('m.2') && proto.includes('nvme'); });
    const hasSata = selected.storage.some(sid => { const s=findById(sid); return (s?.interface||'').toLowerCase().includes('sata'); });

    const verdict = assessCostEffectiveness(usage, tiers, { totalRam, gpu, cpu, hasNvme, hasAnyStorage, hasSata });
    if (verdict.note) badgesDiv.appendChild(badgeEl(verdict.note, verdict.level));

    renderSpecs();
  }

  function assessCostEffectiveness(usage, tiers, ctx){
    const cpuTier = normalizeTier(tiers.cpu);
    const gpuTier = normalizeTier(tiers.gpu);
    const ramTiers = (tiers.ram || []).map(normalizeTier).filter(Boolean);
    const storageTiers = (tiers.storage || []).map(normalizeTier).filter(Boolean);
    const expect = {
      internet:    { cpu:['χαμηλό κόστος','μεσαίο κόστος'], gpu:[null,'χαμηλό κόστος','μεσαίο κόστος'], ramMin:16, ramTier:['χαμηλό κόστος','μεσαίο κόστος'], storageTier:['χαμηλό κόστος','μεσαίο κόστος'], anyStorageRequired:true, nvmeRecommended:false, nvmeRequired:false, note:'Κατάλληλο για απλή χρήση/Internet.' },
      office:      { cpu:['χαμηλό κόστος','μεσαίο κόστος'], gpu:[null,'χαμηλό κόστος','μεσαίο κόστος'], ramMin:16, ramTier:['χαμηλό κόστος','μεσαίο κόστος'], storageTier:['χαμηλό κόστος','μεσαίο κόστος'], anyStorageRequired:true, nvmeRecommended:false, nvmeRequired:false, note:'Κατάλληλο για γραφείο.' },
      gaming_mid:  { cpu:['μεσαίο κόστος'], gpu:['μεσαίο κόστος','υψηλό κόστος'], ramMin:32, ramTier:['μεσαίο κόστος','υψηλό κόστος'], storageTier:['μεσαίο κόστος','υψηλό κόστος'], anyStorageRequired:true, nvmeRecommended:true, nvmeRequired:false, note:'Κατάλληλο για παιχνίδια (μεσαία).' },
      gaming_high: { cpu:['υψηλό κόστος'],  gpu:['υψηλό κόστος'],               ramMin:32, ramTier:['μεσαίο κόστος','υψηλό κόστος'], storageTier:['μεσαίο κόστος','υψηλό κόστος'], anyStorageRequired:true, nvmeRecommended:true, nvmeRequired:true, note:'Κατάλληλο για παιχνίδια (υψηλή).' }
    }[usage];

    let issues = [];
    let tips = [];

    if (expect.cpu && cpuTier && !expect.cpu.includes(cpuTier)) issues.push('Το κόστος του CPU δεν ταιριάζει με την επιλεγμένη χρήση.');
    if (expect.gpu && gpuTier && !expect.gpu.includes(gpuTier)) issues.push('Το κόστος της GPU δεν ταιριάζει με την επιλεγμένη χρήση.');
    if (ramTiers.length && !ramTiers.every(t => expect.ramTier.includes(t))) issues.push('Το κόστος της RAM δεν ταιριάζει με την επιλεγμένη χρήση.');
    if (storageTiers.length && !storageTiers.every(t => expect.storageTier.includes(t))) issues.push('Το κόστος αποθήκευσης δεν ταιριάζει με την επιλεγμένη χρήση.');

    if (ctx.totalRam < expect.ramMin) issues.push(`Η συνολική RAM είναι μικρότερη από ${expect.ramMin}GB για την επιλεγμένη χρήση.`);
    if (expect.anyStorageRequired && !ctx.hasAnyStorage) issues.push('Δεν έχεις προσθέσει κανέναν δίσκο. Πρόσθεσε NVMe ή SATA.');
    if (expect.nvmeRequired && !ctx.hasNvme) issues.push('Για παιχνίδια υψηλής κατηγορίας απαιτείται NVMe (τουλάχιστον ένας M.2 NVMe).');
    else if (expect.nvmeRecommended && !ctx.hasNvme) tips.push('Για καλύτερα φορτώματα παιχνιδιών (μεσαία κατηγορία), προτείνεται NVMe ως δίσκος συστήματος.');

    if (issues.length) return { note:`Βελτίωσε το build (${issues.length} θέματα). ${tips.length ? 'Συμβουλές: '+tips.join(' ') : ''}`, level:'warn', issues, tips };
    return { note: expect.note + (tips.length ? ' · ' + tips.join(' ') : ''), level:'ok', issues:[], tips };
  }

  function renderSpecs(){
    const mb = findById(selected.motherboard);
    const cpu = findById(selected.cpu);
    const cooler = findById(selected.cpu_cooler);
    const gpu = findById(selected.gpu);
    const psu = findById(selected.psu);
    const ck = findById(selected.case);
    const mon = findById(selected.monitor);
    const os = findById(selected.operating_system);

    let html = '';
    if (mb) html += `<div><b>Μητρική:</b> ${mb.name} ${mb.price_tier ? `(${tierLabel(mb.price_tier)})` : ''}<br><small class="muted">Form factor: ${mb.form_factor||'—'} • Socket: ${mb.socket} • RAM: ${mb.ram_type} • PCIe: ${mb.pcie_version}</small></div><hr>`;
    if (cpu) html += `<div><b>CPU:</b> ${cpu.name} ${cpu.price_tier ? `(${tierLabel(cpu.price_tier)})` : ''}<br><small class="muted">Cores/Threads: ${cpu.cores}/${cpu.threads} • ${cpu.base_clock_ghz}/${cpu.boost_clock_ghz}GHz • ${cpu.tdp_w}W • iGPU: ${cpu.igpu||'—'}</small></div><hr>`;
    if (cooler) html += `<div><b>Ψύκτρα:</b> ${cooler.name} ${cooler.price_tier ? `(${tierLabel(cooler.price_tier)})` : ''}<br><small class="muted">${cooler.type} • Ύψος: ${cooler.height_mm||'—'}mm</small></div><hr>`;
    if (gpu) html += `<div><b>GPU:</b> ${gpu.name} ${gpu.price_tier ? `(${tierLabel(gpu.price_tier)})` : ''}<br><small class="muted">VRAM: ${gpu.vram_gb||'-'}GB • PCIe: ${gpu.pcie_version} • Μήκος: ${gpu.length_mm||'-'}mm • Έξοδοι: ${(gpu.display_outputs||[]).join(', ')}</small></div><hr>`;
    if (psu) html += `<div><b>Τροφοδοτικό:</b> ${psu.name} ${psu.price_tier ? `(${tierLabel(psu.price_tier)})` : ''}<br><small class="muted">${psu.wattage}W • ${psu.efficiency} • Form factor: ${psu.form_factor||'ATX'} • ${(psu.pci_e_connectors||[]).join(', ')}</small></div><hr>`;
    if (ck) {
      const tag = caseSizeTag(ck);
      const ff = caseFormFactors(ck).join(', ');
      html += `<div><b>Κουτί:</b> ${ck.name} ${ck.price_tier ? `(${tierLabel(ck.price_tier)})` : ''}<br><small class="muted">Υποστήριξη μητρικής: ${ff || '—'} • Μέγεθος: ${tag || '—'} • Max GPU: ${ck.max_gpu_length_mm||'—'}mm • Max ψύκτρα: ${ck.max_cooler_height_mm||'—'}mm • Front I/O: ${(ck.front_io||[]).join(', ')}</small></div><hr>`;
    }
    if (mon) html += `<div><b>Οθόνη:</b> ${mon.name} ${mon.price_tier ? `(${tierLabel(mon.price_tier)})` : ''}<br><small class="muted">Panel: ${mon.panel||'-'} • Ανάλυση: ${mon.resolution||'-'} • ${mon.refresh_hz||''}Hz • Θύρες: ${(mon.ports||[]).join(', ')}</small></div><hr>`;
    if (os) html += `<div><b>Λειτουργικό:</b> ${os.name}<br><small class="muted">${os.edition||''} • ${os.bits||''}-bit</small></div><hr>`;

    // RAM summary
    if (selected.ram.length){
      let total = 0; let sticks = 0;
      html += `<div><b>RAM:</b><br>`;
      selected.ram.forEach(rid => { const r=findById(rid); if (r){ const p=parseRamPack(r); total += p.totalGb; sticks += p.sticks; html += `${r.name} ${r.price_tier ? `(${tierLabel(r.price_tier)})` : ''} • ${p.sticks}x${p.sizePerStick}GB ${p.type} ${p.speed ? `@ ${p.speed}MHz` : ''}<br>`; } });
      html += `<small class="muted">Σύνολο: ${total}GB • Sticks: ${sticks}</small></div><hr>`;
    }

    // Storage summary
    if (selected.storage.length){
      let m2count = 0; let hasNvme=false; let hasSata=false;
      html += `<div><b>Αποθήκευση:</b><br>`;
      selected.storage.forEach(sid => { const s=findById(sid); if (s){
        const iface=(s.interface||'').toLowerCase(); const proto=(s.protocol||'').toLowerCase();
        if (iface.includes('m.2')) m2count++;
        if (iface.includes('m.2') && proto.includes('nvme')) hasNvme=true;
        if (iface.includes('sata')) hasSata=true;
        html += `${s.name} ${s.price_tier ? `(${tierLabel(s.price_tier)})` : ''} • ${s.type} • ${s.interface} ${s.protocol||''} • ${s.size_gb||''}GB<br>`;
      }});
      if (findById(selected.motherboard) && m2count > (findById(selected.motherboard).m2_slots||0)) html += `<small style="color:var(--warn)">Προειδοποίηση: ${m2count} M.2 δίσκοι > διαθέσιμες θέσεις.</small><br>`;
      if (usage==='gaming_high' && !hasNvme) html += `<small style="color:var(--warn)">Για παιχνίδια (υψηλή κατηγορία) απαιτείται NVMe (M.2 NVMe).</small><br>`;
      if (usage==='gaming_mid' && !hasNvme) html += `<small class="muted">Σύσταση: NVMe για καλύτερα φορτώματα παιχνιδιών.</small><br>`;
      if ((usage==='office' || usage==='internet') && !hasNvme && !hasSata) html += `<small style="color:var(--warn)">Χρειάζεται τουλάχιστον ένας δίσκος (NVMe ή SATA).</small><br>`;
      html += `</div><hr>`;
    }

    if (specsDiv) specsDiv.innerHTML = html || 'Επίλεξε εξαρτήματα για να δεις προδιαγραφές.';
  }

  function applyGlobalFilters(it){
    const s = (filterSocket?.value || '').toLowerCase();
    const r = (filterRamType?.value || '').toLowerCase();
    const v = (filterVideo?.value || '').toLowerCase();
    const caseSize = (filterCaseSize?.value || '').toLowerCase();

    const isChooserOpen = chooserModal && chooserModal.getAttribute('aria-hidden') === 'false';
    const rawQ = isChooserOpen ? (modalSearch?.value || '') : (globalSearch?.value || '');
    const q = rawQ.trim().toLowerCase();

    const text = [
      it.name, it.socket, it.form_factor, it.ram_type || it.type, it.pcie_version,
      (it.display_outputs || it.ports || []).join(' '), it.interface, it.protocol
    ].map(x => (x||'').toString().toLowerCase()).join(' ');
    const textExpanded = JSON.stringify(it).toLowerCase();

    if (s && (it.category === 'motherboard' || it.category === 'cpu')) {
      if ((it.socket||'').toLowerCase() !== s) return false;
    }
    if (r && (it.category === 'motherboard' || it.category === 'ram')) {
      const ramType = (it.ram_type || it.type || '').toLowerCase();
      if (!ramType.includes(r)) return false;
    }
    if (v && (it.category === 'gpu' || it.category === 'monitor')) {
      const outputs = (it.display_outputs || it.ports || []).join(' ').toLowerCase();
      if (!outputs.includes(v)) return false;
    }
    if (caseSize && it.category === 'case') {
      const tag = caseSizeTag(it);
      if (caseSize==='small' && tag!=='μικρό') return false;
      if (caseSize==='medium' && tag!=='μεσαίο') return false;
      if (caseSize==='large' && tag!=='μεγάλο') return false;
    }

    if (q && !(text.includes(q) || textExpanded.includes(q))) return false;
    return true;
  }

  function populateModal(category){
    if (!modalList) return;
    if (!componentsLoaded && !componentsError){
      modalList.innerHTML = `<div class="muted" style="padding:12px">Φόρτωση...</div>`;
      return;
    }
    if (componentsError){
      modalList.innerHTML = `<div class="muted" style="padding:12px;color:var(--danger)">Αποτυχία φόρτωσης components. Δοκίμασε ανανέωση.</div>`;
      return;
    }
    const items = byCategory(category).filter(applyGlobalFilters);
    modalList.innerHTML = '';
    if (!items.length){
      modalList.innerHTML = `<div class="muted" style="padding:12px">Δεν βρέθηκαν αντικείμενα (άλλαξε φίλτρα/αναζήτηση).</div>`;
      return;
    }
    items.forEach(it => {
      const card = document.createElement('div'); card.className='card-item'; card.dataset.id=it.id;
      let extraTag = '';
      if (category === 'case') extraTag = caseFormFactors(it).join(', ');
      if (category === 'motherboard') extraTag = it.form_factor || '';
      card.innerHTML = `<div class="card-thumb">${imgHtml(it.image)}</div>
        <div class="card-info"><b>${it.name}</b>
        <div class="muted">${shortSpecs(it)} ${extraTag ? `• ${extraTag}` : ''} ${it.price_tier ? `• ${tierLabel(it.price_tier)}` : ''}</div></div>`;
      card.addEventListener('click', () => { applySelection(category, it.id); closeModal(chooserModal); saveDraft(); });
      modalList.appendChild(card);
    });
  }

  function shortSpecs(it){
    switch(it.category){
      case 'motherboard': return `${it.form_factor || '—'} • ${it.socket}, PCIe ${it.pcie_version}, USB: ${(it.usb_ports?.rear||[]).join(', ')}`;
      case 'cpu': return `${it.cores}/${it.threads} C/T • ${it.base_clock_ghz}/${it.boost_clock_ghz}GHz • ${it.tdp_w}W • Cooler: ${it.includes_cooler===true?'Yes':it.includes_cooler===false?'No':'—'}`;
      case 'cpu_cooler': return `${it.type} • ύψος ${it.height_mm||'-'}mm`;
      case 'gpu': return `VRAM ${it.vram_gb||'-'}GB • Μήκος ${it.length_mm||'-'}mm • Έξοδοι: ${(it.display_outputs||[]).join(', ')}`;
      case 'psu': return `${it.wattage}W • ${it.efficiency} • ${(it.pci_e_connectors||[]).join(', ')}`;
      case 'case': {
        const ff = caseFormFactors(it).join(', ');
        const sizeTag = caseSizeTag(it);
        return `Υποστήριξη μητρικής: ${ff || '—'} • Μέγεθος: ${sizeTag || '—'} • Max GPU ${it.max_gpu_length_mm||'-'}mm • Front I/O: ${(it.front_io||[]).join(', ')}`;
      }
      case 'monitor': return `${it.resolution||''} • ${it.refresh_hz||''}Hz • Θύρες: ${(it.ports||[]).join(', ')}`;
      case 'keyboard': return `${it.type} • ${it.layout} • ${it.connection}`;
      case 'mouse': return `${it.sensor} • ${it.dpi} • ${it.connection}`;
      case 'operating_system': return `${it.edition||''} • ${it.bits||''}-bit`;
      case 'ram': { const p = parseRamPack(it); return `${p.sticks}x${p.sizePerStick}GB ${p.type} ${p.speed ? `@ ${p.speed}MHz` : ''}`; }
      case 'storage': return `${it.type} • ${it.interface} ${it.protocol||''} • ${it.size_gb||''}GB`;
      default: return '';
    }
  }

  function applySelection(category, id){
    if (['motherboard','cpu','cpu_cooler','gpu','psu','case','monitor','keyboard','mouse','operating_system'].includes(category)) selected[category] = Number(id);
    else if (category === 'ram') selected.ram.push(Number(id));
    else if (category === 'storage') selected.storage.push(Number(id));
    renderPreview();
  }

  function runValidation(){
    const errors=[], warnings=[];
    const mb=findById(selected.motherboard), cpu=findById(selected.cpu), cooler=findById(selected.cpu_cooler), gpu=findById(selected.gpu), psu=findById(selected.psu), ck=findById(selected.case), mon=findById(selected.monitor), os=findById(selected.operating_system);

    if (!mb) errors.push('Επίλεξε μητρική.');
    if (!cpu) errors.push('Επίλεξε CPU.');
    if (!psu) errors.push('Επίλεξε τροφοδοτικό.');
    if (!ck) warnings.push('Επίλεξε κουτί για να ελεγχθούν μήκος GPU/ύψος ψύκτρας/μέγεθος/είδος.');
    if (!mon) warnings.push('Επίλεξε οθόνη για έλεγχο θυρών.');

    if (mb && cpu && mb.socket !== cpu.socket) errors.push(`Ασυμβατότητα socket: μητρική ${mb.socket} vs CPU ${cpu.socket}.`);

    if (mb && ck) {
      const mbFF = (mb.form_factor || '').trim();
      const caseFFs = caseFormFactors(ck).map(x => x.toLowerCase());
      if (mbFF) {
        const ok = caseFFs.includes(mbFF.toLowerCase());
        if (!ok) errors.push(`Το κουτί δεν υποστηρίζει το form factor της μητρικής (${mbFF}).`);
      } else {
        warnings.push('Δεν υπάρχει δηλωμένο form factor στη μητρική για έλεγχο με το κουτί.');
      }
    }

    if (mb){
      const mbType=baseRamKind(mb.ram_type||''), mbSlots=parseInt(mb.ram_slots||0,10), mbMax=parseInt(mb.max_ram_gb||0,10);
      let totalGb = 0, totalSticks = 0;
      selected.ram.forEach(rid => { const r=findById(rid); if (r){ const p=parseRamPack(r); totalGb += p.totalGb; totalSticks += p.sticks; const rType=baseRamKind(p.type||''); if (mbType && rType && mbType!==rType) errors.push(`Τύπος RAM (${p.type}) δεν ταιριάζει με τη μητρική (${mb.ram_type}).`); }});
      if (totalSticks > mbSlots) errors.push(`RAM sticks ${totalSticks} > θέσεις (${mbSlots}).`);
      if (mbMax && totalGb > mbMax) errors.push(`Σύνολο RAM ${totalGb}GB > μέγιστο ${mbMax}GB.`);
      const caseHasFrontTypeC = (ck?.front_io||[]).some(i => i.toLowerCase().includes('usb-c') || i.toLowerCase().includes('type-c'));
      const mbFrontHeaders = (mb?.usb_ports?.front_headers||[]).join(' ').toLowerCase();
      if (caseHasFrontTypeC && !(mbFrontHeaders.includes('usb-c') || mbFrontHeaders.includes('type-c'))) warnings.push('Το κουτί έχει front USB‑C αλλά η μητρική ίσως να μην έχει αντίστοιχο header (USB‑C/Type‑C).');
    }

    if (gpu && ck && gpu.length_mm && ck.max_gpu_length_mm && gpu.length_mm > ck.max_gpu_length_mm) errors.push(`Η κάρτα γραφικών (${gpu.length_mm}mm) δεν χωράει στο κουτί (μέγιστο ${ck.max_gpu_length_mm}mm).`);
    if (cooler && ck && cooler.height_mm && ck.max_cooler_height_mm && cooler.height_mm > ck.max_cooler_height_mm) warnings.push(`Η ψύκτρα (${cooler.height_mm}mm) μπορεί να μην χωράει (μέγιστο ${ck.max_cooler_height_mm}mm).`);

    if (mb){
      let m2count=0; selected.storage.forEach(sid => { const s=findById(sid); if (s && (s.interface||'').toLowerCase().includes('m.2')) m2count++; });
      const mbM2=parseInt(mb.m2_slots||0,10);
      if (m2count > mbM2) errors.push(`Δίσκοι M.2: ${m2count} > διαθέσιμες θέσεις (${mbM2}).`);
    }

    let needed=150; if (cpu?.tdp_w) needed += cpu.tdp_w; if (gpu?.recommended_psu_w) needed = Math.max(needed, gpu.recommended_psu_w);
    const margin = usage==='gaming_high' ? 150 : usage==='gaming_mid' ? 100 : 50;
    const advised = needed + margin;
    if (psu?.wattage && psu.wattage < advised) warnings.push(`Πιθανώς ανεπαρκές τροφοδοτικό (${psu.wattage}W). Εκτίμηση ανάγκης ~${advised}W.`);
    if (psu?.form_factor && ck?.form_factor_support){
      const supportsSFX = ck.form_factor_support.join(' ').toLowerCase().includes('sfx');
      if (psu.form_factor.toLowerCase().includes('sfx') && !supportsSFX) warnings.push('Το τροφοδοτικό είναι SFX αλλά το κουτί μπορεί να μην το υποστηρίζει.');
    }

    const hasAnyStorage = selected.storage.length > 0;
    const hasNvme = selected.storage.some(sid => { const s=findById(sid); const iface=(s?.interface||'').toLowerCase(); const proto=(s?.protocol||'').toLowerCase(); return iface.includes('m.2') && proto.includes('nvme'); });
    const hasSata = selected.storage.some(sid => { const s=findById(sid); return (s?.interface||'').toLowerCase().includes('sata'); });
    if (!hasAnyStorage) errors.push('Δεν έχεις προσθέσει δίσκο. Πρόσθεσε NVMe ή SATA για να λειτουργεί ο υπολογιστής.');
    if (usage==='gaming_high' && !hasNvme) errors.push('Για παιχνίδια (υψηλή κατηγορία) απαιτείται NVMe (M.2 NVMe).');
    if (usage==='gaming_mid' && !hasNvme) warnings.push('Σύσταση: NVMe για καλύτερα φορτώματα παιχνιδιών (μεσαία κατηγορία).');
    if ((usage==='office' || usage==='internet') && !hasNvme && !hasSata) errors.push('Για γραφείο/Internet χρειάζεται τουλάχιστον ένας δίσκος (SATA ή NVMe).');

    const cpuIncludesCooler = cpu?.includes_cooler === true;
    const cpuNeedsStrongCooling = (cpu?.tdp_w || 0) >= 95;
    if (cpu && !cpuIncludesCooler && !cooler) {
      if (cpuNeedsStrongCooling || usage.startsWith('gaming')) errors.push('Ο επεξεργαστής δεν περιλαμβάνει ψύκτρα. Πρόσθεσε ψύκτρα CPU για ασφαλή λειτουργία.');
      else warnings.push('Ο επεξεργαστής ίσως να μην περιλαμβάνει ψύκτρα. Πρόσθεσε ψύκτρα για καλύτερη θερμική συμπεριφορά.');
    }

    const hasDiscreteGpu = !!gpu;
    const hasIgpu = !!cpu?.igpu && cpu.igpu.toString().trim() !== '—';
    if (usage.startsWith('gaming') && !hasDiscreteGpu) warnings.push('Για παιχνίδια είναι απαραίτητη διακριτή GPU. Πρόσθεσε κάρτα γραφικών.');
    else if ((usage==='internet' || usage==='office') && !hasDiscreteGpu && !hasIgpu) warnings.push('Δεν υπάρχει διακριτή GPU ούτε iGPU στον CPU. Για απλή χρήση/γραφείο προτείνεται iGPU ή μικρή GPU.');

    const tiers = { cpu: cpu?.price_tier, gpu: gpu?.price_tier, ram: selected.ram.map(rid => findById(rid)?.price_tier).filter(Boolean), storage: selected.storage.map(sid => findById(sid)?.price_tier).filter(Boolean) };
    const verdict = assessCostEffectiveness(usage, tiers, {
      totalRam: selected.ram.reduce((sum, rid)=>{ const p=parseRamPack(findById(rid)); return sum + (p?.totalGb||0); },0),
      gpu, cpu, hasNvme, hasAnyStorage, hasSata
    });
    if (verdict.issues?.length) warnings.push('Κόστος/απόδοση: ' + verdict.issues.join(' | '));
    if (verdict.tips?.length) warnings.push('Συμβουλές: ' + verdict.tips.join(' | '));

    if (resultDiv) {
      resultDiv.innerHTML = '';
      if (errors.length) resultDiv.innerHTML += `<div style="color:var(--danger)"><b>Σφάλματα:</b><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
      else resultDiv.innerHTML += `<div style="color:var(--success)"><b>ΟΚ:</b> Το build φαίνεται συμβατό.</div>`;
      if (warnings.length) resultDiv.innerHTML += `<div style="color:var(--warn);margin-top:8px;"><b>Προειδοποιήσεις/Συστάσεις:</b><ul>${warnings.map(w=>`<li>${w}</li>`).join('')}</ul></div>`;
    }

    const attempt = { timestamp:new Date().toISOString(), selected:JSON.parse(JSON.stringify(selected)), ok:errors.length===0, errors, warnings };
    prependHistory(attempt);
    saveDraft();
  }

  function saveDraft(){
    try { localStorage.setItem('pcbuilder_draft', JSON.stringify(selected)); }
    catch(e){ console.warn('Αδυναμία αποθήκευσης draft:', e); }
  }
  function prependHistory(attempt){
    if (!historyEl) return;
    const li=document.createElement('li');
    li.textContent=`${new Date(attempt.timestamp).toLocaleString()} — ${attempt.ok?'ΟΚ':'ΠΡΟΒΛΗΜΑ'}`;
    historyEl.prepend(li);
  }

  // Kick off lazy load (ΔΕΝ μπλοκάρουμε τους listeners)
  loadComponents().then(() => {
    // Αν είναι ανοιχτό modal, ανανέωσε
    if (chooserModal && chooserModal.getAttribute('aria-hidden') === 'false' && categoryInModal){
      populateModal(categoryInModal);
    }
  });

  async function loadComponents(){
    componentsLoaded = false; componentsError = null;
    try {
      const res = await fetch('api/get_components.php', { headers: { 'Accept':'application/json' }});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) components = data;
      else if (data && Array.isArray(data.items)) components = data.items;
      else throw new Error('Το JSON δεν είναι array ούτε έχει items[]');
      const bad = components.find(c => typeof c !== 'object' || !c.category || !c.id || !c.name);
      if (bad) throw new Error('Λείπουν βασικά πεδία (id/category/name)');
      componentsLoaded = true;
      renderPreview();
    } catch (e) {
      componentsError = e;
      componentsLoaded = false;
      console.error('Σφάλμα φόρτωσης components:', e);
      if (specsDiv) specsDiv.textContent = 'Σφάλμα φόρτωσης components: ' + e.message;
    }
  }

  renderPreview();
});
