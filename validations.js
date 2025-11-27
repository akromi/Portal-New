// validations.js
//
// Show this comment 2025.11.10 11:28 am.

//
// Accessibility and Validation Lib
//

// Collection of functions to add custom validators that comply with accessibility requirements
//
//
// Hany Greiss
// July 2025
// Akram Farhat
// Aug/Sept updates
//
// Adds the required accessibility modifications
//
// Converts
//
//      TEXT *
//
// to
//
//      * TEXT (required)
//
// styled as RED - required class
//
//

// Global
//const currentLang = $('html').attr('lang') || 'en';
const currentLang = String($('html').attr('lang') || 'en').split('-')[0].toLowerCase();
// PRIVATE
function addAccessibilityMods(id) {
    var label = $('#' + id + '_label');
    var text = label.text();

    text = text.replace(/\s*\(required\)\s*/gi, ' ').replace(/\s*\(obligatoire\)\s*/gi, ' ').trim();

    //label.text('');
    label.empty(); 
    label.addClass('required');
    label.closest('div').removeClass('required');

    var input = $('#' + id);
    input.removeAttr('title');
    input.removeAttr('aria-label');
    input.removeAttr('aria-required');
    input.attr('required', 'required');

    //var span = label.append('<span class="field-name">' + text + '</span>');
    var requiredText = currentLang === 'en' ? ' (required)' : ' (obligatoire)';
    label
    .append(`<span class="field-name">${text}</span> `)
    .append(`<strong aria-hidden="true" class="required"><span> ${requiredText}</span></strong>`);


}

function removeAccessibilityMods(id) {
    const $label = $(`#${id}_label`);
    const $field = $(`#${id}, #${id}_datepicker_description`);

    // remove the inline error UI
    $label.find(`#${id}_err`).remove();
    $label.find('br').remove();

    // remove the red frame
    $field.removeClass('error');

    // revert label back to plain text (strip added (required) strong + field-name span)
    const originalText = $label.find('span.field-name').text() || $label.text();
    $label.empty().text(originalText.trim());
    $label.removeClass('required');

}


///////////////////////////////////////////////////////////
//                                                       //
//                 Global Validator function             //
//                                                       //
///////////////////////////////////////////////////////////

//
// The global validator is how we force an event to get generated
// to update the form on change of any input field. Since there is
// no page validation event we use this technique to in effect create
// an event to allow us to inject validations.
//
// PRIVATE
function globalEvaluationFunction() {
  // Re-entrancy guard: prevent tight loops when renderer indirectly retriggers validation
  if (globalEvaluationFunction._busy) return true;
  globalEvaluationFunction._busy = true;

  // Clear guard on next tick (after synchronous execution completes)
  setTimeout(function() {
    globalEvaluationFunction._busy = false;
  }, 0);

  // Remove the platform headertext that injects a hidden announcement so we can
  // control a single live region + heading for screen readers.
  if (!globalEvaluationFunction._clearedHeadertext) {
    var summaryEl = document.getElementById('ValidationSummaryEntityFormView');
    if (summaryEl && typeof summaryEl.headertext !== 'undefined') {
      try { summaryEl.headertext = ''; } catch (e) { /* ignore */ }
    }
    globalEvaluationFunction._clearedHeadertext = true;
  }

  // 1) Clear older inline messages
  for (var i = 0; i < Page_Validators.length; i++) {
    var v0 = Page_Validators[i];
    var id0 = String(v0.controltovalidate || '');
    $('#' + id0 + '_label > span[id=' + id0 + '_err]').remove();
    $('#' + id0 + '_label > br').remove();
  }

  // 2) Collect invalid validators → de-dupe by logical field
  var seen = Object.create(null);
  var items = []; // { id, type, msg }

  for (var j = 0; j < Page_Validators.length - 1; j++) { // skip our global
    var v = Page_Validators[j];
    if (v.isvalid !== false) continue;

    var id = String(v.controltovalidate || '');

    // Ignore PP's hidden file validators (both ..._hidden_* and ...hidden_*)
    if (/_hidden_(filename|filetype|file_size)$/i.test(id) || /(hidden_)(filename|filetype|file_size)$/i.test(id)) {
      // Treat the stock hidden file validators as always valid and invisible.
      // They’re replaced by our custom file validators.
      v.isvalid = true;
      if (v.style) {
        // Make sure they don't show anything on screen
        v.style.display = 'none';
      }
      continue;
    }

    // Normalize to the base (logical) field id (strip partner suffixes)
    var base = id.replace(/(_datepicker(_description)?|_timepicker(_description)?|_name|_value|_entityname|_text|_input_file)$/i, '');
    if (seen[base]) continue;   // keep ONE reason per field
    seen[base] = true;

    var link = $(v.errormessage);
    var text = link.text();
    var msg = (currentLang === 'en'
      ? 'Error ' + (items.length + 1) + ': ' + text
      : 'Erreur ' + (items.length + 1) + ' : ' + text);

    var inferredType = v.type || (
      (document.getElementById(base + '_datepicker_description') || document.getElementById(base + '_datepicker')) ? 'date' :
        (document.getElementById(base + '_timepicker_description') || document.getElementById(base + '_timepicker')) ? 'time' :
          ($('#' + base).is('select') ? 'lookup' : '')
    );

    items.push({ id: base, type: inferredType, msg: msg });
  }
  // 2b) Align Page_IsValid with the visible WET errors
  window.Page_IsValid = (items.length === 0);

  // 3) Repaint inline (single message per field)
  for (var k = 0; k < items.length; k++) {
    updateLabelErrorMessage(items[k].id, items[k].type, items[k].msg);
  }

// 4) Rebuild the summary list to exactly match the de-duped items
  var $sum = $('#ValidationSummaryEntityFormView');
  var headingText = '';

  // Helper: ensure a single, consistent live region and clear any stale hidden text
  var $live = $sum.find('> .wb-inv, > .sr-only, > .visually-hidden, > .sr-only-inline').first();
  function syncLiveRegion(text) {
    if (!$live.length) {
      $live = $('<p class="wb-inv" aria-live="polite" role="alert"></p>').prependTo($sum);
    }
    if (!$live.attr('aria-live')) $live.attr('aria-live', 'polite');
    if (!$live.attr('role')) $live.attr('role', 'alert');

    // Remove stale hidden text siblings so only one announcement source remains
    $sum.children('.wb-inv, .sr-only, .visually-hidden, .sr-only-inline').not($live).remove();

    $live.text(text);
  }

  if (items.length > 0) {
    var n = items.length;
    headingText = (currentLang === 'en'
      ? 'The form could not be submitted because ' + n + ' error' + (n > 1 ? 's were found' : ' was found')
      : "Le formulaire n'a pu être soumis car " + n + ' erreur' +
        (n > 1 ? "s ont été trouvées." : " a été trouvée."));
    // Update the live region immediately so screen readers hear the same text as the heading
    syncLiveRegion(headingText);
  } else {
    syncLiveRegion('');
  }

  setTimeout(function () {
    var focused = $(':focus');
    var $ul = $sum.find('> ul');

    // A11y: ensure the UL keeps its native list semantics
    // Some templates add role="presentation" which hides list semantics from AT.
    $ul.removeAttr('role');
    // Always clear current list
    $ul.empty();

    if (items.length === 0) {
      // No errors → hide the summary and clear heading/accessibility text
      $sum.find('> h2').text('');
      syncLiveRegion('');
      $sum.hide();
      $sum.removeAttr('tabindex');
      try { focused.focus(); } catch (e) { }
      return;
    }

    // Repopulate with current errors
    items.forEach(function (it) {
      var $a = $('<a/>', {
        href: '#' + it.id + '_label',
        onclick: 'javascript:scrollToAndFocus("' + it.id + '_label","' + it.id + '"); return false;',
        text: it.msg
      });
      $ul.append($('<li/>').append($a));
    });

    // Keep the visible heading and screen-reader-only text in sync so AT users
    // hear the same message when the summary first appears and when they revisit it.
    $sum.find('> h2').text(headingText);
    syncLiveRegion(headingText);

    $sum.find('a').css('text-decoration', 'underline');
    $sum.show();
    $sum.removeAttr('tabindex');

    // NEW: when a submit just failed, move focus directly to the first error link
    // instead of focusing the summary container itself.
    var suppress = (window.__suppressSummaryFocusUntil && Date.now() < window.__suppressSummaryFocusUntil);
    var wantFocus = (window.__validators_focusSummaryNow === true) && !suppress && $sum.is(':visible');
    if (wantFocus) {
      var firstLink = $sum.find('a').first();
      var focused = false;

      if (firstLink.length) {
        try {
          firstLink[0].focus({ preventScroll: false });
          focused = (document.activeElement === firstLink[0]);
        } catch (e) { /* ignore */ }

        if (!focused) {
          try {
            firstLink[0].focus();
            focused = (document.activeElement === firstLink[0]);
          } catch (e) { /* ignore */ }
        }

        if (focused && typeof firstLink[0].scrollIntoView === 'function') {
          try { firstLink[0].scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) { /* ignore */ }
        }
      }

      // consume one-shot flag regardless of focus result
      window.__validators_focusSummaryNow = false;
    }

  }, 250);

  // Derive Page_IsValid purely from the errors we actually show.
  var hasErrors = items && items.length > 0;

  // Make ASP.NET + reCAPTCHA agree with the WET summary
  window.Page_IsValid = !hasErrors;

  // Optional: keep Page_BlockSubmit in sync if anything else uses it
  if (typeof window.Page_BlockSubmit !== "undefined") {
    window.Page_BlockSubmit = hasErrors;
  }
  
  return true;
}

function createGlobalValidator() {
    // add custom validator to get all errors
    var globalValidator = document.createElement('span');
    globalValidator.style.display = "none";
    globalValidator.id = "globalValidator";
    globalValidator.controltovalidate = "";
    globalValidator.errormessage = "";
    globalValidator.evaluationfunction = globalEvaluationFunction;
    globalValidator.isvalid = true;
    return globalValidator;
}

///////////////////////////////////////////////////////////
//                                                       //
//                 Utility functions                     //
//                                                       //
///////////////////////////////////////////////////////////

//
// Utility functions used internally by the library
//

// Updates the label's error messages as per WET accessibility requirements
// PRIVATE
function updateLabelErrorMessage(id, type, message) {
  console.log('[WET-PP] updateLabelErrorMessage → SET error', { id, type, message });
  const $field = getFocusableField(id, type);
  const $label = $('#' + id + '_label');

  // Keep red frame + a11y state while invalid
  $field.addClass('error').attr('aria-invalid', 'true');

  // Get ALL spans with exact id (jQuery $('#id') returns only the first if duplicates exist)
  let $errs = $label.find("span[id='" + id + "_err']");

  if ($errs.length === 0) {
    // Ensure exactly one <br> before first error
    const last = $label.contents().last();
    if (!last.length || last[0].nodeName !== 'BR') {
      $label.append('<br />');
    }
    $label.append('<span id="' + id + '_err" class="label label-danger wrapped">' + message + '</span>');
  } else {
    // Update first, remove the rest (singleton)
    const $first = $errs.first();
    const oldTxt = $first.text().replace(/\s+/g, ' ').trim();
    const newTxt = $('<div/>').html(message).text().replace(/\s+/g, ' ').trim();
    if (oldTxt !== newTxt) $first.html(message);
    if ($errs.length > 1) $errs.slice(1).remove();

    // Ensure exactly one <br> immediately before the error
    let $prev = $first.prev();
    if (!$prev.length || $prev[0].nodeName !== 'BR') {
      $first.before('<br />');
    } else {
      while ($prev.prev().length && $prev.prev()[0].nodeName === 'BR') {
        $prev.prev().remove();
      }
    }
  }

  // Final safety: collapse any accidental consecutive <br>
  $label.find('br + br').remove();
}

// // Clears inline error + red frame for a single field
// // PRIVATE
function clearFieldErrorUI(id, type) {
  console.log('[WET-PP] clearFieldErrorUI → CLEAR error', { id, type });

  var $field = getFocusableField(id, type);
  if ($field.length) {
    // Remove BOTH our error classes and aria-invalid
    $field
      .removeClass("error input-validation-error")
      .removeAttr("aria-invalid");

    $field
      .closest(".form-control-cell, .cell")
      .removeClass("has-error error");
  }

  var $label = $("#" + id + "_label");
  if ($label.length) {
    // Inline error span is created as <span id="FIELDID_err" ...>
    var $err = $label.find("#" + id + "_err");
    if ($err.length) {
      // Remove the <br> directly before that span, if present
      var $prev = $err.prev();
      $err.remove();
      if ($prev.is("br")) {
        $prev.remove();
      }
    }
  }
}


// Helper: resolve the real, focusable control for a given field/type
// PRIVATE
function getFocusableField(id, type) {
  // Auto-detect when validators don't provide a type (PP defaults)
  var t = type;
  if (!t) {
    if (document.getElementById(id + '_datepicker_description') || document.getElementById(id + '_datepicker')) {
      t = 'date';
    } else if (document.getElementById(id + '_timepicker_description') || document.getElementById(id + '_timepicker')) {
      t = 'time';
    } else if ($('#' + id).is('select')) {
      t = 'lookup';
    } else if (document.getElementById(id + '_input_file')) {
      t = 'file';
    } else {
      t = ''; // default
    }
  }

  if (t === 'date') {
    const $c = $(`#${id}_datepicker_description, #${id}_datepicker, #${id}`).filter(':input');
    const $p = $c.filter(':visible').filter(function () { return !this.hasAttribute('aria-hidden') && !$(this).hasClass('wb-inv'); });
    return $p.length ? $p.first() : ($c.length ? $c.first() : $(`#${id}`));
  }
  if (t === 'time') {
    // include *_datepicker_description because time-only reuses it
    const $c = $(
      `#${id}_timepicker_description, #${id}_timepicker, #${id}_datepicker_description, #${id}`
    ).filter(':input');
    const $p = $c.filter(':visible').filter(function () {
      return !this.hasAttribute('aria-hidden') && !$(this).hasClass('wb-inv');
    });
    return $p.length ? $p.first() : ($c.length ? $c.first() : $(`#${id}`));
  }
  if (t === 'lookup') {
    const $sel = $(`#${id}`);
    if ($sel.is('select')) return $sel;
    const $name = $(`#${id}_name`);
    if ($name.length) return $name;
    return $sel;
  }
  if (t === 'file') {
    const $c = $(`#${id}_input_file, #${id}`).filter(':input');
    const $v = $c.filter(':visible');
    return $v.length ? $v.first() : ($c.length ? $c.first() : $(`#${id}`));
  }
  return $(`#${id}`);
}

function pad2(n){ return (n < 10 ? '0' : '') + n; }

// Accepts 'YYYY-MM-DD' and 'HH:mm' (24h). Returns 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
function getCompositeDateTimeValue(baseId) {
  var d = $('#' + baseId + '_datepicker_description').val() || '';
  var t =
    $('#' + baseId + '_timepicker_description').val()
    || $('#' + baseId + '_timepicker').val()
    || '';

  d = String(d).trim();
  t = String(t).trim();

  // Normalize bilingual/AM-PM time if present
  if (t) t = normalizeTime(t);

  if (d && t) return d + ' ' + t;
  if (d) return d;
  if (t) return t;
  return '';
}

// The field change event hanlder.
// Finds all validators for the field using it's id, placed in the matchingIndexes array. Each entry is the index into the Page+Validators array.
// Checks the validity status of the field before and after the validator is executed.
// If the validity status has changed then the field's error label and the summary DIV gets updated.
// The Page_IsValid field is also updated by calling the PP function ValidatorUpdateIsValid
// The Summary DIV is updated
// The global evaluator function is called.
//
// If the validity status has not changed, no further updates are applied.
//
// PRIVATE
// function updatesOnChange(o, evt) {
//   var id = o.id;
//   var type = o.type;
  
//   // NEW: per-field reentrancy guard (coalesce bursts: keyup+input+change etc.)
//   updatesOnChange._busy = updatesOnChange._busy || {};
//   if (updatesOnChange._busy[id]) return;
//   updatesOnChange._busy[id] = true;

//   try {
//     if (typeof removeDuplicateInlineErrors === 'function') {
//       removeDuplicateInlineErrors(id);
//     }

//     // IMPORTANT: declare matching at function scope so it's always defined
//     var matching = [];

//     // Defensive: no validators? nothing to do
//     var pv = window.Page_Validators || [];
//     if (!Array.isArray(pv) || pv.length === 0) return;

//     // find all validators attached to this logical field (PP defaults + custom)
//     var targets = [id];
//     if (type === 'lookup') {
//       targets.push(id + '_name', id + '_value', id + '_entityname', id + '_text');
//     }
//     // Include native input + PP hidden partners so we can neutralize them
//     if (type === 'file') {
//       targets.push(
//         id + '_input_file',
//         id + '_hidden_filename',
//         id + '_hidden_filetype',
//         id + '_hidden_file_size'
//       );
//     }

//     matching = pv
//       .map(function (v, i) { return { v: v, i: i }; })
//       .filter(function (e) { return targets.indexOf(e.v.controltovalidate) !== -1; });

//     if (matching.length === 0) {
//       matching = pv
//         .map(function (v, i) { return { v: v, i: i }; })
//         .filter(function (e) { return e.v.controltovalidate === id; });
//     }

//     if (matching.length === 0) return;

//     var anyValidityChanged = false;

//     matching.forEach(function (pair) {
//       var v = pair.v;
//       var was = !!v.isvalid;
//       try {
//         if (typeof window.ValidatorValidate === "function") {
//           window.ValidatorValidate(v);
//         } else if (typeof v.evaluationfunction === "function") {
//           v.isvalid = !!v.evaluationfunction(v);
//         } else if (typeof v.clientvalidationfunction === "string" &&
//           typeof window[v.clientvalidationfunction] === "function") {
//           v.isvalid = !!window[v.clientvalidationfunction](v);
//         }
//       } catch (e) { /* ignore */ }
//       if (was !== !!v.isvalid) anyValidityChanged = true;
//     });

//     // ---------- FILE BRIDGE HARDENING (authoritative) ----------
//     // If the special bridge validator for this base is valid, force the
//     // rest of the field’s validators (including PP hidden ones) to valid,
//     // so inline clears cleanly and Page_IsValid is accurate.
//     if (type === 'file') {
//       var bridgePair = matching.find(function (p) {
//         try { return p.v && typeof p.v.id === 'string' && /_FileBridge_/i.test(p.v.id); }
//         catch (_) { return false; }
//       });
//       if (bridgePair && bridgePair.v.isvalid === true) {
//         matching.forEach(function (p) {
//           if (p !== bridgePair) {
//             p.v.isvalid = true;
//             try { p.v.errormessage = ''; } catch (_) { }
//           }
//         });
//         anyValidityChanged = true;
//       }
//     }
//     // ---------- /FILE BRIDGE HARDENING ----------

//     // global page validity refresh
//     ValidatorUpdateIsValid();

//     // If the field is invalid but nothing “changed” (e.g., duplicate state),
//     // force a repaint so the inline error shows up during typing/clearing.
//     if (!anyValidityChanged) {
//       var currentlyInvalid = matching.some(function (pair) { return pair.v.isvalid === false; });
//       var hasInline = $('#' + id + '_label').find("span[id='" + id + "_err']").length > 0;
//       if (currentlyInvalid && !hasInline) {
//         anyValidityChanged = true;
//       }
//     }

//     // If all validators for this field are now valid → clear its inline UI.
//     var allValidForField = matching.every(function (pair) { return pair.v.isvalid !== false; });
//     if (allValidForField) {
//       clearFieldErrorUI(id, type);
//     }

//     // Always refresh the summary after any user-facing change, once validators are active.
//     if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
//       setTimeout(globalEvaluationFunction, 0);
//     }

//     // Re-fire a bubbling change only for real user actions (keeps PP logic in sync)
//     if (evt && evt.isTrusted) {
//       setTimeout(function () {
//         var elId = id;

//         if (type === "date") {
//           elId = id + "_datepicker_description";
//         } else if (type === "lookup") {
//           var el = document.getElementById(id);
//           elId = (el && el.tagName === "SELECT")
//             ? id
//             : (document.getElementById(id + "_name") ? id + "_name" : id);
//         } else if (type === "time") {
//           if (document.getElementById(id + "_timepicker_description")) {
//             elId = id + "_timepicker_description";
//           } else if (document.getElementById(id + "_timepicker")) {
//             elId = id + "_timepicker";
//           } else if (document.getElementById(id + "_datepicker_description")) {
//             elId = id + "_datepicker_description";
//           } else {
//             var back = document.getElementById(id);
//             var cell = back && back.closest ? back.closest(".form-control-cell") : null;
//             var isTO = !!(cell && cell.querySelector('.input-group[data-pp-time-only="1"]'));
//             if (isTO) return;
//             elId = id;
//           }
//         } else {
//           elId = id;
//         }

//         var field = document.getElementById(elId);
//         if (!field) return;
//         var evt2 = new Event("change", { bubbles: true, cancelable: true });
//         evt2.synthetic = true;
//         field.dispatchEvent(evt2);
//       }, 0);
//     }

//   } finally {
//     updatesOnChange._busy[id] = false;
//   }
// }
// The field change event handler.
// Finds all validators for the field using its id in Page_Validators.
// Checks the validity status of the field before and after each validator is executed.
// If the validity status has changed then the field's error label and the summary DIV get updated.
// The Page_IsValid field is updated by calling the PP function ValidatorUpdateIsValid.
// The Summary DIV is updated by globalEvaluationFunction.
//
// If the validity status has not changed, no further updates are applied.
//
// PRIVATE
function updatesOnChange(o, evt) {
  var id = o.id;
  var type = o.type;

  // NEW: per-field reentrancy guard (coalesce bursts: keyup+input+change etc.)
  updatesOnChange._busy = updatesOnChange._busy || {};
  if (updatesOnChange._busy[id]) return;
  updatesOnChange._busy[id] = true;

  try {
    // -------- DEBUG: entry --------
    try {
      console.log('[WET-PP] updatesOnChange:start', {
        id: id,
        type: type,
        evtType: evt && evt.type,
        evtIsTrusted: evt && evt.isTrusted,
        value: (o && (typeof o.value !== 'undefined' ? o.value : o.textContent)),
        active: window.__validators_active,
        Page_IsValid: (typeof window.Page_IsValid !== 'undefined' ? window.Page_IsValid : undefined)
      });
    } catch (e) { /* ignore debug errors */ }

    if (typeof removeDuplicateInlineErrors === 'function') {
      try {
        removeDuplicateInlineErrors(id);
      } catch (e) {
        console.log('[WET-PP] updatesOnChange: removeDuplicateInlineErrors error', { id: id }, e && e.message);
      }
    }

    // IMPORTANT: declare matching at function scope so it's always defined
    var matching = [];

    // Defensive: no validators? nothing to do
    var pv = window.Page_Validators || [];
    try {
      console.log('[WET-PP] updatesOnChange: Page_Validators check', {
        id: id,
        hasArray: Array.isArray(pv),
        count: Array.isArray(pv) ? pv.length : undefined
      });
    } catch (e) { /* ignore debug */ }

    if (!Array.isArray(pv) || pv.length === 0) {
      try {
        console.log('[WET-PP] updatesOnChange: no Page_Validators, abort', { id: id });
      } catch (e) { }
      return;
    }

    // find all validators attached to this logical field (PP defaults + custom)
    var targets = [id];
    if (type === 'lookup') {
      targets.push(id + '_name', id + '_value', id + '_entityname', id + '_text');
    }
    // Include native input + PP hidden partners so we can neutralize them
    if (type === 'file') {
      targets.push(
        id + '_input_file',
        id + '_hidden_filename',
        id + '_hidden_filetype',
        id + '_hidden_file_size'
      );
    }

    matching = pv
      .map(function (v, i) { return { v: v, i: i }; })
      .filter(function (e) {
        return e.v && targets.indexOf(e.v.controltovalidate) !== -1;
      });

    if (matching.length === 0) {
      matching = pv
        .map(function (v, i) { return { v: v, i: i }; })
        .filter(function (e) {
          return e.v && e.v.controltovalidate === id;
        });
    }

    if (matching.length === 0) {
      try {
        console.log('[WET-PP] updatesOnChange: no matching validators for field', { id: id, type: type });
      } catch (e) { }
      return;
    }

    // DEBUG: list matching validators for this field
    try {
      console.log('[WET-PP] updatesOnChange: matching validators', {
        id: id,
        type: type,
        count: matching.length,
        validators: matching.map(function (pair) {
          return {
            idx: pair.i,
            vid: pair.v && pair.v.id,
            ctl: pair.v && pair.v.controltovalidate,
            isvalid: pair.v && pair.v.isvalid
          };
        })
      });
    } catch (e) { }

    var anyValidityChanged = false;

    // Run each validator and log before/after state
    matching.forEach(function (pair) {
      var v = pair.v;
      var was = !!(v && v.isvalid);

      try {
        console.log('[WET-PP] updatesOnChange: validator-before', {
          id: id,
          type: type,
          idx: pair.i,
          vid: v && v.id,
          ctl: v && v.controltovalidate,
          was: was
        });
      } catch (e) { }

      try {
        if (typeof window.ValidatorValidate === "function") {
          window.ValidatorValidate(v);
        } else if (v && typeof v.evaluationfunction === "function") {
          v.isvalid = !!v.evaluationfunction(v);
        } else if (v && typeof v.clientvalidationfunction === "string" &&
          typeof window[v.clientvalidationfunction] === "function") {
          v.isvalid = !!window[v.clientvalidationfunction](v);
        }
      } catch (e) {
        console.log('[WET-PP] updatesOnChange: validator exception', {
          id: id,
          type: type,
          idx: pair.i,
          vid: v && v.id
        }, e && e.message);
      }

      var now = !!(v && v.isvalid);
      try {
        console.log('[WET-PP] updatesOnChange: validator-after', {
          id: id,
          type: type,
          idx: pair.i,
          vid: v && v.id,
          ctl: v && v.controltovalidate,
          was: was,
          now: now
        });
      } catch (e) { }

      if (was !== now) anyValidityChanged = true;
    });

    // ---------- FILE BRIDGE HARDENING (authoritative) ----------
    // If the special bridge validator for this base is valid, force the
    // rest of the field’s validators (including PP hidden ones) to valid,
    // so inline clears cleanly and Page_IsValid is accurate.
    if (type === 'file') {
      try {
        var bridgePair = matching.find(function (p) {
          try { return p.v && typeof p.v.id === 'string' && /_FileBridge_/i.test(p.v.id); }
          catch (_) { return false; }
        });
        if (bridgePair && bridgePair.v.isvalid === true) {
          console.log('[WET-PP] updatesOnChange: file bridge authoritative valid, forcing others valid', { id: id });
          matching.forEach(function (p) {
            if (p !== bridgePair && p.v) {
              p.v.isvalid = true;
              try { p.v.errormessage = ''; } catch (_) { }
            }
          });
          anyValidityChanged = true;
        }
      } catch (e) {
        console.log('[WET-PP] updatesOnChange: file bridge hardening error', { id: id }, e && e.message);
      }
    }
    // ---------- /FILE BRIDGE HARDENING ----------

    // global page validity refresh
    ValidatorUpdateIsValid();
    try {
      console.log('[WET-PP] updatesOnChange: ValidatorUpdateIsValid done', {
        id: id,
        type: type,
        Page_IsValid: (typeof window.Page_IsValid !== 'undefined' ? window.Page_IsValid : undefined)
      });
    } catch (e) { }

    // If the field is invalid but nothing “changed” (e.g., duplicate state),
    // force a repaint so the inline error shows up during typing/clearing.
    if (!anyValidityChanged) {
      var currentlyInvalid = matching.some(function (pair) { return pair.v && pair.v.isvalid === false; });
      var hasInline = $('#' + id + '_label').find("span[id='" + id + "_err']").length > 0;
      try {
        console.log('[WET-PP] updatesOnChange: invalidState', {
          id: id,
          type: type,
          anyValidityChanged: anyValidityChanged,
          currentlyInvalid: currentlyInvalid,
          hasInline: hasInline
        });
      } catch (e) { }
      if (currentlyInvalid && !hasInline) {
        anyValidityChanged = true;
      }
    }

    // If all validators for this field are now valid → clear its inline UI.
    var allValidForField = matching.every(function (pair) { return !pair.v || pair.v.isvalid !== false; });
    try {
      console.log('[WET-PP] updatesOnChange: allValidForField', {
        id: id,
        type: type,
        allValidForField: allValidForField
      });
    } catch (e) { }

    if (allValidForField) {
      try {
        console.log('[WET-PP] updatesOnChange: calling clearFieldErrorUI', { id: id, type: type });
      } catch (e) { }
      clearFieldErrorUI(id, type);
    }

    // Always refresh the summary after any user-facing change, once validators are active.
    if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
      try {
        console.log('[WET-PP] updatesOnChange: scheduling summary refresh', { id: id, type: type });
      } catch (e) { }
      setTimeout(globalEvaluationFunction, 0);
    }

    // Re-fire a bubbling change only for real user actions (keeps PP logic in sync)
    if (evt && evt.isTrusted) {
      setTimeout(function () {
        try {
          console.log('[WET-PP] updatesOnChange: re-firing synthetic change', { id: id, type: type });
        } catch (e) { }

        var elId = id;

        if (type === "date") {
          elId = id + "_datepicker_description";
        } else if (type === "lookup") {
          var el = document.getElementById(id);
          elId = (el && el.tagName === "SELECT")
            ? id
            : (document.getElementById(id + "_name") ? id + "_name" : id);
        } else if (type === "time") {
          if (document.getElementById(id + "_timepicker_description")) {
            elId = id + "_timepicker_description";
          } else if (document.getElementById(id + "_timepicker")) {
            elId = id + "_timepicker";
          } else if (document.getElementById(id + "_datepicker_description")) {
            elId = id + "_datepicker_description";
          } else {
            var back = document.getElementById(id);
            var cell = back && back.closest ? back.closest(".form-control-cell") : null;
            var isTO = !!(cell && cell.querySelector('.input-group[data-pp-time-only="1"]'));
            if (isTO) return;
            elId = id;
          }
        } else {
          elId = id;
        }

        var field = document.getElementById(elId);
        if (!field) return;
        var evt2 = new Event("change", { bubbles: true, cancelable: true });
        evt2.synthetic = true;
        field.dispatchEvent(evt2);
      }, 0);
    }

  } finally {
    updatesOnChange._busy[id] = false;
    try {
      console.log('[WET-PP] updatesOnChange:end', { id: id, type: type });
    } catch (e) { }
  }
}


// Attaches per-field change/input handlers AFTER first submit activation.
// - No PP date/time wrappers used; works with native type="date"/"time"
// - File branch triggers your file pipeline + keeps PP stock UI suppressed
function addChangeEvents(id, type) {
  if (!id) return;
  type = (type || (document.getElementById(id)?.getAttribute('type') || '')).toLowerCase();

 
  function _run(id, type, e) {
  _suppressSummaryFocus(1200); // <- NEW: prevent summary focus for ~1.2s
  try { updatesOnChange({ id: id, type: type }, e || new Event('synthetic')); } catch (_) {}
  if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
    try { globalEvaluationFunction(); } catch (_) {}
  }
}

  // Generic (text, number, date, time, textarea, select/lookup)
  if (type !== 'file') {
    const $el = $('#' + id);
    $el.off('.vchg').on('change.vchg input.vchg blur.vchg', function (e) {
      _run(id, type, e);
    });
    return;
  }

  // FILE branch
  const $fin = $('#' + id + '_input_file'); // PP native file input lives here

  // FILE branch
  $fin.off('.vchg').on('change.vchg input.vchg blur.vchg', function (e) {
    _suppressSummaryFocus(1200); // <- NEW
    try { queueFileValidation(id, 'file', e); } catch (_) { }
    try { window.FileStockSuppression && window.FileStockSuppression.register(id); } catch (_) { }
    if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
      try { globalEvaluationFunction(); } catch (_) { }
    }
  });

  // Optional: also re-validate when the PP delete button is clicked (idempotent delegate)
  $(document).off('click.fileDelete.' + id)
    .on('click.fileDelete.' + id, '#' + id + '_delete_button', function () {
      setTimeout(function () {
        try { queueFileValidation(id, 'file', { isTrusted: true }); } catch (_) {}
        if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
          try { globalEvaluationFunction(); } catch (_) {}
        }
      }, 0);
    });
}

// PRIVATE
function removeChangeEvents(id, type) {
  const $f = getFocusableField(id, type);
  $f.off('.vchg');

  $('#' + id).off('.vchg');
  $('#' + id + '_name').off('.vchg');
  $('#' + id + '_input_file').off('.vchg');

  const $dp = $f.closest('.datetimepicker');
  if ($dp.length) $dp.off('.vchg');
  $f.siblings('.input-group-addon, .add-on, .btn').off('.vchg');
}

// PRIVATE
function removeDuplicateInlineErrors(id) {
  const $label = $('#' + id + '_label');
  const $errs = $label.find("span[id='" + id + "_err']");
  if ($errs.length > 1) $errs.slice(1).remove();
  $label.find('br + br').remove();
}

// No hidden-field polling. Validate using only the visible file input.
function queueFileValidation(id, type, srcEvent) {
  const fin = document.getElementById(id + '_input_file') || document.getElementById(id);
  const evt = srcEvent || { isTrusted: true };

  // If the file input exists, run after the change event completes;
  // no waiting for PP hidden fields.
  setTimeout(function () {
    // Your existing pipeline (clears/sets inline + updates summary)
    updatesOnChange({ id, type }, evt);
  }, 0);
}
///////////////////////////////////////////////////////////
//                                                       //
//                 Add Validator function                //
//                                                       //
///////////////////////////////////////////////////////////

// PRIVATE
//
function _addValidator(id, type, validator) {
    var newValidator = document.createElement('span');
    newValidator.id = `${id}CustomValidator-${crypto.randomUUID()}`;
    newValidator.type = type;
    newValidator.controltovalidate = id;
    newValidator.errormessage = `<a href='#${id}_label'
                                        onclick='javascript:scrollToAndFocus("${id}_label", "${id}"); return false;'
                                        referenceControlId=${id}>
                                    ${currentLang === 'en' ? validator.message_en : validator.message_fr}
                                </a>`;
    newValidator.evaluationfunction = validator.validator;
    newValidator.isvalid = true;

    var inds = Page_Validators
        .map((v, index) => ({ v, index }))
        .filter(e => e.v.controltovalidate === id)
        .map(e => e.index);
    if (Array.isArray(inds) && inds.length > 0) {
        Page_Validators.splice(inds[inds.length - 1] + 1, 0, newValidator);
    } else {
        Page_Validators.push(newValidator);
    }

}

// --- focus suppression helper (used for on-change/blur runs) ---
function _suppressSummaryFocus(ms) {
  window.__suppressSummaryFocusUntil = Date.now() + (ms || 1000);
}


///////////////////////////////////////////////////////////
//                                                       //
//                 Public functions                      //
//                                                       //
///////////////////////////////////////////////////////////


// Adds the validations for the page based on a collection of fields
//
//
//         {
//            id: 'ava_masteremailaddress',
//            type: 'email',
//            length: 100,
//            required: false,
//            validators: [
//              {
//                validator: validateEmailFormat,
//                message_en: "Master Email Address must be a valid email.",
//                message_fr: "[FR} Master Email Address must be a valid email"
//              }
//            ]
//          }

var __validators_active = false;

// One-time activation of live change/blur handlers for all fields
function ensureLiveChangeHandlers() {
  // Guard so we only wire things once
  if (window.__validators_liveHandlersAttached) return;
  window.__validators_liveHandlersAttached = true;

  // Mark validators as "active" from now on
  window.__validators_active = __validators_active = true;

  const seen = new Set();
  const pv = window.Page_Validators || [];

  pv.forEach(function (v) {
    const id = v && v.controltovalidate;
    if (!id || seen.has(id)) return;

    // Derive a stable logical type
    let type = (v.type || (document.getElementById(id)?.getAttribute('type') || '')).toLowerCase();
    if (type === 'select-one' || type === 'select') type = 'lookup';
    if (type === 'file') type = 'file';

    try {
      addChangeEvents(id, type);
    } catch (e) {
      // keep going even if one field misbehaves
      console.log('[WET-PP] ensureLiveChangeHandlers: addChangeEvents failed for', id, e && e.message);
    }
    seen.add(id);
  });

  // move this to Page_ClientValidate via the global validator.
  // Immediately repaint summary/inline errors based on current validity
  // if (typeof globalEvaluationFunction === 'function') {
  //   try { globalEvaluationFunction(); } catch (e) {
  //     console.log('[WET-PP] ensureLiveChangeHandlers: globalEvaluationFunction error', e && e.message);
  //   }
  // }
}

 // Registers custom validators but does not attach live change handlers
// until the first "Next" click (quiet-until-first-submit).
function addValidators(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return;

  // Activate validators on first Next click (quiet-until-first-submit)
  $('#NextButton').off('.bindV').on('click.bindV', function () {
    // Coming from a real Next click -> it is OK for the summary
    // to be considered as a potential focus target on this submit.
    window.__validators_focusSummaryNow = true;
    ensureLiveChangeHandlers();
  });
  var $summary = $('#ValidationSummaryEntityFormView');
  $summary.removeAttr('tabindex');

  // A11y: ensure any UL in the summary is not role="presentation"
  $summary.find('ul[role="presentation"]').removeAttr('role');

  // Register each field's validators (no live change handlers yet)
  fields.forEach(function (field) {
    const id = field && field.id;
    if (!id) return;

    // Prefer explicit type in config; otherwise read the native input's type attribute
    const type = (field.type || (document.getElementById(id)?.getAttribute('type') || '')).toLowerCase();

    if (field.required) addAccessibilityMods(id);

    (field.validators || []).forEach(function (v) {
      _addValidator(id, type, v);
    });
  });

  // Ensure the global painter runs last (your numbering + repaint pipeline)
  if (typeof createGlobalValidator === 'function') {
    Page_Validators.push(createGlobalValidator());
  }

  // Delegate: when a PP "Delete" button is clicked for a file field,
  // let PP update hidden inputs, then revalidate the logical file field.
  $(document)
    .off('click.fileDelete')
    .on('click.fileDelete', 'button[id$="_delete_button"]', function () {
      const baseId = String(this.id || '').replace(/_delete_button$/, '');
      if (!baseId) return;

      // Run after PP DOM/hidden fields settle
      setTimeout(function () {
        queueFileValidation(baseId, 'file', { isTrusted: true });
        if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
          globalEvaluationFunction();
        }
      }, 0);
    }); // pattern retained from your prior version
}

// Removes the custom validators for the field with the supplied id
function removeValidators(id) {
    $(`#${id}_err`).hide();

    var regexp = new RegExp(`^${id}CustomValidator-.+`);

    const matchingIndexes = Page_Validators.reduce((accumulator, v, index) => {
        if (v.controltovalidate === id && regexp.test(v.id)) {
            accumulator.push(index);
        }
        return accumulator;
    }, []);

    matchingIndexes.sort((a, b) => b - a);
    for (const index of matchingIndexes) {
        removeChangeEvents(Page_Validators[index].controltovalidate, Page_Validators[index].type);
        Page_Validators.splice(index, 1);
    }

    // if no more of OUR custom validators remain for this field, clean up decorations
    const stillHasCustom = Page_Validators.some(v => v.controltovalidate === id && regexp.test(v.id));
    if (!stillHasCustom) {
        removeAccessibilityMods(id);
    }
}


// also add a custom validator for each validator in the validator array passed in.
function addValidator(field) {
    var id = field.id;
    if (!id)
        return;

    var type = field.type || "";
    var required = field.required || false;
    if (required)
        addAccessibilityMods(id);

    if (__validators_active )
        addChangeEvents(id, type);

    field.validators.forEach(v => {
        _addValidator(id, type, v);
    });
}

// Normalize common bilingual time inputs to 24h "HH:mm[:ss]"
function normalizeTime(t) {
  let s = String(t || '').trim();
  if (!s) return '';
  // FR "14 h 30" or "14h30" -> "14:30"
  s = s.replace(/^\s*([01]?\d|2[0-3])\s*[hH]\s*([0-5]\d)\s*$/, (_, h, m) =>
    String(h).padStart(2,'0') + ':' + m
  );
  // "h:mm[:ss] AM/PM" (with optional periods) -> 24h
  const m = s.match(/^\s*(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*([AaPp])\.?\s*[Mm]\.?\s*$/);
  if (m) {
    let hh = parseInt(m[1], 10) % 12;
    if (/p/i.test(m[4])) hh += 12;
    return String(hh).padStart(2,'0') + ':' + m[2] + (m[3] ? (':' + m[3]) : '');
  }
  return s;
}

function refreshDateTimeAddonLabels(scope) {
  var $root = scope ? $(scope) : $(document);
  var lang  = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var dateLabel = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
  var timeLabel = lang.startsWith('fr') ? "Choisir l’heure" : 'Choose a time';

  $root.find('.form-control-cell .input-group.datetimepicker, .form-control-cell .input-group.pp-inside')
    .each(function(){
      var $g = $(this);
      var isTimeOnly = $g.is('[data-pp-time-only="1"]') ||
                       $g.find('input[id$="_datepicker_description"][data-pp-as-time="1"]').length > 0;
      var label = isTimeOnly ? timeLabel : dateLabel;
      //$g.find('.input-group-addon.btn,[role="button"]').attr({ 'aria-label': label, title: label });
      $g.find('.input-group-addon.btn,[role="button"]')
      .attr({ 'aria-label': label })        
      .removeAttr('title');
    });
}

// call once on load; call again after you patch fields or PP redraws
$(function(){
  refreshDateTimeAddonLabels(document);
  var $scope = $('#liquid_form, .crmEntityFormView, form[id$="EntityFormView"]').first();
  if (!$scope.length) { $scope = $(document); }
  $scope.find('input,select,textarea,button').removeAttr('title');
});

// Toggle PP "required" UI bits for a field baseId
// opts: { showNow?: boolean, deferError?: boolean }
// - showNow=true  → show error frame/message if empty (used on submit)
// - deferError=true → never show red frame now (used on initial load/typing)
function _ppMarkRequired(baseId, hasValue, opts) {
  opts = opts || {};
  var showNow  = !!opts.showNow;
  var deferErr = !!opts.deferError;

  var $req = $('#RequiredFieldValidator' + baseId);
  var $err = $('#' + baseId + '_err');
  var $back = $('#' + baseId);
  var $vis  = $('#' + baseId + '_timepicker_description');

  // Star: visible when empty, hidden when filled
  if ($req.length) {
    $req.css('display', hasValue ? 'none' : 'inline')
        .css('visibility', hasValue ? 'hidden' : 'visible');
  }

  // Inline message only on submit when empty
  if ($err.length) $err.toggle(showNow && !hasValue);

  // Red frame: only when we are in a submit/finalize pass
  if ($vis.length) {
    var makeRed = showNow && !hasValue && !deferErr;
    $vis.toggleClass('error', makeRed)
        .attr('aria-invalid', makeRed ? 'true' : (hasValue ? 'false' : 'false'));
  }

  if ($back.length) $back.attr('aria-invalid', hasValue ? 'false' : (showNow ? 'true' : 'false'));

  // Let PP’s “required” logic refresh (safe if missing)
  try { if (typeof validateRequiredField === 'function') validateRequiredField(baseId); } catch(_){}
}

// ---- Join a date-only + time-only into a hidden portal field ----------------
function wirePortalComposite(opts) {
  var dateId   = opts.dateId;    // e.g., 'ethi_nextcanadadate'
  var timeId   = opts.timeId;    // e.g., 'ethi_nextcanadatime'
  var portalId = opts.portalId;  // e.g., 'ethi_nextcanadadateandtimeportal'

  // Prefer native/base inputs first; fall back to PP-visible partners if present
  var $date = $('#' + dateId);
  if (!$date.length) $date = $('#' + dateId + '_datepicker_description');
  if (!$date.length) $date = $('#' + dateId + '_datepicker');

  var $time = $('#' + timeId);
  if (!$time.length) $time = $('#' + timeId + '_timepicker_description');
  if (!$time.length) $time = $('#' + timeId + '_timepicker');
  if (!$time.length) $time = $('#' + timeId + '_datepicker_description'); // last-resort fallback

  var $portal = $('#' + portalId);
  if (!$portal.length) return; // nothing to do

  function normDate(s) {
    s = String(s || '').trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) {
      var dd=('0'+m2[1]).slice(-2), mm=('0'+m2[2]).slice(-2), yy=m2[3];
      return yy + '-' + mm + '-' + dd;
    }
    return '';
  }
  function normTime(s) {
    if (typeof normalizeTime === 'function') return normalizeTime(String(s || ''));
    s = String(s || '').trim();
    var m = s.match(/^\s*(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])?\s*$/);
    if (m) {
      var h = parseInt(m[1], 10), mm = m[2];
      if (m[3]) { var pm = /p/i.test(m[3]); h = (h % 12) + (pm ? 12 : 0); }
      return ('0'+h).slice(-2) + ':' + mm;
    }
    var m2 = s.match(/^\s*([01]?\d|2[0-3])\s*[hH]\s*([0-5]\d)\s*$/);
    if (m2) return ('0'+m2[1]).slice(-2) + ':' + m2[2];
    return '';
  }

  function recompute() {
    var d = normDate($date.val());
    var t = normTime($time.val());
    var v = (d && t) ? (d + ' ' + t) : '';
    if ($portal.val() !== v) $portal.val(v);
  }

  // Initial + live updates on base/visible inputs
  recompute();
  $date.off('.portalJoin').on('input.portalJoin change.portalJoin blur.portalJoin', recompute);
  $time.off('.portalJoin').on('input.portalJoin change.portalJoin blur.portalJoin', recompute);

  // Submit-capture: ensure final value is set before validators/post
  try {
    var formEl = $portal.closest('form').get(0) || $date.closest('form').get(0) || $time.closest('form').get(0);
    if (formEl && !formEl['_ppPortalJoin_' + portalId]) {
      formEl.addEventListener('submit', function () { recompute(); }, true);
      formEl['_ppPortalJoin_' + portalId] = true;
    }
  } catch (_) {}
}

// public helper to re-run all validators for a field now
window.revalidate = function revalidate(id, type, opts) {
  try {
    opts = opts || {};
    var active = !!(window.__validators_active);

    // Skip quietly until validators are activated, unless explicitly forced
    if (!active && !opts.force) {
      return false;
    }

    // Run the normal per-field validation pipeline
    updatesOnChange({ id: String(id), type: String(type || '') }, { isTrusted: true });

    // Ensure summary rebuilds in forced mode too (pre-activation),
    // since updatesOnChange only refreshes the summary when active.
    if (typeof globalEvaluationFunction === 'function') {
      setTimeout(globalEvaluationFunction, 0);
    }
    return true;
  } catch (e) {
    console.warn('revalidate failed for', id, e);
    return false;
  }
};

(function(){
  // Helper to select an input by id; uses your helper if available
  function _ppSel(id){
    if (typeof getFocusableField === "function") {
      var $f = getFocusableField(id, "");
      if ($f && $f.length) return $f;
    }
    return $('#' + id);
  }

  /**
   * Enforce allowed phone chars while typing/pasting, and strip punctuation on blur.
   * Rules:
   *  1) Allow only digits and + - ( ) during input (others are removed immediately).
   *  2) Validation expects 10–15 digits.
   *  3) On blur (before validation), strip + - ( ) so value is digits-only.
   * @param {string|string[]} ids
   */
  window.enableStrictPhoneInput = function(ids){
    var arr = Array.isArray(ids) ? ids : [ids];

    arr.forEach(function(id){
      var $f = _ppSel(id);
      if (!$f.length) return;

      // Ensure idempotency
      $f.off(".vphone");

      // Hint browsers for a tel keypad; constrain pattern to allowed chars
      //$f.attr("inputmode","tel").attr("pattern","[0-9()+-]*");
      $f.attr("inputmode","tel").attr("pattern","[0-9()+\\-]*");
      //$f.attr("inputmode","tel").removeAttr("pattern");

      // Live sanitize: keep only 0-9, +, -, (, )
      function sanitizeAllowedNow(el){
        var before = el.value;
        // Remove any char not allowed by Rule #1
        var after  = before.replace(/[^0-9+\-()]/g, "");
        if (after !== before) {
          el.value = after;
        }
      }

      // On any input (covers typing, paste, drag-drop, autofill)
      $f.on("input.vphone", function(){
        sanitizeAllowedNow(this);
      });

      // Extra guard on paste (older browsers)
      $f.on("paste.vphone", function(e){
        // Let paste happen, then sanitize on next tick
        var el = this;
        setTimeout(function(){ sanitizeAllowedNow(el); }, 0);
      });

      // On blur: strip + - ( ) so only digits remain (Rule #3),
      // then trigger change so validation sees the normalized value.
      $f.on("blur.vphone", function(){
        var raw = String($(this).val() || "");
        // Remove the allowed punctuation; digits are kept
        var digitsOnly = raw.replace(/[+\-()]/g, "");
        if (digitsOnly !== raw) $(this).val(digitsOnly);
        // Also trim any accidental whitespace
        if (/\s/.test(this.value)) this.value = this.value.replace(/\s+/g, "");
        // Hand off to your validation pipeline
        $(this).trigger("change");
      });
    });
  };
})();
 
// Put focus "before" everything so the first Tab hits the skip link (#wb-tphp a.wb-sl)
// (function ($) {
//   function hasSummaryErrors() {
//     return $('#ValidationSummaryEntityFormView:visible, .validation-summary-errors:visible, .wb-frmvld-msg[role="alert"]:visible, .wb-frmvld-list:visible').length > 0;
//   }
//   function focusBeforeSkip() {
//     if (hasSummaryErrors()) return; // let summary keep focus on error pages
//     $('body').attr('tabindex', '-1').focus();
//     setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);
//   }
//   // Full load
//   $(focusBeforeSkip);
//   // Power Pages partial postbacks
//   if (window.Sys?.WebForms?.PageRequestManager) {
//     try { Sys.WebForms.PageRequestManager.getInstance().add_endRequest(focusBeforeSkip); } catch {}
//   }
// })(jQuery);


// Put focus "before" everything so the first Tab hits the skip link (#wb-tphp a.wb-sl)
(function () {
  // If jQuery isn't present, use a safe DOM fallback
  var $ = window.jQuery;

  function hasSummaryErrors() {
    var sel = '#ValidationSummaryEntityFormView:visible, .validation-summary-errors:visible, .wb-frmvld-msg[role="alert"]:visible, .wb-frmvld-list:visible';
    return $ ? $(sel).length > 0
             : !!(document.getElementById('ValidationSummaryEntityFormView')?.offsetParent ||
                  document.querySelector('.validation-summary-errors')?.offsetParent ||
                  document.querySelector('.wb-frmvld-msg[role="alert"], .wb-frmvld-list')?.offsetParent);
  }

  function focusBeforeSkip() {
    if (hasSummaryErrors()) return;

    // If something meaningful already has focus (e.g., user clicked fast), don't steal it.
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae !== document.documentElement &&
        !ae.closest?.('#wb-srch')) return;

    // Prefer simple body focus, then clean up tabindex
    var focused = false;
    try {
      if ($) { $('body').attr('tabindex','-1').focus(); focused = document.activeElement === document.body; }
      else { document.body.setAttribute('tabindex','-1'); document.body.focus(); focused = document.activeElement === document.body; }
    } catch {}

    // Fallback: insert a sentinel just before skip links and focus it
    if (!focused) {
      var tphp = document.getElementById('wb-tphp');
      var s = document.createElement('span');
      s.id = 'pre-skip-sentinel';
      s.tabIndex = -1;
      (tphp?.parentNode || document.body).insertBefore(s, tphp || document.body.firstChild);
      try { s.focus(); focused = document.activeElement === s; } catch {}
      // remove sentinel soon after; focus will move on Tab
      setTimeout(function(){ s.remove?.(); }, 50);
    }

    // Remove the temporary tabindex on body
    setTimeout(function () { document.body.removeAttribute('tabindex'); }, 0);
  }

  function onLoad(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(fn, 0);
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  onLoad(focusBeforeSkip);
  // Power Pages / WebForms partial postbacks
  try {
    var prm = window.Sys?.WebForms?.PageRequestManager?.getInstance?.();
    if (prm) prm.add_endRequest(focusBeforeSkip);
  } catch {}
})();


(function (w) {
  function onReady(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):setTimeout(fn,0)}
  function find(sel){return sel?document.querySelector(sel):document.querySelector('h2.tab-title')||document.getElementById('wb-cont')||document.querySelector('main h1, main h2')}
  function focusH(h){if(!h)return; if(!h.hasAttribute('tabindex'))h.setAttribute('tabindex','-1'); try{h.focus({preventScroll:false})}catch{h.focus()}}
  function announceOrFocus(sel,mode){const h=find(sel); if(!h) return; if(mode==='announce'){w.__announceStepTitle?.(h.textContent.trim()); return;} focusH(h);}
  function install(opts){const sel=opts?.selector,mode=opts?.mode; const go=()=>announceOrFocus(sel,mode); onReady(go); try{w.Sys?.WebForms?.PageRequestManager?.getInstance?.().add_endRequest(go);}catch{}}
  w.WETFocus = w.WETFocus || { install };
})(window);

// ReadOnlySelect (no hints, WET/GCWeb-friendly)
// Makes a native <select> behave read-only while remaining focusable.
// Idempotent; safe to call multiple times and after WebForms partial postbacks.
(function (w) {
  'use strict';

  function getList(target) {
    if (!target) return [];
    if (typeof target === 'string') return Array.from(document.querySelectorAll(target));
    if (target instanceof Element) return [target];
    if (Array.isArray(target) || target instanceof NodeList) return Array.from(target);
    if (w.jQuery && target instanceof w.jQuery) return target.toArray();
    return [];
  }

  function bindGuards(el) {
    if (el.dataset.roBound === '1') return;
    el.dataset.roBound = '1';

    // Keep focus but prevent the popup
    el.addEventListener('mousedown', function (e) {
      e.preventDefault();
      try { this.focus(); } catch {}
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });

    el.addEventListener('keydown', function (e) {
      // Allow Tab/Shift+Tab only
      if (e.key === 'Tab') return;
      const k = e.key;
      const block =
        k === 'Enter' || k === ' ' || k === 'Spacebar' ||
        k === 'ArrowDown' || k === 'ArrowUp' ||
        k === 'ArrowLeft' || k === 'ArrowRight' ||
        k === 'PageDown' || k === 'PageUp' ||
        k === 'Home' || k === 'End' || k === 'F4' ||
        (e.altKey && k === 'ArrowDown');
      if (block) { e.preventDefault(); e.stopPropagation(); }
    });

    // If something changes it programmatically, revert
    const initial = el.value;
    el.addEventListener('change', function (e) {
      if (this.value !== initial) {
        this.value = initial;
        try { this.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
      }
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function hideChevron(el) {
    el.setAttribute('data-ro-select', '1'); // CSS hook
    el.classList.add('readonly');
  }

  // opts:
  //   ariaDisabled: boolean (default true) — if true, set aria-disabled="true"
  function makeReadOnlySelect(target, opts) {
    const conf = Object.assign({ ariaDisabled: true }, opts);
    const els = getList(target);
    els.forEach(el => {
      if (!el || el.tagName !== 'SELECT') return;

      // Keep it focusable
      el.removeAttribute('disabled');
      el.removeAttribute('readonly'); // not supported on <select>

      // Announce non-interactive state without adding hint text
      if (conf.ariaDisabled) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');

      hideChevron(el);
      bindGuards(el);
    });
  }

  function reapplyOnPartialPostback(selector, opts) {
    try {
      const prm = w.Sys?.WebForms?.PageRequestManager?.getInstance?.();
      if (prm) prm.add_endRequest(function () { makeReadOnlySelect(selector, opts); });
    } catch {}
  }

  w.ReadOnlySelect = w.ReadOnlySelect || { make: makeReadOnlySelect, reapply: reapplyOnPartialPostback };
})(window);


// Make a text <input> read-only but tabbable & SR-clear (GCWeb/WET4 friendly)
window.TabbableReadOnly = {
  make(sel, { ariaDisabled = true, label = null } = {}) {
    const el = document.querySelector(sel);
    if (!el) return false;

    // 1) Keep it focusable (in Tab order)
    el.removeAttribute('disabled');          // disabled => not tabbable
    el.classList?.remove('aspNetDisabled');  // some themes block focus via this class
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

    // 2) Not editable
    el.readOnly = true;
    el.setAttribute('aria-readonly', 'true');

    // 3) SR announcement
    if (ariaDisabled) el.setAttribute('aria-disabled', 'true');
    else el.removeAttribute('aria-disabled');

    // 4) Prefer the visible label for SR name
    let labEl = null;
    if (label) {
      labEl = document.querySelector(label);
    } else if (el.id) {
      labEl = document.querySelector(`label[for="${el.id}"]`) ||
              document.getElementById(`${el.id}_label`);
    }
    if (labEl) {
      if (!labEl.id) labEl.id = `${el.id || 'fld'}_label_fix`;
      el.setAttribute('aria-labelledby', labEl.id);
      if (el.id && labEl.getAttribute('for') !== el.id) labEl.setAttribute('for', el.id);
      el.removeAttribute('aria-label'); // avoid double/contradictory names
    }

    el.classList.add('readonly'); // purely cosmetic; ensure your CSS for .readonly doesn’t set pointer-events:none
    return true;
  },

  reapply(sel, opts) {
    const prm = window.Sys?.WebForms?.PageRequestManager?.getInstance?.();
    if (prm) prm.add_endRequest(() => window.TabbableReadOnly.make(sel, opts));
  }
};

// ReadOnlyRadioGroup (GCWeb/WET4 friendly)
// Usage (after the group is rendered):
//   ReadOnlyRadioGroup.make('#ethi_submitterismedicalcontact');
//   ReadOnlyRadioGroup.reapply('#ethi_submitterismedicalcontact');  // for partial postbacks
(function (w, d) {
  'use strict';

  function getContainer(arg) {
    if (!arg) return null;
    if (typeof arg === 'string') return d.querySelector(arg);
    if (arg.container) return d.querySelector(arg.container);
    return (arg instanceof Element) ? arg : null;
  }
  function getRadios(container, explicitName) {
    if (!container) return [];
    if (explicitName) {
      const safe = explicitName.replace(/"/g, '\\"');
      return Array.from(container.querySelectorAll('input[type="radio"][name="' + safe + '"]'));
    }
    return Array.from(container.querySelectorAll('input[type="radio"]'));
  }
  function ensureRoleAndLabel(container, opts) {
    if (!container) return;
    if (!container.hasAttribute('role')) container.setAttribute('role', 'radiogroup');

    // Prefer an explicit label selector; else try common PP patterns (legend/label cell)
    let labelEl = null;
    if (opts && opts.label) labelEl = d.querySelector(opts.label);
    if (!labelEl) labelEl = container.querySelector('legend, .field-label, label');
    if (!labelEl) {
      const labCell = container.closest('td')?.previousElementSibling;
      if (labCell) labelEl = labCell.querySelector('label, .field-label');
    }
    if (labelEl) {
      if (!labelEl.id) labelEl.id = (container.id || 'rg') + '_label';
      container.setAttribute('aria-labelledby', labelEl.id);
    }
  }
  function removeDisabledState(container, radios) {
    // Some PP templates wrap with disabled attrs/classes — strip them so Tab works
    container.removeAttribute('disabled');
    container.classList?.remove('aspNetDisabled');
    radios.forEach(r => {
      r.removeAttribute('disabled');
      r.classList?.remove('aspNetDisabled');
    });
  }
  function setAriaDisabled(container, radios, state) {
    container.setAttribute('aria-disabled', state ? 'true' : 'false');
    radios.forEach(r => r.setAttribute('aria-disabled', state ? 'true' : 'false'));
  }
  function normalizeTabOrder(radios) {
    let checked = radios.find(r => r.checked) || radios[0];
    radios.forEach(r => r.tabIndex = -1);
    if (checked) checked.tabIndex = 0;
  }
  function bindGuards(container, radios) {
    if (container.dataset.roRadios === '1') {
      // Re-run normalization in case selection changed programmatically
      normalizeTabOrder(radios);
      return;
    }
    container.dataset.roRadios = '1';

    radios.forEach(r => {
      if (r.dataset.roBound === '1') return;
      r.dataset.roBound = '1';

      // Keep focus but prevent toggling via mouse
      r.addEventListener('mousedown', function (e) { e.preventDefault(); this.focus(); });
      r.addEventListener('click', function (e) { e.preventDefault(); });

      // Prevent Space/Enter/Arrows/Home/End from changing selection
      r.addEventListener('keydown', function (e) {
        const k = e.key;
        if (k === 'Tab') return;
        if (k === ' ' || k === 'Spacebar' || k === 'Enter' ||
            k === 'ArrowLeft' || k === 'ArrowRight' ||
            k === 'ArrowUp' || k === 'ArrowDown' ||
            k === 'Home' || k === 'End') {
          e.preventDefault(); e.stopPropagation();
        }
      });

      // If something flips it programmatically, snap back to the default
      const def = r.defaultChecked;
      r.addEventListener('change', function (e) {
        if (this.checked !== def) {
          this.checked = def;
          normalizeTabOrder(radios);
        }
        e.preventDefault(); e.stopPropagation();
      });

      // Prevent associated label from toggling
      if (r.id) {
        const lab = container.querySelector('label[for="' + r.id + '"]');
        if (lab && !lab.dataset.roLabel) {
          lab.dataset.roLabel = '1';
          lab.addEventListener('click', function (e) { e.preventDefault(); });
        }
      }
    });

    normalizeTabOrder(radios);
  }

  function apply(arg) {
    const container = getContainer(arg);
    if (!container) return false;

    // Optionally narrow radios by name: ReadOnlyRadioGroup.make({container:'#x', name:'myName'})
    const name = (arg && arg.name) ? arg.name : null;
    const radios = getRadios(container, name);
    if (!radios.length) return false;

    ensureRoleAndLabel(container, arg || {});
    removeDisabledState(container, radios);
    setAriaDisabled(container, radios, true);
    bindGuards(container, radios);
    return true;
  }

  function make(arg) { return apply(arg); }

  function reapply(arg) {
    try {
      const prm = w.Sys?.WebForms?.PageRequestManager?.getInstance?.();
      if (prm) prm.add_endRequest(() => apply(arg));
    } catch {}
  }

  w.ReadOnlyRadioGroup = w.ReadOnlyRadioGroup || { make, reapply };
})(window, document);

//Link a group label to a radiogroup and route clicks to the checked radio
window.BindRadioGroupLabel = {
  make({ group, label }) {
    const g = typeof group === 'string' ? document.querySelector(group) : group;
    const l = typeof label === 'string' ? document.querySelector(label) : label;
    if (!g || !l) return false;

    // 1) Ensure radiogroup semantics and association
    if (!g.hasAttribute('role')) g.setAttribute('role', 'radiogroup');
    if (!l.id) l.id = (g.id || 'rg') + '_label';
    g.setAttribute('aria-labelledby', l.id);

    // 2) Keep native per-option labels as-is; for the big label, make it a focus helper
    l.removeAttribute('for'); // avoid pointing to the wrong thing
    l.addEventListener('click', function (e) {
      e.preventDefault();
      // focus the currently checked radio (or first radio as fallback)
      const radios = g.querySelectorAll('input[type="radio"]');
      const checked = Array.from(radios).find(r => r.checked) || radios[0];
      try { checked?.focus(); } catch {}
    }, { passive: false });

    return true;
  }
};

// Remove native tooltips from form controls (inputs, selects, textareas, buttons)
// Runs on load, after partial postbacks, and on dynamic insertions.
(function (w, d) {
  'use strict';

  function stripTooltips(scope) {
    var root = scope || d;
    // Only form controls (avoid killing <abbr title> etc.)
    var sel = 'input[title], select[title], textarea[title], button[title], [role="button"][title]';
    root.querySelectorAll(sel).forEach(function (el) {
      // allow opt-out per element
      if (el.hasAttribute('data-keep-title')) return;
      el.removeAttribute('title');
    });
  }

  function install() {
    // DOM ready
    if (d.readyState === 'loading') {
      d.addEventListener('DOMContentLoaded', function () { stripTooltips(d); }, { once: true });
    } else {
      stripTooltips(d);
    }

    // Power Pages / WebForms partial postbacks
    try {
      var prm = w.Sys?.WebForms?.PageRequestManager?.getInstance?.();
      if (prm) prm.add_endRequest(function () { stripTooltips(d); });
    } catch {}

    // Dynamic nodes (lookups, date/time widgets, etc.)
    try {
      var mo = new MutationObserver(function (muts) {
        for (var m of muts) {
          for (var n of m.addedNodes || []) {
            if (n.nodeType === 1) stripTooltips(n);
          }
        }
      });
      mo.observe(d.body, { childList: true, subtree: true });
    } catch {}
  }

  w.StripFormTooltips = w.StripFormTooltips || { run: stripTooltips, install: install };
  w.StripFormTooltips.install();
})(window, document);


// Disable native browser validation bubbles; rely on custom summary/inline errors
(function () {
  function novalidateAll() {
    document.querySelectorAll('form').forEach(function (f) { f.setAttribute('novalidate', 'novalidate'); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', novalidateAll, { once: true });
  } else {
    novalidateAll();
  }
})();

// Hook Page_ClientValidate so that ANY submit path (real Next or reCAPTCHA "fake Next")
// activates the live change/blur pipeline exactly once.
(function () {
  var previous = window.Page_ClientValidate;
  if (typeof previous !== 'function') {
    console.log('[WET-PP] Page_ClientValidate not found; live handler wrapper skipped');
    return;
  }

  window.Page_ClientValidate = function (validationGroup) {
    // First submit attempt from ANY caller (Next button, fake Next, other scripts)
    if (!window.__validators_active) {
      window.__validators_focusSummaryNow = true;
      try { ensureLiveChangeHandlers(); } catch (e) {
        console.log('[WET-PP] Page_ClientValidate wrapper: ensureLiveChangeHandlers error',
                    e && e.message);
      }
    }

    // Run the original Page_ClientValidate (this sets Page_IsValid etc.)
    var result = previous(validationGroup);


    // Run the original Page_ClientValidate (this sets Page_IsValid etc.)
    // globalEvaluationFunction will be invoked via the global validator
    // that we pushed into Page_Validators.

    // Always repaint summary + inline errors after validation
    // if (typeof globalEvaluationFunction === 'function') {
    //   try { globalEvaluationFunction(); } catch (e) {
    //     console.log('[WET-PP] Page_ClientValidate wrapper: globalEvaluationFunction error',
    //                 e && e.message);
    //   }
    // }

    return result;
  };
})();

