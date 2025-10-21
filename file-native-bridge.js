(function (window) {
  'use strict';

  const LOG = (...a) => console.log('[file-bridge]', ...a);
  const DBG = (...a) => console.debug('[file-bridge]', ...a);

  const DEFAULT_ALLOWED_EXTENSIONS = ["pdf", "jpg", "png", "gif"];
  const DEFAULT_MAX_BYTES = 4 * 1024 * 1024; // 4 MiB

  // Default localized messages (double-quoted; FR uses curly apostrophe and NBSP)
  const DEFAULT_MESSAGES = {
    en: {
      required: "This file is required.",
      zeroByte: "The selected file is empty (0 bytes). Please choose a non-empty file.",
      maxSize: "The file is too large. Maximum file size is {MB} MB.",
      fileTypes: "The file type is not allowed. Allowed types: {list}."
    },
    fr: {
      required: "Ce fichier est obligatoire.",
      zeroByte: "Le fichier sélectionné est vide (0\u00A0octet). Veuillez choisir un fichier non vide.",
      maxSize: "Le fichier est trop volumineux. La taille maximale est de {MB}\u00A0Mo.",
      fileTypes: "Le type de fichier n\u2019est pas autorisé. Types permis\u00A0: {list}."
    }
  };

  // Programmatic opt-in state
  const optedInForms = new WeakSet();
  const optedInFields = new Set();

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
    return defaults[map[key] || key] || "";
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

  function ancestorFormOf(input) {
    return input?.form || input?.closest?.('form') || null;
  }

  function formIsOptedIn(form) {
    return !!(form && optedInForms.has(form));
  }

  function isEligible(baseId, input) {
    if (!input) return false;
    // per-input opt-out still supported
    if (input.matches('[data-file-bridge="off"]')) return false;
    if (input.disabled || String(input.getAttribute('aria-disabled') || '').toLowerCase() === 'true') return false;
    if (optedInFields.has(baseId)) return true;
    const form = ancestorFormOf(input);
    return formIsOptedIn(form);
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
    if (!isEligible(baseId, input)) { DBG('register: not opted-in; skip', baseId); return; }

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

  // Programmatic opt-in APIs
  window.FileStockSuppression.enableForForm = function (formSelectorOrEl) {
    const form = typeof formSelectorOrEl === 'string'
      ? document.querySelector(formSelectorOrEl)
      : formSelectorOrEl;
    if (!form) return 0;
    optedInForms.add(form);
    return registerWithinForm(form);
  };
  window.FileStockSuppression.registerForm = window.FileStockSuppression.enableForForm;

  window.FileStockSuppression.enableForField = function (baseId) {
    if (!baseId) return 0;
    optedInFields.add(baseId);
    register(baseId);
    return 1;
  };

  window.FileStockSuppression.unregisterAll = function () {
    document.querySelectorAll('input[type="file"][id$="_input_file"]').forEach(inp => {
      unregister(inp.id.replace(/_input_file$/, ''));
    });
  };

  // Optional bootstrap via window.FILE_BRIDGE_CFG (define before this script loads)
  function bootstrapFromConfig() {
    const cfg = window.FILE_BRIDGE_CFG;
    if (!cfg) return;
    try {
      const forms = Array.isArray(cfg.includeForms) ? cfg.includeForms : [];
      const fields = Array.isArray(cfg.includeFields) ? cfg.includeFields : [];
      forms.forEach(sel => { try { window.FileStockSuppression.enableForForm(sel); } catch (e) { DBG('bootstrap form fail', sel, e); } });
      fields.forEach(base => { try { window.FileStockSuppression.enableForField(base); } catch (e) { DBG('bootstrap field fail', base, e); } });
      if (forms.length || fields.length) LOG('Bootstrapped from FILE_BRIDGE_CFG', { forms: forms.length, fields: fields.length });
    } catch (e) { DBG('bootstrap error', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapFromConfig, { once: true });
  } else {
    bootstrapFromConfig();
  }

  LOG('File native bridge (programmatic-only) loaded');
})(window);