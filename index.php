<?php
/**
 * Project: PC Builder (CITEd.gr VLE)
 * Author: Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος) — info@cited.gr
 * Copyright: © 2019–2025 CITEd.gr
 * License: MIT
 * Description: Εκπαιδευτικό εργαλείο συμβατότητας PC — UI/UX για επιλογή εξαρτημάτων, έλεγχοι συμβατότητας και κόστος/απόδοση.
 */
?>
<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <title>PC Builder — Εκπαιδευτικό εργαλείο συμβατότητας</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="title" content="PC Builder — Εκπαιδευτικό εργαλείο συμβατότητας" />
  <meta name="description" content="Επίλεξε εξαρτήματα, έλεγξε συμβατότητα και κόστος/απόδοση. Το «Είδος χρήσης» βρίσκεται αριστερά." />
  <meta name="keywords" content="PC builder, συμβατότητα, NVMe, DDR5, PCIe, gaming, γραφείο, εκπαιδευτικό, Moodle" />
  <meta name="author" content="Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος)" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="PC Builder — Εκπαιδευτικό εργαλείο συμβατότητας" />
  <meta property="og:description" content="Χτίσε PC, έλεγξε συμβατότητα/απόδοση και αξιοποίησέ το σε εκπαιδευτικά σενάρια." />
  <meta property="og:url" content="https://vle.cited.gr/apps/pcbuilder/" />
  <meta property="og:site_name" content="CITEd.gr VLE" />
  <meta property="og:image" content="https://vle.cited.gr/apps/pcbuilder/assets/img/share-pcbuilder-1200x630.png" />
  <meta property="og:image:alt" content="PC Builder προεπισκόπηση" />
  <meta property="fb:app_id" content="5206041659521286" />
  <meta property="article:publisher" content="https://www.facebook.com/gethanovle" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="PC Builder — Εκπαιδευτικό εργαλείο συμβατότητας" />
  <meta name="twitter:description" content="Χτίσε PC, έλεγξε συμβατότητα και κόστος/απόδοση. Πλήρες εκπαιδευτικό τμήμα βοήθειας." />
  <meta name="twitter:image" content="https://vle.cited.gr/apps/pcbuilder/assets/img/share-pcbuilder-1200x630.png" />
  <meta name="twitter:creator" content="@gethanovle" />
  <link rel="canonical" href="https://vle.cited.gr/apps/pcbuilder/" />
  <link rel="manifest" href="/apps/pcbuilder/manifest.json" />
  <meta name="theme-color" content="#0f4c81" />
  <link rel="preload" href="/apps/pcbuilder/static/cited-logo.png" as="image">
  <link rel="stylesheet" href="/apps/pcbuilder/static/styles.css" />

  <style>
    /* Κάθετη στοίχιση για τα κουμπιά ενέργειας (Επιλογή/Καθαρισμός/Πληροφορίες) */
    .chooser-actions.vertical {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: stretch;
      justify-content: flex-start;
    }
    .chooser-actions.vertical .btn.small {
      width: 100%;
    }
    /* Απόκρυψη κουμπιού Πληροφορίες όταν είναι disabled (δηλ. δεν έχει επιλεγεί κάτι) */
    .info-btn:disabled {
      display: none !important;
    }
  </style>

</head>
<body>
  <header class="topbar">
    <a class="brand" href="https://vle.cited.gr" target="_blank" rel="noopener">
      <img src="/apps/pcbuilder/static/cited-logo.png" alt="CITEd.gr Λογότυπο" class="brand-logo">
      <span class="brand-name">PC Builder</span>
    </a>
    <div class="topbar-right">
      <button class="btn ghost" id="helpBtn" aria-haspopup="dialog" aria-controls="helpModal" aria-label="Βοήθεια">Βοήθεια</button>
      <div class="social">
        <a href="https://www.linkedin.com/in/georgalas" class="social-link" aria-label="LinkedIn" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zm7.5 0h3.8v2.0h.1c.5-1.0 1.8-2.0 3.7-2.0 4.0 0 4.7 2.6 4.7 6.0V23h-4v-6.6c0-1.6-.0-3.6-2.2-3.6-2.2 0-2.5 1.7-2.5 3.5V23h-4V8.5z"/></svg>
        </a>
        <a href="https://www.facebook.com/gethanovle" class="social-link" aria-label="Facebook" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24h11.654v-9.294H9.691V11.06h3.287V8.414c0-3.255 1.992-5.032 4.899-5.032 1.394 0 2.59.104 2.941.15v3.41λ-2.022.001c-1.585 0-1.892.753-1.892 1.858v2.43h3.783λ-.493 3.646h-3.29V24h6.457C23.407 24 24 23.407 24 22.676V1.324C24 .593 23.407 0 22.676 0z"/></svg>
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <aside class="left">
      <h2>Πίνακας επιλογών</h2>

      <div class="usage-block panel">
        <label for="usageSelect" class="usage-label-strong">Είδος χρήσης</label>
        <select id="usageSelect" aria-label="Είδος χρήσης">
          <option value="internet">Internet / απλή χρήση</option>
          <option value="office">Εφαρμογές γραφείου</option>
          <option value="gaming_mid">Παιχνίδια (μεσαία κατηγορία)</option>
          <option value="gaming_high">Παιχνίδια (υψηλή κατηγορία)</option>
        </select>
        <small class="muted">Επηρεάζει συστάσεις NVMe, ελάχιστα RAM, και αξιολόγηση κόστους/απόδοσης.</small>
      </div>

      <div class="tabs" role="tablist" aria-label="Κατηγορίες">
        <button class="tab active" data-tab="core" role="tab" aria-selected="true">Βασικά</button>
        <button class="tab" data-tab="performance" role="tab">Επιδόσεις</button>
        <button class="tab" data-tab="peripherals" role="tab">Περιφερειακά</button>
        <button class="tab" data-tab="software" role="tab">Λογισμικό</button>
      </div>

      <div class="filters panel" aria-label="Φίλτρα">
        <div class="filter-row">
          <label>Socket</label>
          <select id="filterSocket" aria-label="Φίλτρο socket">
            <option value="">Όλα</option>
            <option>LGA1700</option>
            <option>AM4</option>
            <option>AM5</option>
          </select>
        </div>
        <div class="filter-row">
          <label>Τύπος RAM</label>
          <select id="filterRamType" aria-label="Φίλτρο τύπου RAM">
            <option value="">Όλα</option>
            <option>DDR4</option>
            <option>DDR5</option>
          </select>
        </div>
        <div class="filter-row">
          <label>Έξοδοι εικόνας</label>
          <select id="filterVideo" aria-label="Φίλτρο εξόδων εικόνας">
            <option value="">Όλα</option>
            <option>HDMI</option>
            <option>DisplayPort</option>
            <option>USB-C</option>
          </select>
        </div>
        <div class="filter-row">
          <label>Μέγεθος κουτιού</label>
          <select id="filterCaseSize" aria-label="Φίλτρο μεγέθους κουτιού">
            <option value="">Όλα</option>
            <option value="small">Μικρό (Mini‑ITX / SFF)</option>
            <option value="medium">Μεσαίο (Micro‑ATX)</option>
            <option value="large">Μεγάλο (ATX / E‑ATX)</option>
          </select>
        </div>
        <!-- ΑΦΑΙΡΕΘΗΚΕ: Αναζήτηση (globalSearch) από την αρχική αριστερή στήλη -->
      </div>

      <div class="tab-content active" id="tab-core">
        <div class="component-row">
          <label class="label">Μητρική</label>
          <div class="chooser" id="mbChooser">
            <div class="thumb" id="mbThumb"></div>
            <div class="seltext" id="mbText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="motherboard" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="mb" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="motherboard" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Επεξεργαστής (CPU)</label>
          <div class="chooser" id="cpuChooser">
            <div class="thumb" id="cpuThumb"></div>
            <div class="seltext" id="cpuText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="cpu" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="cpu" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="cpu" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Μνήμη (RAM)</label>
          <div id="ramList"></div>
          <div class="row-actions">
            <button class="btn primary" id="addRamBtn">+ Προσθήκη RAM</button>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Αποθήκευση (Δίσκοι)</label>
          <div id="storageList"></div>
          <div class="row-actions">
            <button class="btn primary" id="addStorageBtn">+ Προσθήκη δίσκου</button>
          </div>
        </div>
      </div>

      <div class="tab-content" id="tab-performance">
        <div class="component-row">
          <label class="label">Ψύκτρα CPU</label>
          <div class="chooser" id="coolerChooser">
            <div class="thumb" id="coolerThumb"></div>
            <div class="seltext" id="coolerText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="cpu_cooler" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="cooler" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="cpu_cooler" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Κάρτα Γραφικών (GPU)</label>
          <div class="chooser" id="gpuChooser">
            <div class="thumb" id="gpuThumb"></div>
            <div class="seltext" id="gpuText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="gpu" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="gpu" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="gpu" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Τροφοδοτικό (PSU)</label>
          <div class="chooser" id="psuChooser">
            <div class="thumb" id="psuThumb"></div>
            <div class="seltext" id="psuText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="psu" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="psu" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="psu" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Κουτί (Case)</label>
          <div class="chooser" id="caseChooser">
            <div class="thumb" id="caseThumb"></div>
            <div class="seltext" id="caseText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="case" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="case" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="case" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-content" id="tab-peripherals">
        <div class="component-row">
          <label class="label">Οθόνη (Monitor)</label>
          <div class="chooser" id="monChooser">
            <div class="thumb" id="monThumb"></div>
            <div class="seltext" id="monText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="monitor" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="monitor" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="monitor" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Πληκτρολόγιο</label>
          <div class="chooser" id="kbdChooser">
            <div class="thumb" id="kbdThumb"></div>
            <div class="seltext" id="kbdText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="keyboard" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="keyboard" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="keyboard" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>

        <div class="component-row">
          <label class="label">Ποντίκι</label>
          <div class="chooser" id="mouseChooser">
            <div class="thumb" id="mouseThumb"></div>
            <div class="seltext" id="mouseText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="mouse" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="mouse" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="mouse" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-content" id="tab-software">
        <div class="component-row">
          <label class="label">Λειτουργικό (OS)</label>
          <div class="chooser" id="osChooser">
            <div class="thumb" id="osThumb"></div>
            <div class="seltext" id="osText">— Δεν επιλέχθηκε —</div>
            <div class="chooser-actions vertical">
              <button class="btn choose-btn" data-category="operating_system" title="Επιλογή">Επιλογή</button>
              <button class="btn small clear-btn" data-target="os" title="Καθαρισμός">Καθαρισμός</button>
              <button class="btn small info-btn info pulse" data-target="operating_system" title="Πληροφορίες" disabled>Πληροφορίες</button>
            </div>
          </div>
        </div>
      </div>

      <div class="actions sticky-actions">
        <button class="btn primary" id="validateBtn">Έλεγχος συμβατότητας</button>
        <button class="btn" id="resetBtn">Επαναφορά</button>
        <button class="btn" id="restoreBtn" title="Φόρτωση πρόχειρου">Φόρτωση πρόχειρου</button>
      </div>
    </aside>

    <section class="right">
      <h2>Σύνοψη Build</h2>
      <div id="summary" class="panel">
        <div id="summaryBadges" class="badges"></div>
        <div id="specs" class="specs">Επίλεξε εξαρτήματα για να δεις προδιαγραφές.</div>
      </div>

      <h3>Αποτελέσματα ελέγχου</h3>
      <div id="result" class="panel" aria-live="polite"></div>

      <h3>Ιστορικό προσπαθειών</h3>
      <ul id="history" class="history" aria-live="polite" aria-relevant="additions"></ul>
    </section>
  </main>

  <footer class="footer-clean" role="contentinfo">
    <div class="footer-line"></div>
    <div class="footer-row">
      <div class="footer-col footer-branding">
        <div class="footer-name">
          Γεωργαλάς Αθανάσιος‑Αντώνιος (Θάνος), M.Sc., M.A., ΠΕ86
        </div>
        <div class="footer-copy">
		© <span id="year"></span> · CITEd.gr VLE — 
			<a href="https://vle.cited.gr/apps" target="_blank" rel="noopener">https://vle.cited.gr</a>

			<script>
				  document.getElementById('year').textContent = new Date().getFullYear();
			</script>
        </div>
      </div>
      <div class="footer-col footer-actions">
        <div class="footer-icons">
          <a class="icon" href="https://www.facebook.com/gethanovle" target="_blank" rel="noopener" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24h11.654V13.706H9.691V11.06h3.287V8.414c0-3.255 1.992-5.032 4.899-5.032 1.394 0 2.59.104 2.941.15v3.41λ-2.022.001c-1.585 0-1.892.753-1.892 1.858v2.43h3.783λ-.493 3.646h-3.29V24h6.457C23.407 24 24 23.407 24 22.676V1.324C24 .593 23.407 0 22.676 0z"/></svg>
          </a>
          <a class="icon" href="https://www.linkedin.com/in/georgalas" target="_blank" rel="noopener" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zm7.5 0h3.8v2.0h.1c.5-1.0 1.8-2.0 3.7-2.0 4.0 0 4.7 2.6 4.7 6.0V23h-4v-6.6c0-1.6-.0-3.6-2.2-3.6-2.2 0-2.5 1.7-2.5 3.5V23h-4V8.5z"/></svg>
          </a>
        </div>
        <div class="footer-links">
          <a href="https://vle.cited.gr/apps/pcbuilder/" target="_blank" rel="noopener">PC Builder</a>
          <span class="sep">·</span>
          <a href="https://vle.cited.gr" target="_blank" rel="noopener">Moodle (VLE)</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Modal: Επιλογή -->
  <div id="chooserModal" class="modal" role="dialog" aria-hidden="true" aria-labelledby="modalTitle">
    <div class="modal-backdrop" data-close="true"></div>
    <div class="modal-dialog" role="document">
      <header class="modal-header">
        <h3 id="modalTitle">Επιλογή</h3>
        <input id="modalSearch" placeholder="Φίλτρο (όνομα, socket, RAM, PCIe, HDMI, DP...)" aria-label="Αναζήτηση">
        <button id="modalClose" class="btn small ghost">Κλείσιμο</button>
        <button id="modalCloseX" class="icon-btn" aria-label="Κλείσιμο (Esc)">✕</button>
      </header>
      <div id="modalList" class="modal-list"></div>
      <footer class="modal-footer">
        <div id="modalNote" class="muted small">Κάνε κλικ σε κάρτα για επιλογή. Φίλτραρε με αναζήτηση/filters. Πάτησε Esc ή κλικ έξω για κλείσιμο.</div>
      </footer>
    </div>
  </div>

  <!-- Modal: Βοήθεια — Σκοπός, Χρήση και Εκπαιδευτική αξιοποίηση -->
  <div id="helpModal" class="modal" role="dialog" aria-hidden="true" aria-labelledby="helpTitle">
    <div class="modal-backdrop" data-close="true"></div>
    <div class="modal-dialog" role="document">
      <header class="modal-header">
        <h3 id="helpTitle">Βοήθεια — Σκοπός, Χρήση και Εκπαιδευτική αξιοποίηση</h3>
        <button id="helpClose" class="btn small ghost" aria-label="Κλείσιμο">Κλείσιμο</button>
        <button id="helpCloseX" class="icon-btn" aria-label="Κλείσιμο (Esc)">✕</button>
      </header>
      <div class="modal-content scrollable">
        <section class="help-section">
          <h4>Σκοπός της εφαρμογής</h4>
          <p>Η εφαρμογή PC Builder δημιουργήθηκε για να υποστηρίζει την ορθολογική επιλογή εξαρτημάτων, να ελέγχει αυτόματα βασική τεχνική συμβατότητα (socket, RAM, M.2, PSU, θύρες εικόνας) και να ενισχύει την κριτική σκέψη γύρω από το κόστος/απόδοση, ανάλογα με το «Είδος χρήσης» (Internet/Office/Gaming). Παράλληλα λειτουργεί ως εκπαιδευτικό εργαλείο διερεύνησης, τεκμηρίωσης και αναστοχασμού.</p>
        </section>

        <section class="help-section">
          <h4>Τι προσφέρει εκπαιδευτικά</h4>
          <ul>
            <li>Διερεύνηση επιλογών με βάση πραγματικά κριτήρια (συμβατότητα, κόστος, ανάγκες).</li>
            <li>Σύγκριση διαφορετικών συνθέσεων για να αναδειχθούν συμβιβασμοί και προτεραιότητες.</li>
            <li>Καλλιέργεια τεκμηρίωσης: κάθε επιλογή να συνοδεύεται από αιτιολόγηση.</li>
            <li>Εστίαση στη μεταγνώση: τι θα άλλαζες με λίγο μεγαλύτερο budget και γιατί.</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>Πώς χρησιμοποιείται (βήμα-βήμα)</h4>
          <ol>
            <li><b>Ορισμός χρήσης:</b> Επίλεξε «Είδος χρήσης» (Internet/Office/Gaming μεσαίο/υψηλό). Αυτό επηρεάζει συστάσεις (π.χ. NVMe), ελάχιστα RAM και εκτίμηση τροφοδοτικού.</li>
            <li><b>Επιλογή εξαρτημάτων:</b> Σε κάθε ενότητα (Μητρική, CPU, GPU κ.λπ.) πάτησε «Επιλογή». Στο modal χρησιμοποίησε αναζήτηση/φίλτρα για να εντοπίσεις γρήγορα το σωστό μοντέλο. Πρόσθεσε RAM (ένα ή περισσότερα kits) και δίσκους (NVMe/SATA).</li>
            <li><b>Σύνοψη και έλεγχος:</b> Δες τα badges στη «Σύνοψη Build» (ταχεία ένδειξη συμβατότητας/αναγκών). Πάτησε «Έλεγχος συμβατότητας» για αναλυτική λίστα σφαλμάτων/προειδοποιήσεων. Χρησιμοποίησε το «Πληροφορίες» σε κάθε επιλεγμένο κομμάτι για να βρεις specs/κριτικές/συζητήσεις.</li>
            <li><b>Αναστοχασμός:</b> Σύγκρινε 2–3 εναλλακτικές συνθέσεις για την ίδια χρήση. Κατάγραψε γιατί κράτησες ή απέρριψες επιλογές (συμβιβασμοί, κόστη, ωφέλειες). Σκέψου αναβαθμίσεις: ποια αλλαγή προσφέρει μεγαλύτερη αξία στον συγκεκριμένο ρόλο χρήσης.</li>
          </ol>
        </section>

        <section class="help-section">
          <h4>Τι να προσέχεις</h4>
          <ul>
            <li>CPU/Μητρική: ίδιο socket και κατάλληλο chipset.</li>
            <li>RAM: σωστός τύπος (DDR4/DDR5), sticks ≤ διαθέσιμα slots, σύνολο GB ≤ μέγιστο μητρικής.</li>
            <li>Αποθήκευση: NVMe απαιτείται για gaming υψηλής κατηγορίας, συνιστάται για μεσαία.</li>
            <li>PSU: επάρκεια με περιθώριο ανά χρήση (ενδεικτικά 650–850W, ανάλογα με build).</li>
            <li>Θύρες εικόνας: κοινές θύρες μεταξύ GPU και Οθόνης (HDMI/DP).</li>
            <li>Κουτί: υποστήριξη form factor μητρικής, μήκος GPU, ύψος ψύκτρας.</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>Κλείνοντας</h4>
          <p>Η αξία της εφαρμογής είναι να σε βοηθήσει να επιλέγεις τεχνικά συμβατές συνθέσεις, να ιεραρχείς ανάγκες και κόστη ανά χρήση και να τεκμηριώνεις με σαφήνεια τις αποφάσεις σου. Για περισσότερα εκπαιδευτικά και υλικό, επισκέψου το <a href="https://vle.cited.gr" target="_blank" rel="noopener">Moodle (CITEd.gr VLE)</a>.</p>
        </section>
      </div>
      <footer class="modal-footer">
        <small class="muted">Περισσότερα εκπαιδευτικά: <a href="https://vle.cited.gr" target="_blank" rel="noopener">vle.cited.gr</a></small>
      </footer>
    </div>
  </div>

  <!-- Modal: Χρήσιμες πληροφορίες -->
  <div id="infoModal" class="modal" role="dialog" aria-hidden="true" aria-labelledby="infoTitle">
    <div class="modal-backdrop" data-close="true"></div>
    <div class="modal-dialog" role="document">
      <header class="modal-header">
        <h3 id="infoTitle">Χρήσιμες πληροφορίες</h3>
        <button id="infoClose" class="btn small ghost" aria-label="Κλείσιμο">Κλείσιμο</button>
        <button id="infoCloseX" class="icon-btn" aria-label="Κλείσιμο (Esc)">✕</button>
      </header>
      <div class="modal-content info-links">
        <p class="muted">Σύνδεσμοι για: <b id="infoItemName">—</b></p>
        <ul id="infoLinksList" class="link-list"></ul>
        <p class="muted small">Σημείωση: Τα αποτελέσματα ανοίγουν σε νέα καρτέλα.</p>
      </div>
      <footer class="modal-footer">
        <small class="muted">Tip: Κράτησε πατημένο Ctrl/⌘ για να ανοίξεις πολλούς συνδέσμους γρήγορα.</small>
      </footer>
    </div>
  </div>

  <script src="/apps/pcbuilder/static/app.js"></script>
</body>
</html>
