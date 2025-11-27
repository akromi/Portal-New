  
  
// =======================
// Accessibility helpers (structural only — no UX/labels/handlers)
// =======================

function patchFileControlForAccessibility(baseId) {
  const input = document.getElementById(`${baseId}_input_file`);
  const label = document.getElementById(`${baseId}_label`);
  if (!input || !label) return;
  if (input.dataset.accessibilityPatched === "1") return;
  input.dataset.accessibilityPatched = "1";

  // Expose native input for assistive tech (don't keep display:none)
  input.style.display = "";
  input.classList.add("wb-inv"); // visually hidden, still focusable

  // Programmatic name via <label for> + aria-labelledby
  label.setAttribute("for", input.id);
  input.removeAttribute("aria-label");
  input.setAttribute("aria-labelledby", label.id);

  // Optional polite live region
  const container = input.closest(".file-control-container")?.parentElement || input.parentElement;
  const liveId = `${baseId}_live`;
  if (container && !document.getElementById(liveId)) {
    const live = document.createElement("div");
    live.id = liveId;
    live.className = "wb-inv";
    live.setAttribute("aria-live", "polite");
    container.appendChild(live);
  }
}

function patchAllFileControlsForAccessibility() {
  document.querySelectorAll('input[type="file"][id$="_input_file"]').forEach(inp => {
    const baseId = inp.id.replace(/_input_file$/, "");
    patchFileControlForAccessibility(baseId);
  });
  sanitizeFileButtons();
}

// Expose (new names)
window.patchFileControlForAccessibility = patchFileControlForAccessibility;
window.patchAllFileControlsForAccessibility = patchAllFileControlsForAccessibility;

function sanitizeFileButtons() {
  $('.file-control-container, .container-file-input').each(function () {
    const $block = $(this);
    const $btn = $block.find('button.btn-for-file-input').first();
    const $input = $block.find('input[type="file"]').first();

    if (!$btn.length || !$input.length) return;

    // 1) Remove attributes that should never be on a button
    $btn.removeAttr('required')
      .removeAttr('aria-invalid')
      .removeAttr('aria-describedby');

    // 2) Wire correct ARIA (button announces the label text, controls the input)
    // Find the label that targets this input
    let labelId = '';
    const $label = $block.closest('.cell, td, .form-group')
      .find(`label[for="${$input.attr('id')}"]`).first();
    if ($label.length) labelId = $label.attr('id') || '';

    if (labelId) $btn.attr('aria-labelledby', labelId);
    $btn.attr('aria-controls', $input.attr('id'));
  });
}







/* ============================================================
   File field stock cleanup (ALL stock file errors suppressed)
   - Disables PP Required validator on hidden filename partners
   - Hides ALL inline ".error_message" blocks in the file cell
   - Hides stock <span id="<base>_err"> if present
   - Re-hides on change, partial postbacks, and DOM mutations
  - Leaves YOUR custom validators fully in charge
   ============================================================ */

(function () {
  const LOG  = () => {};
  const DBG  = () => {};

  // Disable/hide built-in Required validator for a given base id
  function disableRequiredHidden(baseId){
    const ids = [
      'RequiredFieldValidator' + baseId + 'hidden_filename',
      'RequiredFieldValidator' + baseId + '_hidden_filename'
    ];
    let touched = 0;

    (window.Page_Validators||[]).forEach(v=>{
      if (!v) return;
      if (ids.includes(String(v.id))) {
        // stop it from failing + displaying
        v.enabled = false;
        v.isvalid = true;
        v.evaluationfunction = function(){ return true; };
        if (typeof window.ValidatorUpdateDisplay === 'function') {
          try { window.ValidatorUpdateDisplay(v); } catch(e){}
        }
        touched++;
        LOG('Disabled PP RequiredFieldValidator:', v.id, 'target=', v.controltovalidate);
        // also hide the DOM span if present
        const el = document.getElementById(v.id);
        if (el) el.style.display = 'none';
      }
    });

    // Fallback: hide DOM span directly if not reflected in Page_Validators yet
    ids.forEach(id=>{
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; touched++; DBG('Hid DOM validator span:', id); }
    });

    if (!touched) DBG('No Required validator found for', baseId, '(ok if PP didn’t render it here)');
  }

  // Find the TD/cell that houses the control + message
  function findCell(baseId){
    const label = document.getElementById(baseId + '_label');
    if (!label) return null;
    return label.closest('.clearfix.cell, td.cell, .form-control-cell, td, .cell');
  }

  // Hide ALL stock inline error nodes inside the file cell
  function hideAllInlineStockMessages(baseId){
    const cell = findCell(baseId);
    if (!cell) { DBG('No cell found for', baseId); return; }

    // 1) Hide every .error_message block regardless of text
    const blocks = cell.querySelectorAll('.error_message');
    if (blocks.length) {
      blocks.forEach(b => { b.style.display = 'none'; b.setAttribute('data-suppressed','1'); });
      LOG('Suppressed', blocks.length, '.error_message block(s) for', baseId);
    } else {
      DBG('No .error_message blocks for', baseId);
    }

    // 2) Hide stock <span id="<base>_err"> ONLY if it is NOT under the label
    const label = document.getElementById(baseId + '_label');
    const stock = document.getElementById(baseId + '_err');
    const isUnderLabel = !!(label && stock && label.contains(stock));
    if (stock && !isUnderLabel) {
      stock.style.display = 'none';
      DBG('Hid stock inline span outside label:', baseId + '_err');
    }
  }

  // MutationObserver: keep hiding anything new that appears in the cell
  const observers = new Map();
  function ensureObserver(baseId){
    const cell = findCell(baseId);
    if (!cell || observers.has(baseId)) return;

    const obs = new MutationObserver((mutations)=>{
      let changed = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
          // If any new error nodes appear, squash them
          const blocks = cell.querySelectorAll('.error_message');
          blocks.forEach(b => {
            if (b.style.display !== 'none') { b.style.display = 'none'; changed = true; }
          });

          // Only hide <base>_err if it's not under the label (our custom inline lives under the label)
          const label = document.getElementById(baseId + '_label');
          const stock = document.getElementById(baseId + '_err');
          const isUnderLabel = !!(label && stock && label.contains(stock));
          if (stock && !isUnderLabel && stock.style.display !== 'none') {
            stock.style.display = 'none';
            changed = true;
          }
        }
      }
      if (changed) LOG('MutationObserver: re-suppressed stock messages for', baseId);
    });

    obs.observe(cell, { childList: true, subtree: true });
    observers.set(baseId, obs);
    DBG('Observer attached for', baseId);
  }

  // Re-hide the inline blocks after any change on the visible file input
  function wireChangeHide(baseId){
    const fin = document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
    if (!fin) { DBG('File input not found for', baseId); return; }
    fin.addEventListener('change', function(){
      hideAllInlineStockMessages(baseId);
    });
  }

  // Public API
  window.suppressStockFileErrors = function(baseIds){
    (baseIds||[]).forEach(id=>{
      LOG('--- suppressStockFileErrors for', id, '---');
      disableRequiredHidden(id);
      hideAllInlineStockMessages(id);
      ensureObserver(id);
      wireChangeHide(id);
    });

    // Handle partial postbacks that may re-inject validators / blocks
    if (window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager) {
      try {
        Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function(){
          LOG('Partial postback detected; re-suppressed for', baseIds);
          (baseIds||[]).forEach(id=>{
            disableRequiredHidden(id);
            hideAllInlineStockMessages(id);
          });
        });
      } catch(e){ /* ignore */ }
    }
  };
})();



// Runtime i18n (reads <html lang> every time)
function fileI18n() {
  const fr = { choose: "Choisir un fichier", change: "Modifier le fichier", delete: "Supprimer", none: "Aucun fichier sélectionné" };
  const en = { choose: "Choose file", change: "Change file", delete: "Delete", none: "No file selected" };
  const lang = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
  return lang.startsWith("fr") ? fr : en;
}


/* ==========================================================
   WET4 / Power Pages File Control Relabeler (Verbose Logs)
   - Idempotent bindings
   - i18n-aware via fileI18n()
   - Accessible (aria-labelledby, aria-controls)
   - Single debounced MutationObserver
   - Extremely chatty diagnostics (no emojis)

   Configure log level at any time:
     window.FILE_LOG_LEVEL = 'debug'; // default
     // 'trace' > 'debug' > 'info' > 'warn' > 'error' > 'off'
   ========================================================== */

(function () {
  // ---------- Logger ----------
  const logger = (() => {
    const levels = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
    const getLevel = () => levels[(window.FILE_LOG_LEVEL || 'warn').toLowerCase()] ?? 2;
    const prefix = '[WET4][FileCtl]';
    const fmt = (msg, ...args) => [`${prefix} ${msg}`, ...args];
    return {
      level: () => getLevel(),
      setLevel: (lvl) => { window.FILE_LOG_LEVEL = String(lvl || 'warn'); },
      trace: (...a) => getLevel() >= 5 && console.log(...fmt(...a)),
      debug: (...a) => getLevel() >= 4 && console.debug(...fmt(...a)),
      info: (...a) => getLevel() >= 3 && console.info(...fmt(...a)),
      warn: (...a) => getLevel() >= 2 && console.warn(...fmt(...a)),
      error: (...a) => getLevel() >= 1 && console.error(...fmt(...a)),
    };
  })();

  function _i18n() {
    // Use fileI18n() if available; fallback to EN literals (no FR hard-coding to avoid stale copies)
    try {
      if (typeof fileI18n === 'function') {
        const t = fileI18n();
        if (t && t.choose && t.change && t.delete && t.none) return t;
      }
    } catch (e) {
      logger.warn('fileI18n() threw; using fallback literals', e);
    }
    const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    // Minimal fallback; adjust if you want French here
    if (lang.startsWith('fr')) {
      return { choose: 'Choisir un fichier', change: 'Modifier le fichier', delete: 'Supprimer', none: 'Aucun fichier sélectionné' };
    }
    return { choose: 'Choose file', change: 'Change file', delete: 'Delete', none: 'No file selected' };
  }

  // Helpers for Option B precedence
  function _readMaxBytesFrom($input) {
    const raw = $input.attr('data-max-bytes');
    if (raw && !isNaN(raw)) return parseInt(raw, 10);
    if (typeof window.DEFAULT_MAX_FILE_BYTES === 'number') return window.DEFAULT_MAX_FILE_BYTES;
    return 4 * 1024 * 1024; // default 4 MiB
  }
  function _readAllowedExtFrom($input) {
    const raw = $input.attr('data-allowed-ext') || '';
    return raw ? raw.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean) : ['pdf','jpg','png','gif'];
  }


// fileInput.js — DROP-IN REPLACEMENT
// UI-only relabeling for Power Pages file inputs (no validation here).
// - Updates filename text, Choose/Change/Delete labels + ARIA
// - Shows/hides Delete button based on selection
// - Idempotent event handlers, compatible with PP redraws
window.relabelAllFileUploadControls = function relabelAllFileUploadControls() {
  const t0 = performance.now();
  const T = _i18n();

  // Both PP variants
  const $blocks = $('.file-control-container, .container-file-input');
  logger.info('relabelAllFileUploadControls: start; containers=%d', $blocks.length);

  $blocks.each(function (idx) {
    const b0 = performance.now();
    const $block = $(this);
    const $chooseBtn = $block.find('button.btn-for-file-input').first();
    const $delBtn = $block.find('button.btn-for-delete').first();
    const $input = $block.find('input[type="file"]').first();
    const $nameBox = $block.find('.file-name-container').first();
    const $textDiv = $nameBox.find('div').first();
    const $hiddenSpan = $nameBox.find('span[id$="_file_name"]').first(); // server-provided name (if any)

    try {
      // 1) Stop clobbering aria-labelledby; only drop junk attrs
      const beforeAttrs = {
        choose_title: $chooseBtn.attr('title'),
        choose_ariaLabelledby: $chooseBtn.attr('aria-labelledby'),
        del_title: $delBtn.attr('title'),
        del_ariaLabelledby: $delBtn.attr('aria-labelledby')
      };
      $chooseBtn.removeAttr('title aria-labelledby');
      $delBtn.removeAttr('title aria-labelledby');

      // 2) Ensure polite live region on the filename container
      if ($nameBox.length) {
        if ($nameBox.attr('role') !== 'status') $nameBox.attr('role', 'status');
        if ($nameBox.attr('aria-live') !== 'polite') $nameBox.attr('aria-live', 'polite');
        if ($nameBox.attr('aria-atomic') !== 'true') $nameBox.attr('aria-atomic', 'true');
      }

      logger.debug('block[%d]: cleaned attrs: %o', idx, beforeAttrs);
    } catch (e) {
      logger.warn('block[%d]: attribute cleanup failed: %o', idx, e);
    }

    // Initial state (server file or empty)
    const hasServerFile = !!($block.data && $block.data('has-server-file')) || $block.attr('data-has-server-file') === '1';
    const initialName = hasServerFile && $hiddenSpan.length ? $hiddenSpan.text().trim() : '';
    const hasFile = !!initialName || (!!$input[0] && $input[0].files && $input[0].files.length > 0);

    // Choose/Change label
    const desiredChoose = hasFile ? T.change : T.choose;
    const prevChooseTxt = $chooseBtn.text().trim();
    if (prevChooseTxt !== desiredChoose) {
      $chooseBtn.text(desiredChoose);
      logger.info('block[%d]: chooseBtn text: %o -> %o', idx, prevChooseTxt, desiredChoose);
    }
    const prevChooseAria = $chooseBtn.attr('aria-label');
    if (prevChooseAria !== desiredChoose) {
      $chooseBtn.attr('aria-label', desiredChoose);
      logger.debug('block[%d]: chooseBtn aria-label: %o -> %o', idx, prevChooseAria, desiredChoose);
    }

    // Delete button label + visibility
    if ($delBtn.length) {
      const $icon = $delBtn.find('.fa, .glyphicon, .iconforimage, i, svg').first();
      const delHTML = $icon.length ? ($icon.prop('outerHTML') + ' ' + T.delete) : T.delete;
      if ($delBtn.html().trim() !== delHTML.trim()) {
        $delBtn.html(delHTML);
        logger.info('block[%d]: deleteBtn html set', idx);
      }
      const prevDelAria = $delBtn.attr('aria-label');
      if (prevDelAria !== T.delete) {
        $delBtn.attr('aria-label', T.delete);
        logger.debug('block[%d]: deleteBtn aria-label: %o -> %o', idx, prevDelAria, T.delete);
      }
      $delBtn.toggle(hasFile);
      logger.debug('block[%d]: deleteBtn visibility -> %s', idx, hasFile ? 'show' : 'hide');
    }


    // Initial filename text
if ($textDiv.length) {
  // If the native input already has a file (user just picked), prefer its name.
  const liveName = ($input[0] && $input[0].files && $input[0].files[0])
    ? ($input[0].files[0].name || '')
    : '';

  // If server had a previously uploaded file name, keep that; otherwise use liveName.
  let wantText = hasFile ? (liveName || initialName || '') : T.none;

  // Final fallback: no name → show "No file selected"
  if (!wantText) wantText = T.none;

  if ($textDiv.text().trim() !== wantText) {
    $textDiv.text(wantText);
    logger.debug('block[%d]: filename text init -> %o', idx, wantText);
  }
}


    $input.off('change.relabel').on('change.relabel', function () {
  // Let PP's inline fileLoad(...) finish first, then take over the UI.
    setTimeout(() => {
      const h0 = performance.now();
      const TT = _i18n();
      const fin = this;
      const file = fin.files && fin.files[0];
      const baseId = String($input.attr('id') || '').replace(/_input_file$/, '');
      const $hiddenName = $('#' + baseId + '_hidden_filename, #' + baseId + 'hidden_filename');
      const $hiddenType = $('#' + baseId + '_hidden_filetype, #' + baseId + 'hidden_filetype');
      const $hiddenSize = $('#' + baseId + '_hidden_file_size, #' + baseId + 'hidden_file_size');

      if (file) {
        // 1) Update visible filename
        if ($hiddenSpan.length) $hiddenSpan.text(file.name);
        if ($textDiv.text().trim() !== file.name) $textDiv.text(file.name);

      // 2) Button labels/ARIA
      if ($chooseBtn.text().trim() !== TT.change) $chooseBtn.text(TT.change);
      if ($chooseBtn.attr('aria-label') !== TT.change) $chooseBtn.attr('aria-label', TT.change);

      // 3) Show delete, fix ARIA if needed
      if ($delBtn.length) {
        if (!$delBtn.is(':visible')) $delBtn.show();
        if ($delBtn.attr('aria-label') !== TT.delete) $delBtn.attr('aria-label', TT.delete);
      }

        // 4) Clear any server-file hint so we don’t revert to old name later
        $block.removeAttr('data-has-server-file');
        if ($block.removeData) $block.removeData('has-server-file');

        // 5) Sync PP hidden partners so built-in validators clear
        if ($hiddenName.length) $hiddenName.val(file.name);
        if ($hiddenType.length) $hiddenType.val(file.type || '');
        if ($hiddenSize.length) $hiddenSize.val(String(file.size || ''));

      } else {
        // Cleared
        if ($hiddenSpan.length) $hiddenSpan.text('');
        if ($textDiv.text().trim() !== TT.none) $textDiv.text(TT.none);
        if ($chooseBtn.text().trim() !== TT.choose) $chooseBtn.text(TT.choose);
        if ($chooseBtn.attr('aria-label') !== TT.choose) $chooseBtn.attr('aria-label', TT.choose);
        if ($delBtn.length) $delBtn.hide();
        if ($hiddenName.length) $hiddenName.val('');
        if ($hiddenType.length) $hiddenType.val('');
        if ($hiddenSize.length) $hiddenSize.val('');
        logger.info('block[%d]: cleared selection -> reset to NONE', idx);
      }

    logger.trace('block[%d]: onChange duration=%dms', idx, Math.round(performance.now() - h0));
  }, 0);
});

    if ($delBtn.length) {
      $delBtn.off('click.relabel').on('click.relabel', function (ev) {
        ev.preventDefault();
        const h0 = performance.now();
        const TT = _i18n();

        logger.info('block[%d]: deleteBtn clicked -> clearing input', idx);
        // Clear input and update UI (validators will observe the change)
        try { $input.val(''); } catch (_) {}
        $input.trigger('change');
        if ($hiddenSpan.length) $hiddenSpan.text('');
        if ($textDiv.text().trim() !== TT.none) $textDiv.text(TT.none);
        if ($chooseBtn.text().trim() !== TT.choose) $chooseBtn.text(TT.choose);
        if ($chooseBtn.attr('aria-label') !== TT.choose) $chooseBtn.attr('aria-label', TT.choose);
        $delBtn.hide();

        // Also clear any server-file hint
        $block.removeAttr('data-has-server-file');
        if ($block.removeData) $block.removeData('has-server-file');

        logger.trace('block[%d]: deleteBtn handler duration=%dms', idx, Math.round(performance.now() - h0));
      });
    }

    logger.trace('block[%d]: init duration=%dms', idx, Math.round(performance.now() - b0));
  });

  logger.info('relabelAllFileUploadControls: done in %dms', Math.round(performance.now() - t0));
};


  // Single, debounced observer (re-applies after PP redraws)
  window.observeFileControls = function observeFileControls() {
    logger.info('observeFileControls: init -> first apply');
    try {
      window.relabelAllFileUploadControls();
    } catch (e) {
      logger.error('observeFileControls: first apply failed', e);
    }

    let debounceTimer = null;
    const DEBOUNCE_MS = 180;

    const obs = new MutationObserver(function (mutations) {
      let relevant = false;
      for (let i = 0; i < mutations.length && !relevant; i++) {
        const m = mutations[i];

        // Direct subtree touched?
        if ($(m.target).closest('.file-control-container').length) {
          relevant = true; break;
        }

        // Added nodes include a file-control?
        for (let j = 0; j < m.addedNodes.length && !relevant; j++) {
          const n = m.addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.matches?.('.file-control-container') || $(n).find('.file-control-container').length) {
            relevant = true; break;
          }
        }
      }

      if (!relevant) return;

      const pending = !!debounceTimer;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        logger.info('observeFileControls: relevant DOM change -> re-apply');
        try {
          window.relabelAllFileUploadControls();
        } catch (e) {
          logger.error('observeFileControls: re-apply failed', e);
        }
      }, DEBOUNCE_MS);

      logger.debug('observeFileControls: change detected; scheduled=%s in %dms', pending ? 'rescheduled' : 'new', DEBOUNCE_MS);
    });

    try {
      obs.observe(document.body, { childList: true, subtree: true });
      logger.info('observeFileControls: observer attached to document.body');
    } catch (e) {
      logger.error('observeFileControls: observer failed to attach', e);
    }
  };

  // Optional auto-start after DOM ready (comment out if you prefer manual control)
  // $(window.observeFileControls);

})();

/*
 * LookupLoader (unified) + LookupStore
 * ------------------------------------------------------------
 * One-file drop‑in for Power Pages bilingual lookups.
 * - load(): fetches options via Web API, populates <select>, attaches data-en/data-fr
 * - switchLanguage(): relabels (and optionally resorts) without network
 * - Auto-persists the *selected* option to localStorage for Step 5 review
 * - getSavedName(): read EN/FR later on any page
 *
 * Dependencies: jQuery, webapi.safeAjax (or safeAjax). No triggers are fired.
 * Logging: verbose by default
 */

(function (window, $) {
  'use strict';

  // ------------------------------
  // Utilities
  // ------------------------------
  const LOG = {
    info: (...a) => console.log('[Lookup]', ...a),
    warn: (...a) => console.warn('[Lookup]', ...a),
    err: (...a) => console.error('[Lookup]', ...a)
  };

  const isFr = (l) => /^fr/i.test(String(l || 'en'));
  const normGuid = (v) => String(v || '').replace(/[{}]/g, '').toLowerCase();

  function ensureFn(fn) { return typeof fn === 'function' ? fn : null; }
  function ajaxImpl() { return window.webapi?.safeAjax || window.safeAjax; }

  // ------------------------------
  // LookupStore (localStorage)
  // ------------------------------
  const LookupStore = window.LookupStore || (() => {
    const PREFIX = 'ssi.lookup.';
    const toJSON = (o) => { try { return JSON.stringify(o); } catch { return '{}'; } };
    const fromJSON = (s) => { try { return JSON.parse(s || 'null'); } catch { return null; } };

    function save(fieldId, rec) {
      if (!fieldId) return;
      const payload = {
        guid: normGuid(rec?.guid),
        en: String(rec?.en || '').trim(),
        fr: String(rec?.fr || '').trim(),
        ts: Date.now()
      };
      localStorage.setItem(PREFIX + fieldId, toJSON(payload));
      LOG.info('Saved', fieldId, payload);
    }

    function read(fieldId) { return fromJSON(localStorage.getItem(PREFIX + fieldId)); }

    function getName(fieldId, lang) {
      const r = read(fieldId); if (!r) return null;
      return (isFr(lang) ? r.fr : r.en) || r.en || r.fr || null;
    }

    function persistFromSelect(fieldId) {
      const sel = document.getElementById(fieldId);
      if (!sel || !sel.value) return;
      const opt = sel.selectedOptions && sel.selectedOptions[0];
      save(fieldId, {
        guid: sel.value,
        en: opt?.dataset?.en || opt?.text || '',
        fr: opt?.dataset?.fr || opt?.text || ''
      });
    }

    return { save, read, getName, persistFromSelect };
  })();

  // expose early so pages can read even if load fails later
  window.LookupStore = LookupStore;

  // ------------------------------
  // Web API helpers
  // ------------------------------
  function fetchAll(url, headers) {
    const ajax = ensureFn(ajaxImpl());
    return new Promise((resolve, reject) => {
      if (!ajax) { reject(new Error('safeAjax not available')); return; }
      const acc = [];
      const page = (res) => {
        const v = Array.isArray(res?.value) ? res.value : [];
        acc.push(...v);
        const next = res?.['@odata.nextLink'] || res?.['odata.nextLink'];
        if (next) { ajax({ type: 'GET', url: next, headers, success: page, error: reject }); }
        else { resolve(acc); }
      };
      ajax({ type: 'GET', url, headers, success: page, error: reject });
    });
  }

  // ------------------------------
  // DOM builders
  // ------------------------------
  function clearSelect(sel) { sel.innerHTML = ''; }

  function rebuildOptions($select, rows, cfg) {
    const { idField, enField, frField, lang, placeholder } = cfg;
    const sel = $select.get(0);
    const prevVal = normGuid($select.val());
    const holder = placeholder || (isFr(lang) ? 'Sélectionner' : 'Select');

    // sort by active language column for user-facing order
    const key = isFr(lang) ? frField : enField;
    rows.sort((a, b) => String(a?.[key] || '').localeCompare(String(b?.[key] || ''), undefined, { sensitivity: 'base' }));

    clearSelect(sel);

    const opt0 = new Option(holder, '', true, false);
    opt0.disabled = true;
    sel.appendChild(opt0);

    for (const r of rows) {
      const en = r?.[enField] ?? '';
      const fr = r?.[frField] ?? '';
      const txt = isFr(lang) ? (fr || en) : (en || fr);
      const val = r?.[idField];
      const opt = new Option(txt, val, false, false);
      opt.dataset.en = en;
      opt.dataset.fr = fr;
      sel.appendChild(opt);
    }

    // restore previous selection if still present
    if (prevVal) {
      const match = rows.find(r => normGuid(r?.[idField]) === prevVal);
      if (match) { $select.val(String(match[idField])); }
      else { $select.val(''); }
    } else {
      $select.val('');
    }
  }

  // ------------------------------
  // LookupLoader (unified)
  // ------------------------------
  const LookupLoader = {
    /**
     * Load a bilingual lookup into a <select>
     * @param {Object} opts
     *   - select: CSS string or jQuery for the <select>
     *   - entitySet: Web API set name (plural)
     *   - idField: primary key logical (e.g., ethi_servicelocationid)
     *   - enField: English name column
     *   - frField: French  name column
     *   - lang: 'en' | 'fr'
     *   - filter: OData $filter string
     *   - placeholder: custom placeholder label
     */
    async load(opts = {}) {
      const {
        select, entitySet, idField, enField, frField,
        lang = 'en', filter = 'statecode eq 0', placeholder
      } = opts;

      const $select = (select && select.jquery) ? select : $(select);
      if (!$select.length) { LOG.warn('load: select not found', select); return []; }

      const cols = [idField, enField, frField].filter(Boolean).join(',');
      const url = `/_api/${encodeURIComponent(entitySet)}`
        + `?$select=${encodeURIComponent(cols)}`
        + `&$filter=${encodeURIComponent(filter)}`;

      LOG.info('GET', url);
      const rows = await fetchAll(url, {
        'Accept': 'application/json', 'OData-Version': '4.0', 'OData-MaxVersion': '4.0'
      });
      LOG.info('Rows:', rows.length);

      rebuildOptions($select, rows, { idField, enField, frField, lang, placeholder });

      // auto-persist current selection (if any) and bind change for future
      const fieldId = $select.attr('id');
      if ($select.val()) LookupStore.persistFromSelect(fieldId);
      $select.off('change.lookupstore').on('change.lookupstore', () => LookupStore.persistFromSelect(fieldId));

      return rows;
    },

    /**
     * Relabel an already-populated lookup to EN/FR without network.
     * Keeps current selection. Optionally resorts by the visible text.
     */
    switchLanguage(select, lang = 'en', { resort = true, placeholder } = {}) {
      const $select = (select && select.jquery) ? select : $(select);
      const sel = $select.get(0);
      if (!sel || !sel.options || sel.options.length === 0) { LOG.warn('switchLanguage: empty select'); return; }

      const holder = placeholder || (isFr(lang) ? 'Sélectionner' : 'Select');
      if (sel.options[0]?.value === '') sel.options[0].text = holder;

      // relabel from data attributes
      for (let i = 1; i < sel.options.length; i++) {
        const o = sel.options[i];
        const en = o.dataset?.en || '';
        const fr = o.dataset?.fr || '';
        o.text = isFr(lang) ? (fr || en || o.text) : (en || fr || o.text);
      }

      if (resort) {
        const currentVal = $select.val();
        const opts = Array.from(sel.options).slice(1);
        opts.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
        for (const o of opts) sel.appendChild(o);
        $select.val(currentVal); // preserve selection
      }

      LOG.info('switchLanguage done ->', isFr(lang) ? 'FR' : 'EN');
    },

    /** Force-save current selection of a field id (one-shot) */
    persistNow(fieldId) { LookupStore.persistFromSelect(fieldId); },

    /** Read saved name later on any page */
    getSavedName(fieldId, lang) { return LookupStore.getName(fieldId, lang); }
  };

  // Export
  window.LookupLoader = LookupLoader;

})(window, jQuery);

async function runFetch(fetchXml) {
  const payload = { query: fetchXml.trim() };
  try {
    const resp = await webapi.safeAjax({
      type: "POST",
      url: "/_api/retrieveMultiple",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });
    return Array.isArray(resp?.value) ? resp.value : [];
  } catch (e) {
    throw (e?.status !== undefined ? e : parseAjaxError(e));
  }
}

function parseAjaxError(jqXHR) {
  let body = null;
  try { body = jqXHR.responseJSON ?? JSON.parse(jqXHR.responseText); }
  catch { body = jqXHR.responseText || null; }
  console.error("[retrieveMultiple] HTTP", jqXHR?.status, body);
  return { status: jqXHR?.status ?? 0, body };
}

(function (webapi, $) {
  function safeAjax(ajaxOptions) {
    var deferredAjax = $.Deferred();

    shell.getTokenDeferred().done(function (token) {
      // add headers for AJAX
      if (!ajaxOptions.headers) {
        $.extend(ajaxOptions, {
          headers: {
            "__RequestVerificationToken": token
          }
        });
      } else {
        ajaxOptions.headers["__RequestVerificationToken"] = token;
      }
      $.ajax(ajaxOptions)
        .done(function (data, textStatus, jqXHR) {
          validateLoginSession(data, textStatus, jqXHR, deferredAjax.resolve);
        }).fail(deferredAjax.reject); //AJAX
    }).fail(function () {
      deferredAjax.rejectWith(this, arguments); // on token failure pass the token AJAX and args
    });

    return deferredAjax.promise();
  }
  webapi.safeAjax = safeAjax;

})(window.webapi = window.webapi || {}, jQuery);

// Detects expired/invalid session and redirects to sign-in.
// Signature matches your call site: (data, textStatus, jqXHR, onSuccess)
function validateLoginSession(data, textStatus, jqXHR, onSuccess) {
  var log = function () {
    if (window.console && console.log) console.log.apply(console, arguments);
  };

  try {
    var status = jqXHR && jqXHR.status;
    var ct = jqXHR && jqXHR.getResponseHeader ? (jqXHR.getResponseHeader('content-type') || '') : '';

    // Heuristics: HTML response (not JSON) or known login markers in the body
    var isHtml = /text\/html|application\/xhtml\+xml/i.test(ct);
    var bodyStr = (typeof data === 'string') ? data : '';
    var looksLikeLoginHtml =
      /<form[^>]+action[^>]+signin/i.test(bodyStr) ||
      /<a[^>]+href[^>]+signin/i.test(bodyStr) ||
      /<title[^>]*>\s*(sign\s*in|connexion|login)\b/i.test(bodyStr);

    // Some APIs may return JSON flags instead
    var loginUrl = null;
    if (data && typeof data === 'object') {
      loginUrl = data.loginUrl || data.LoginUrl || null;
      if (data.isAuthorized === false || data.IsAuthorized === false) status = status || 401;
    }

    // Treat 401/403 or login-like HTML as an expired session
    if (status === 401 || status === 403 || looksLikeLoginHtml || (isHtml && !/application\/json/i.test(ct))) {
      log('[safeAjax] Session invalid/expired; redirecting to sign-in. status=%s, ct=%s', status, ct);

      // Try to discover a login URL from the HTML if not supplied
      if (!loginUrl && bodyStr) {
        var $doc = $('<div>').html(bodyStr);
        var $form = $doc.find('form[action*="signin"], form[action*="SignIn"], form[action*="Account/Login"]');
        if ($form.length) loginUrl = $form.attr('action');

        if (!loginUrl) {
          var $a = $doc.find('a[href*="signin"], a[href*="SignIn"], a[href*="Account/Login"]');
          if ($a.length) loginUrl = $a.first().attr('href');
        }
      }

      // Fallbacks for common portal routes
      if (!loginUrl) {
        var here = location.pathname + location.search + location.hash;
        loginUrl = '/SignIn?returnUrl=' + encodeURIComponent(here); // typical Power Pages route
      }

      window.location.href = loginUrl;
      return;
    }

    // Otherwise, session is fine -> pass through to the original success resolver
    if (typeof onSuccess === 'function') onSuccess(data, textStatus, jqXHR);
  } catch (e) {
    // In doubt, do not block the call
    log('[safeAjax] validateLoginSession threw; passing through. Error:', e);
    if (typeof onSuccess === 'function') onSuccess(data, textStatus, jqXHR);
  }
}

/**
 * Minimal WET-style radio patcher
 * - Pass the span id that wraps the radio inputs (e.g., "ethi_canadiancoastguard")
 * - Builds <fieldset><legend>Group Label</legend>...</fieldset>
 * - Moves the existing radios + their <label for="..."> into the fieldset
 * - Does NOT add any required validation
 * - Idempotent: safe to call multiple times
 * - How to use it one group  WET4.patchRadioGroup('ethi_canadiancoastguard');
 * - Many groups at once WET4.patchRadioGroups(['id1','id2','id3']);
 */
(function () {
  function patchRadioGroup(baseId) {
    if (document.getElementById(baseId + '_group')) return false;
    var span = document.getElementById(baseId);
    if (!span) return false;

    var group = document.createElement('div');
    group.id = baseId + '_group';
    group.className = 'form-group wet-patched-radio';

    var fs = document.createElement('fieldset');
    fs.className = 'wet-radio-fieldset'; // ← no "boolean-radio" to avoid legacy offsets
    fs.setAttribute('data-wet-patched-radio', '1');

    var legend = document.createElement('legend');
    legend.id = baseId + '_legend';
    var nameSpan = document.createElement('span');
    nameSpan.className = 'field-label field-name';  // inherit same font/weight as other labels
    nameSpan.textContent = (document.getElementById(baseId + '_label')?.textContent ||
                            span.closest('td')?.querySelector('.table-info .field-label')?.textContent ||
                            'Options').trim();
    legend.appendChild(nameSpan);
    legend.classList.add('field-label'); // if your CSS targets the element directly
    fs.appendChild(legend);

    // Re-wrap: use the EXISTING <label for="..."> as the wrapper and move the input INSIDE it
    Array.from(span.querySelectorAll('input[type="radio"]')).forEach(function (r) {
      var pl = document.querySelector('label[for="' + CSS.escape(r.id) + '"]');
      if (pl) {
        // Clean stray hidden field-name fragments (legend covers group name)
        pl.querySelectorAll('.visually-hidden,.wb-inv,.wb-invisible').forEach(function(n){ n.remove(); });

        pl.classList.add('radio-inline'); // inline layout
        pl.removeAttribute('for');        // not needed when input is inside label

        // Put the radio as the FIRST child of the label
        pl.insertBefore(r, pl.firstChild);

        // Ensure a little space if your CSS lacks it
        if (!/\S/.test(pl.firstChild.nextSibling?.textContent || '')) {
          // no text node gap; create a small spacing node after input
          pl.insertBefore(document.createTextNode(' '), pl.childNodes[1] || null);
        }

        fs.appendChild(pl);  // move the label (now the wrapper) under the fieldset
      } else {
        // Fallback: create a wrapper label if none found
        var lbl = document.createElement('label');
        lbl.className = 'radio-inline';
        lbl.appendChild(r);
        lbl.appendChild(document.createTextNode(' Option'));
        fs.appendChild(lbl);
      }
    });

    // Preserve original onchange behavior (the span used to have onchange="setIsDirty(this.id)")
    fs.addEventListener('change', function () {
      if (typeof window.setIsDirty === 'function') window.setIsDirty(baseId);
    });

    var control = span.closest('.control') || span.parentElement;
    group.appendChild(fs);
    control.insertBefore(group, span);
    span.remove();

    var oldLabel = document.getElementById(baseId + '_label');
    if (oldLabel) { oldLabel.classList.add('wb-inv'); oldLabel.setAttribute('aria-hidden', 'true'); oldLabel.removeAttribute('for'); }

    var td = group.closest('td');
    if (td && td.getAttribute('role') === 'radiogroup') td.removeAttribute('role');

    return true;
  }

  window.WET4 = window.WET4 || {};
  window.WET4.patchRadioGroup = patchRadioGroup;
  window.WET4.patchRadioGroups = function (ids){
    return Array.isArray(ids) ? ids.reduce(function(c,id){ return c + (patchRadioGroup(id)?1:0); }, 0) : 0;
  };
})();


jQuery(function ($) {
  // Disable native HTML5 tooltips (“Please fill out this field.”)
  var $form = $('#liquid_form');
  if ($form.length) {
    $form.attr('novalidate', 'novalidate');
    console.debug('[WET] novalidate applied to #liquid_form');
  }
});

// Minimal helpers to render/clear inline errors when validations.js helpers aren’t present
function setInlineErrorForFile(baseId, messageHtml) {
  // Prefer shared helper from validations.js if available
  if (typeof window.updateLabelErrorMessage === 'function') {
    try { window.updateLabelErrorMessage(baseId, 'file', messageHtml); return; } catch (_) {}
  }
  const $label = $('#' + baseId + '_label');
  if (!$label.length) return;
  let $err = $label.find("span[id='" + baseId + "_err']");
  if (!$err.length) {
    const last = $label.contents().last();
    if (!last.length || last[0].nodeName !== 'BR') $label.append('<br />');
    $label.append('<span id="' + baseId + '_err" class="label label-danger wrapped">' + messageHtml + '</span>');
  } else {
    const newTxt = $('<div/>').html(messageHtml).text().replace(/\s+/g, ' ').trim();
    if ($err.text().replace(/\s+/g, ' ').trim() !== newTxt) $err.html(messageHtml);
  }
  $label.find('br + br').remove();
}

function clearInlineErrorForFile(baseId) {
  // Prefer validations.js helper if present
  if (typeof window.clearFieldErrorUI === 'function') {
    try { window.clearFieldErrorUI(baseId, 'file'); return; } catch (_) {}
  }
  const $label = $('#' + baseId + '_label');
  const $err = $label.find('#' + baseId + '_err');
  if ($err.length) {
    const $prev = $err.prev();
    $err.remove();
    if ($prev.is('br')) $prev.remove();
  }
}

/* ============================================================
 * Power Pages table normalizer
 * - Keeps hidden sections in DOM (logic-safe)
 * - Fixes row column counts by adding neutral filler cells
 *   or reducing colspans—no destructive deletions.
 * - Idempotent; runs after partial postbacks.
 * ============================================================ */
(function () {
  'use strict';

  var DEBUG = true; // set false once verified
  function log() { if (DEBUG) console.log('[PP-TABLE]', ...arguments); }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  function getExpectedCols(table) {
    // Prefer explicit columns from <colgroup>
    var n = table.querySelectorAll(':scope > colgroup > col').length;
    if (n) return n;

    // Fallback: infer from the most common row width
    var counts = Object.create(null), best = 3, max = 0;
    table.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr')
      .forEach(function (tr) {
        var w = rowWidth(tr);
        counts[w] = (counts[w] || 0) + 1;
        if (counts[w] > max) { max = counts[w]; best = w; }
      });
    return best;
  }

  function rowWidth(tr) {
    var sum = 0;
    for (var i = 0; i < tr.cells.length; i++) {
      var td = tr.cells[i];
      var span = parseInt(td.getAttribute('colspan') || '1', 10);
      sum += (isNaN(span) || span < 1) ? 1 : span;
    }
    return sum;
  }

  function ensureWidth(tr, expected) {
    var have = rowWidth(tr);
    if (have === expected) return;

    if (have < expected) {
      // Add neutral filler cells before the trailing zero-cell if present
      var deficit = expected - have;
      var zero = findZeroCell(tr);
      for (var i = 0; i < deficit; i++) {
        var filler = document.createElement('td');
        filler.className = 'cell zero-cell';
        filler.setAttribute('data-td-fix', '1');
        if (zero) tr.insertBefore(filler, zero); else tr.appendChild(filler);
      }
      log('Added', deficit, 'filler <td> to reach', expected, tr);
      return;
    }

    // have > expected → shrink colspans non-destructively
    var excess = have - expected;

    // 1) Prefer shrinking the trailing zero-cell if it has colspan > 1
    var zero = findZeroCell(tr);
    if (zero && (zero.colSpan || 1) > 1) {
      var reduce = Math.min(excess, zero.colSpan - 1);
      zero.colSpan = zero.colSpan - reduce;
      excess -= reduce;
    }

    // 2) Then shrink any previously-added filler cell with colspan > 1
    if (excess > 0) {
      var fillers = tr.querySelectorAll('td[data-td-fix]');
      for (var j = fillers.length - 1; j >= 0 && excess > 0; j--) {
        var f = fillers[j];
        if ((f.colSpan || 1) > 1) {
          var r = Math.min(excess, f.colSpan - 1);
          f.colSpan = f.colSpan - r;
          excess -= r;
        }
      }
    }

    // 3) Last resort: shrink the last non-interactive cell with colspan > 1
    if (excess > 0) {
      var cells = Array.from(tr.cells).reverse();
      var target = cells.find(function (td) {
        if ((td.colSpan || 1) <= 1) return false;
        // Avoid cells that contain form controls (inputs/select/textarea/button)
        return td.querySelector('input,select,textarea,button') == null;
      });
      if (target) {
        var r2 = Math.min(excess, (target.colSpan || 1) - 1);
        target.colSpan = target.colSpan - r2;
        excess -= r2;
      }
    }

    // Note: we DO NOT remove any cells; we only reduce span.
    if (excess > 0 && DEBUG) {
      log('Row still wide by', excess, '(no safe shrink target found):', tr);
    } else {
      log('Shrank row to', expected, tr);
    }
  }

  function findZeroCell(tr) {
    for (var i = tr.cells.length - 1; i >= 0; i--) {
      var td = tr.cells[i];
      if (td.classList && td.classList.contains('zero-cell')) return td;
    }
    return null;
  }

  function normalizeTables(root) {
    root.querySelectorAll('table.section').forEach(function (table) {
      var expected = getExpectedCols(table);
      table.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr')
        .forEach(function (tr) { ensureWidth(tr, expected); });
    });
  }

  function run() { try { normalizeTables(document); } catch (e) { console.error(e); } }

  // Initial run
  onReady(run);

  // Re-run after partial postbacks (Power Pages / ASP.NET WebForms)
  try {
    if (window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager) {
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(run);
      log('Hooked PageRequestManager.endRequest');
    }
  } catch (e) { /* ignore */ }

  // Optional: expose a manual trigger for QA
  window.ppNormalizeTables = run;
})();

