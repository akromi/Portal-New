/**
 * file-native-bridge.js
 * 
 * Native/stock file-upload error "bridge" that converts browser/PP file validation messages
 * into WET4-compliant inline + summary UX.
 * 
 * Features:
 * - Only one bridged error at a time, respecting custom validator order: 
 *   required → zero-byte → max-size → file-type
 * - Full localization (EN/FR) with message text configurable via data attributes
 * - Allowed extensions and maximum size configurable via data attributes
 * - Accessibility: reuses existing inline error rendering and summary pipeline
 * - Suppresses/hides any stock file error blocks
 * - Hooks into existing change/validation flow
 */

(function (window) {
  'use strict';

  const LOG = (...a) => console.log('[file-bridge]', ...a);
  const DBG = (...a) => console.debug('[file-bridge]', ...a);

  // Default configuration
  const DEFAULT_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'png', 'gif'];
  const DEFAULT_MAX_BYTES = 4 * 1024 * 1024; // 4 MiB

  // Default localized messages
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
      fileTypes: "Le type de fichier n'est pas autorisé. Types permis : {list}."
    }
  };

  /**
   * Determine current language from HTML lang attribute
   */
  function getCurrentLang() {
    const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return lang.startsWith('fr') ? 'fr' : 'en';
  }

  /**
   * Get localized message for a field, with fallback to defaults
   */
  function getMessage(input, type, lang) {
    const dataKey = `data-msg-${type}-${lang}`;
    const custom = input.getAttribute(dataKey);
    if (custom) return custom;

    const defaults = DEFAULT_MESSAGES[lang] || DEFAULT_MESSAGES.en;
    return defaults[type] || '';
  }

  /**
   * Get the actual file input element (baseId_input_file or baseId)
   */
  function getFileInput(baseId) {
    return document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
  }

  /**
   * Get configuration from data attributes
   */
  function getConfig(input) {
    // Allowed extensions
    const allowedExtStr = input.getAttribute('data-allowed-ext') || '';
    const allowedExt = allowedExtStr
      ? allowedExtStr.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
      : DEFAULT_ALLOWED_EXTENSIONS;

    // Max bytes
    const maxBytesAttr = input.getAttribute('data-max-bytes');
    const maxBytes = (maxBytesAttr && !isNaN(maxBytesAttr))
      ? parseInt(maxBytesAttr, 10)
      : (typeof window.DEFAULT_MAX_FILE_BYTES === 'number' ? window.DEFAULT_MAX_FILE_BYTES : DEFAULT_MAX_BYTES);

    return { allowedExt, maxBytes };
  }

  /**
   * Check file validation in order: required → zero-byte → max-size → file-type
   * Returns { valid: boolean, errorType: string|null, errorMessage: string }
   */
  function validateFile(baseId, input, lang) {
    const config = getConfig(input);
    const file = input.files && input.files[0];

    // 1. Required check
    if (!file || input.files.length === 0) {
      return {
        valid: false,
        errorType: 'required',
        errorMessage: getMessage(input, 'required', lang)
      };
    }

    // 2. Zero-byte check
    if (file.size === 0) {
      return {
        valid: false,
        errorType: 'zeroByte',
        errorMessage: getMessage(input, 'zero', lang)
      };
    }

    // 3. Max size check
    if (file.size > config.maxBytes) {
      const mb = (config.maxBytes / (1024 * 1024)).toFixed(1);
      let msg = getMessage(input, 'max', lang);
      msg = msg.replace('{MB}', mb);
      return {
        valid: false,
        errorType: 'maxSize',
        errorMessage: msg
      };
    }

    // 4. File type check
    const fileName = String(file.name || '').trim();
    const dot = fileName.lastIndexOf('.');
    if (dot <= 0) {
      // No extension or starts with '.'
      let msg = getMessage(input, 'type', lang);
      msg = msg.replace('{list}', config.allowedExt.join(', '));
      return {
        valid: false,
        errorType: 'fileTypes',
        errorMessage: msg
      };
    }

    const ext = fileName.slice(dot + 1).toLowerCase();
    if (!config.allowedExt.includes(ext)) {
      let msg = getMessage(input, 'type', lang);
      msg = msg.replace('{list}', config.allowedExt.join(', '));
      return {
        valid: false,
        errorType: 'fileTypes',
        errorMessage: msg
      };
    }

    // All checks passed
    return { valid: true, errorType: null, errorMessage: '' };
  }

  /**
   * Create bridge validator for a file input
   */
  function createBridgeValidator(baseId) {
    const input = getFileInput(baseId);
    if (!input) {
      DBG('createBridgeValidator: input not found for', baseId);
      return null;
    }

    // Create validator object that will be added to Page_Validators
    const validator = document.createElement('span');
    validator.id = `${baseId}_FileBridge_${Math.random().toString(36).substr(2, 9)}`;
    validator.controltovalidate = baseId;
    validator.isvalid = true;
    validator.type = 'file';

    // Evaluation function
    validator.evaluationfunction = function (source) {
      const lang = getCurrentLang();
      const result = validateFile(baseId, input, lang);

      if (result.valid) {
        source.isvalid = true;
        source.errormessage = '';
        return true;
      } else {
        source.isvalid = false;
        // Create error message as a link (for summary)
        source.errormessage = `<a href='#${baseId}_label' onclick='javascript:scrollToAndFocus("${baseId}_label", "${baseId}"); return false;' referenceControlId=${baseId}>${result.errorMessage}</a>`;
        return false;
      }
    };

    return validator;
  }

  /**
   * Register a file input with the bridge
   */
  function registerFileInput(baseId) {
    const input = getFileInput(baseId);
    if (!input) {
      DBG('registerFileInput: input not found for', baseId);
      return;
    }

    // Check if already registered
    if (input.dataset.bridgeRegistered === '1') {
      DBG('registerFileInput: already registered', baseId);
      return;
    }

    LOG('Registering file input:', baseId);

    // Mark as registered
    input.dataset.bridgeRegistered = '1';

    // Create and add bridge validator to Page_Validators (append LAST for this base id)
    const bridge = createBridgeValidator(baseId);
    if (bridge) {
      if (!window.Page_Validators) {
        window.Page_Validators = [];
      }

      // Find all validators for this control and insert after the last one
      const indices = window.Page_Validators
        .map((v, i) => ({ v, i }))
        .filter(x => x.v && x.v.controltovalidate === baseId)
        .map(x => x.i);

      if (indices.length > 0) {
        const lastIdx = indices[indices.length - 1];
        window.Page_Validators.splice(lastIdx + 1, 0, bridge);
        DBG('Bridge validator inserted after existing validators at index', lastIdx + 1);
      } else {
        window.Page_Validators.push(bridge);
        DBG('Bridge validator appended to Page_Validators');
      }
    }

    // Hook into 'invalid' event to prevent native browser tooltip
    input.addEventListener('invalid', function (e) {
      e.preventDefault();
      DBG('Native invalid event prevented for', baseId);
      
      // Trigger validation through the bridge
      if (typeof window.globalEvaluationFunction === 'function') {
        window.globalEvaluationFunction();
      }
    }, false);

    // Suppress stock file errors
    if (typeof window.suppressStockFileErrors === 'function') {
      window.suppressStockFileErrors([baseId]);
    }
  }

  /**
   * Unregister a file input from the bridge
   */
  function unregisterFileInput(baseId) {
    const input = getFileInput(baseId);
    if (input) {
      delete input.dataset.bridgeRegistered;
    }

    // Remove bridge validators from Page_Validators
    if (window.Page_Validators) {
      const regexp = new RegExp(`^${baseId}_FileBridge_`);
      for (let i = window.Page_Validators.length - 1; i >= 0; i--) {
        const v = window.Page_Validators[i];
        if (v && v.controltovalidate === baseId && regexp.test(v.id)) {
          window.Page_Validators.splice(i, 1);
          DBG('Removed bridge validator:', v.id);
        }
      }
    }

    LOG('Unregistered file input:', baseId);
  }

  /**
   * Register all visible file inputs
   */
  function registerAllFileInputs() {
    LOG('Auto-registering all file inputs...');
    const fileInputs = document.querySelectorAll('input[type="file"][id$="_input_file"]');
    let count = 0;

    fileInputs.forEach(input => {
      const baseId = input.id.replace(/_input_file$/, '');
      registerFileInput(baseId);
      count++;
    });

    LOG(`Registered ${count} file input(s)`);
  }

  // Public API
  window.FileStockSuppression = window.FileStockSuppression || {};
  
  window.FileStockSuppression.register = function (id) {
    registerFileInput(id);
  };

  window.FileStockSuppression.registerAll = function () {
    registerAllFileInputs();
  };

  window.FileStockSuppression.unregister = function (id) {
    unregisterFileInput(id);
  };

  // Auto-register on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerAllFileInputs, { once: true });
  } else {
    // DOM already loaded
    registerAllFileInputs();
  }

  LOG('File native bridge loaded');

})(window);
