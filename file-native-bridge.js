/**
 * file-native-bridge.js
 *
 * Native/stock file-upload error "bridge" that converts browser/PP file validation messages
 * into WET4-compliant inline + summary UX, now with per-form opt-in.
 *
 * Opt-in model:
 * - Mark a form with data-file-bridge="on" to enable the bridge for its file inputs.
 * - Or call FileStockSuppression.enableForForm(form) to opt-in programmatically on page load.
 * - register(id) will NO-OP unless the input's ancestor form is opted in.
 */
(function (window) {
  'use strict';

  const LOG = (...a) => console.log('[file-bridge]', ...a);
  const DBG = (...a) => console.debug('[file-bridge]', ...a);

  const DEFAULT_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'png', 'gif'];
  const DEFAULT_MAX_BYTES = 4 * 1024 * 1024; // 4 MiB
  const DEFAULT_MESSAGES = {
    en: {
      required: 'This file is required.',
      zeroByte: 'The selected file is empty (0 bytes). Please choose a non-empty file.',
      maxSize: 'The file is too large. Maximum file size is {MB} MB.',
      fileTypes: 'The file type is not allowed. Allowed types: {list}.'
    },
    fr: {
      required: 'Ce fichier est obligatoire.',
      zeroByte: 'Le fichier sélectionné est vide (0 octet). Veuillez choisir un fichier non vide.',
      maxSize: 'Le fichier est trop volumineux. La taille maximale est de {MB} Mo.',
      fileTypes: 'Le type de fichier n'est pas autorisé. Types permis : {list}.'
    }
  };

  function getCurrentLang() {
    const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return lang.startsWith('fr') ? 'fr' : 'en';
  }
  function getMessage(input, key, lang) {
    // keys for data-msg-*: required, zero, max, type
    const dataKey = `data-msg-${key}-${lang}`;
    const custom = input.getAttribute(dataKey);
    if (custom) return custom;
    const map = { zero: 'zeroByte', max: 'maxSize', type: 'fileTypes' };
    const defaults = DEFAULT_MESSAGES[lang] || DEFAULT_MESSAGES.en;
    return defaults[map[key] || key] || '';
  }

  function getFileInput(baseId) {
    return document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
  }
  function getConfig(input) {
    const allowedExtStr = input.getAttribute('data-allowed-ext') || '';
    const allowedExt = allowedExtStr
      ? allowedExtStr.split(/[\,\s;|]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
      : DEFAULT_ALLOWED_EXTENSIONS;

    const maxBytesAttr = input.getAttribute('data-max-bytes');
    const maxBytes = (maxBytesAttr && !isNaN(maxBytesAttr))
      ? parseInt(maxBytesAttr, 10)
      : (typeof window.DEFAULT_MAX_FILE_BYTES === 'number' ? window.DEFAULT_MAX_FILE_BYTES : DEFAULT_MAX_BYTES);

    return { allowedExt, maxBytes };
  }

  // Per-form opt-in helpers
  function ancestorFormOf(input) {
    return input?.form || input?.closest?.('form') || null;
  }
  function formOptedIn(form) {
    return !!(form && (form.getAttribute('data-file-bridge') === 'on'));
  }
  function isEligibleForForm(input) {
    if (!input) return false;
    // explicit per-input opt-out still supported
    if (input.matches('[data-file-bridge="off"]')) return false;
    if (input.disabled || String(input.getAttribute('aria-disabled') || '').toLowerCase() === 'true') return false;
    const form = ancestorFormOf(input);
    return formOptedIn(form);
  }

  function validateFile(baseId, input, lang) {
    const config = getConfig(input);
    const file = input.files && input.files[0];

    if (!file || input.files.length === 0) {
      return { valid: false, errorType: 'required', errorMessage: getMessage(input, 'required', lang) };
    }
    if (file.size === 0) {
      return { valid: false, errorType: 'zeroByte', errorMessage: getMessage(input, 'zero', lang) };
    }
    if (file.size > config.maxBytes) {
      const mb = (config.maxBytes / (1024 * 1024)).toFixed(1);
      let msg = getMessage(input, 'max', lang).replace('{MB}', mb);
      return { valid: false, errorType: 'maxSize', errorMessage: msg };
    }
    const name = String(file.name || '').trim();
    const dot = name.lastIndexOf('.');
    if (dot <= 0) {
      let msg = getMessage(input, 'type', lang).replace('{list}', config.allowedExt.join(', '));
      return { valid: false, errorType: 'fileTypes', errorMessage: msg };
    }
    const ext = name.slice(dot + 1).toLowerCase();
    if (!config.allowedExt.includes(ext)) {
      let msg = getMessage(input, 'type', lang).replace('{list}', config.allowedExt.join(', '));
      return { valid: false, errorType: 'fileTypes', errorMessage: msg };
    }
    return { valid: true, errorType: null, errorMessage: '' };
  }

  function createBridgeValidator(baseId) {
    const input = getFileInput(baseId);
    if (!input) return null;

    const validator = document.createElement('span');
    validator.id = `${baseId}_FileBridge_${Math.random().toString(36).substr(2, 9)}`;
    validator.controltovalidate = baseId;
    validator.isvalid = true;
    validator.type = 'file';
    validator.evaluationfunction = function (source) {
      const lang = getCurrentLang();
      const result = validateFile(baseId, input, lang);
      if (result.valid) {
        source.isvalid = true;
        source.errormessage = '';
        return true;
      } else {
        source.isvalid = false;
        source.errormessage =
          `<a href='#${baseId}_label' onclick='javascript:scrollToAndFocus("${baseId}_label","${baseId}"); return false;' referenceControlId=${baseId}>${result.errorMessage}</a>`;
        return false;
      }
    };
    return validator;
  }

  function addBridgeValidatorLast(baseId) {
    const bridge = createBridgeValidator(baseId);
    if (!bridge) return;

    if (!window.Page_Validators) window.Page_Validators = [];
    const indices = window.Page_Validators
      .map((v, i) => ({ v, i }))
      .filter(x => x.v && x.v.controltovalidate === baseId)
      .map(x => x.i);
    if (indices.length > 0) {
      const lastIdx = indices[indices.length - 1];
      window.Page_Validators.splice(lastIdx + 1, 0, bridge);
      DBG('Bridge inserted after index', lastIdx);
    } else {
      window.Page_Validators.push(bridge);
      DBG('Bridge appended (no prior validators for base)', baseId);
    }
  }

  function register(baseId) {
    const input = getFileInput(baseId);
    if (!input) { DBG('register: no input for', baseId); return; }
    if (!isEligibleForForm(input)) { DBG('register: form not opted-in; skip', baseId); return; }

    if (input.dataset.bridgeRegistered === '1') { DBG('register: already', baseId); return; }
    input.dataset.bridgeRegistered = '1';
    LOG('Registering', baseId);

    addBridgeValidatorLast(baseId);

    input.addEventListener('invalid', function (e) {
      e.preventDefault();
      if (typeof window.globalEvaluationFunction === 'function') window.globalEvaluationFunction();
    }, false);

    if (typeof window.suppressStockFileErrors === 'function') {
      window.suppressStockFileErrors([baseId]);
    }
  }

  function unregister(baseId) {
    const input = getFileInput(baseId);
    if (input) delete input.dataset.bridgeRegistered;

    if (window.Page_Validators) {
      const re = new RegExp(`^${baseId}_FileBridge_`);
      for (let i = window.Page_Validators.length - 1; i >= 0; i--) {
        const v = window.Page_Validators[i];
        if (v && v.controltovalidate === baseId && re.test(v.id)) {
          window.Page_Validators.splice(i, 1);
        }
      }
    }
    LOG('Unregistered', baseId);
  }

  function registerWithinForm(form) {
    if (!form) return 0;
    let count = 0;
    const inputs = form.querySelectorAll('input[type="file"][id$="_input_file"]');
    inputs.forEach(inp => { const base = inp.id.replace(/_input_file$/, ''); register(base); count++; });
    return count;
  }

  // Public API
  window.FileStockSuppression = window.FileStockSuppression || {};
  window.FileStockSuppression.register = register;
  window.FileStockSuppression.unregister = unregister;

  // New opt-in APIs
  window.FileStockSuppression.enableForForm = function (formSelectorOrEl) {
    const form = typeof formSelectorOrEl === 'string'
      ? document.querySelector(formSelectorOrEl)
      : formSelectorOrEl;
    if (!form) return 0;
    form.setAttribute('data-file-bridge', 'on');
    return registerWithinForm(form);
  };
  window.FileStockSuppression.registerForm = window.FileStockSuppression.enableForForm;

  window.FileStockSuppression.unregisterAll = function () {
    document.querySelectorAll('input[type="file"][id$="_input_file"]').forEach(inp => {
      unregister(inp.id.replace(/_input_file$/, ''));
    });
  };

  // On page load, only auto-register for forms explicitly opted-in
  function registerAllOptedInForms() {
    const forms = document.querySelectorAll('form[data-file-bridge="on"]');
    let total = 0;
    forms.forEach(f => { total += registerWithinForm(f); });
    if (total) LOG('Auto-registered from opted-in forms:', total);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerAllOptedInForms, { once: true });
  } else {
    registerAllOptedInForms();
  }

  LOG('File native bridge (per-form opt-in) loaded');
})(window);
