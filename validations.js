// validations.js

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
const currentLang = $('html').attr('lang') || 'en';

// PRIVATE
//
function addAccessibilityMods(id) {
    var label = $('#' + id + '_label');
    var text = label.text();
    label.text('');
    label.addClass('required');
    label.closest('div').removeClass('required');

    var input = $('#' + id);
    input.removeAttr('title');
    input.removeAttr('aria-label');
    input.removeAttr('aria-required');
    input.attr('required', 'required');

    var span = label.append('<span class="field-name">' + text + '</span>');
    var requiredText = currentLang === 'en' ? ' (required)' : ' (obligatoire)';
    span.append(`<strong aria-hidden="true" class="required"><span> ${requiredText}</span></strong>`);


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
//

// PRIVATE
function globalEvaluationFunction() {
  // Guard to skip before first Next click
  if (typeof __validators_active !== 'undefined' && !__validators_active) { return true; }
  // Cancel any pending UI update to prevent stale summary entries
  try { if (globalEvaluationFunction._timer) { clearTimeout(globalEvaluationFunction._timer); } } catch(_) {}

  // 1) Clear older inline messages
  for (var i = 0; i < Page_Validators.length; i++) {
    var v0 = Page_Validators[i];
    var id0 = String((v0 && v0.controltovalidate) || '');
    $('#'+id0+'_label > span[id='+id0+'_err]').remove();
    $('#'+id0+'_label > br').remove();
  }

  // 2) Collect invalid validators → de-dupe by logical field
  var seen = Object.create(null);
  var items = []; // { id, type, msg }

  for (var j = 0; j < Page_Validators.length; j++) {
    var v = Page_Validators[j];
    if (!v || v.id === 'globalValidator') continue; // skip our global by id, not position
    if (v.isvalid !== false) continue;

    var id = String(v.controltovalidate || '');

    // Ignore PP's hidden file validators (both ..._hidden_* and ...hidden_*)
    if (/_hidden_(filename|filetype)$/.test(id) || /(hidden_)(filename|filetype)$/.test(id))
      continue;

    // Normalize to the base (logical) field id (strip partner suffixes)
    var base = id.replace(/(_datepicker(_description)?|_timepicker(_description)?|_name|_value|_entityname|_text|_input_file)$/,'');
    if (seen[base]) continue;   // keep ONE reason per field
    seen[base] = true;

    var link = $(v.errormessage);
    var text = link.text();
    var msg  = (currentLang === 'en'
      ? 'Error '  + (items.length+1) + ': ' + text
      : 'Erreur ' + (items.length+1) + ' : ' + text);

    var inferredType = v.type || (
      document.getElementById(base + '_datepicker_description') || document.getElementById(base + '_datepicker') ? 'date' :
      document.getElementById(base + '_timepicker_description') || document.getElementById(base + '_timepicker') ? 'time' :
      ($('#' + base).is('select') ? 'lookup' : '')
    );
    items.push({ id: base, type: inferredType, msg: msg });
  }

  // 3) Repaint inline (single message per field)
  for (var k = 0; k < items.length; k++) {
    updateLabelErrorMessage(items[k].id, items[k].type, items[k].msg);
  }

  // 4) Rebuild the summary list to exactly match the de-duped items
  globalEvaluationFunction._timer = setTimeout(function () {
    var focused = $(':focus');
    var $sum = $('#ValidationSummaryEntityFormView');

    // Ensure header and list exist on first use
    var $hdr = $sum.find('> h2.validation-header');
    if ($hdr.length === 0) {
      $hdr = $('<h2 class="validation-header"></h2>').prependTo($sum);
    }
    var $ul = $sum.find('> ul');
    if ($ul.length === 0) {
      $ul = $('<ul/>').appendTo($sum);
    }

    $ul.empty();

    if (items.length > 0) {
      items.forEach(function (it) {
        var $a = $('<a/>', {
          href: '#' + it.id + '_label',
          onclick: 'javascript:scrollToAndFocus("' + it.id + '_label","' + it.id + '"); return false;',
          text: it.msg
        });
        $ul.append($('<li/>').append($a));
      });

      var n = items.length;
      $sum.find('> h2').text(
        currentLang === 'en'
          ? 'The form could not be submitted because ' + n + ' error' + (n > 1 ? 's were found' : ' was found')
          : "Le formulaire n'a pu être soumis car " + n + ' erreur' + (n > 1 ? "s ont été trouvées." : " a été trouvée.")
      );

      $sum.find('a').css('text-decoration', 'underline');
      $sum.blur().show();
      focused.focus();
    } else {
      // No errors → clear and hide summary
      $sum.hide();
    }
  }, 150);

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

// Clears inline error + red frame for a single field
// PRIVATE
function clearFieldErrorUI(id, type) {
  const $field = getFocusableField(id, type);
  const $label = $('#' + id + '_label');

  $field.removeClass('error')
        .attr('aria-invalid', 'false');  // a11y state

  // Remove inline error + any preceding <br>
  const $err = $label.find('#' + id + '_err');
  if ($err.length) {
    const $prev = $err.prev();
    $err.remove();
    if ($prev.is('br')) $prev.remove();
  }

  // If your theme adds error classes on wrappers, clear them too (safe no-ops otherwise)
  $field.closest('.form-group, .cell, .control').removeClass('error has-error');
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

// Override to focus the visible input for date/time/lookup fields
(function (w, $) {
  var orig = w.scrollToAndFocus;
  w.scrollToAndFocus = function (labelId, controlId) {
    try {
      var baseId = String(controlId || '').replace(/(_datepicker(_description)?|_timepicker(_description)?|_name|_value|_entityname|_text|_input_file)$/, '');
      var $t = (typeof w.getFocusableField === 'function')
        ? w.getFocusableField(baseId) // auto-detects date/time/lookup/file
        : $('#' + controlId + ', #' + baseId + '_timepicker_description, #' + baseId + '_timepicker, #' + baseId + '_datepicker_description, #' + baseId);
      var el = ($t && $t.length) ? $t.get(0) : (document.getElementById(controlId) || document.getElementById(baseId));

      // Scroll label (preferred) or field into view
      var labelEl = document.getElementById(labelId);
      if (labelEl && labelEl.scrollIntoView) {
        labelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Focus the real, visible control
      setTimeout(function () {
        if (el && typeof el.focus === 'function') {
          try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
          if (el.setSelectionRange && typeof el.value === 'string') {
            var end = el.value.length;
            try { el.setSelectionRange(end, end); } catch (_) {}
          }
        } else if (typeof orig === 'function') {
          // Fallback to original if we couldn’t resolve target
          try { orig(labelId, controlId); } catch (_) {}
        }
      }, 50);
    } catch (_) {
      if (typeof orig === 'function') { try { orig(labelId, controlId); } catch (__) {} }
    }
    return false;
  };
})(window, window.jQuery || window.$);

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

// Build the composite value PP expects in the backing input.
// For date-only fields, this returns just the date.
// function getCompositeDateTimeValue(id){
//   var dEl = document.getElementById(id + '_datepicker_description') ||
//             document.getElementById(id + '_datepicker');
//   var tEl = document.getElementById(id + '_timepicker_description') ||
//             document.getElementById(id + '_timepicker');

//   var d = (dEl && dEl.value || '').trim();
//   var t = (tEl && tEl.value || '').trim();

//   return t ? (d ? (d + ' ' + t) : t) : d;
// }

//
//
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
function updatesOnChange(o, evt) {
  var id = o.id;
  var type = o.type;

  // Keep PP validators in sync: copy composite (date [+ time]) into the backing field
  if (type === 'date' || type === 'time') {
    var back = document.getElementById(id);
    if (back) {
      var v = getCompositeDateTimeValue(id);
      if (back.value !== v) back.value = v;
    }
  }

  // NEW: per-field reentrancy guard (coalesce bursts: keyup+input+change etc.)
  updatesOnChange._busy = updatesOnChange._busy || {};
  if (updatesOnChange._busy[id]) return;
  updatesOnChange._busy[id] = true;

  try {
    if (typeof removeDuplicateInlineErrors === 'function') {
      removeDuplicateInlineErrors(id);
    }

    // find all validators attached to this logical field (PP defaults + custom)
    var targets = [id];
    if (type === 'date') {
      targets.push(id + '_datepicker_description', id + '_datepicker');
    }
    if (type === 'lookup') {
      targets.push(id + '_name', id + '_value', id + '_entityname', id + '_text');
    }
    if (type === 'file') {
      targets.push(id + '_input_file');
    }
    if (type === 'time') {
      targets.push(id + '_timepicker_description', id + '_timepicker');
    }

    var matching = Page_Validators
      .map(function (v, i) { return { v: v, i: i }; })
      .filter(function (e) { return targets.indexOf(e.v.controltovalidate) !== -1; });

    if (matching.length === 0) {
      matching = Page_Validators
        .map(function (v, i) { return { v: v, i: i }; })
        .filter(function (e) { return e.v.controltovalidate === id; });
    }

    if (matching.length === 0) return;

    var anyValidityChanged = false;

    matching.forEach(function (pair) {
      var v = pair.v;
      var was = !!v.isvalid;
      try {
        if (typeof window.ValidatorValidate === "function") {
          window.ValidatorValidate(v);
        } else if (typeof v.evaluationfunction === "function") {
          v.isvalid = !!v.evaluationfunction(v);
        } else if (typeof v.clientvalidationfunction === "string" &&
          typeof window[v.clientvalidationfunction] === "function") {
          v.isvalid = !!window[v.clientvalidationfunction](v);
        }
      } catch (e) { /* ignore */ }
      if (was !== !!v.isvalid) anyValidityChanged = true;
    });

 // global page validity refresh
    ValidatorUpdateIsValid();

    // If the field is invalid but nothing “changed” (e.g., duplicate state),
    // force a repaint so the inline error shows up during typing/clearing.
    if (!anyValidityChanged) {
      var currentlyInvalid = matching.some(function (pair) { return pair.v.isvalid === false; });
      var hasInline = $('#' + id + '_label').find("span[id='" + id + "_err']").length > 0;
      if (currentlyInvalid && !hasInline) {
        anyValidityChanged = true;
      }
    }
    // If all validators for this field are now valid → clear its inline UI.
    var allValidForField = matching.every(function (pair) { return pair.v.isvalid !== false; });
    if (allValidForField) {
      clearFieldErrorUI(id, type);
    }

    // Re-fire a bubbling change only for real user actions (keeps PP logic in sync)
    if (evt && evt.isTrusted) {
      setTimeout(function () {
        var elId = id;

        if (type === "date") {
          elId = id + "_datepicker_description";

        } else if (type === "lookup") {
          var el = document.getElementById(id);
          elId = (el && el.tagName === "SELECT")
            ? id
            : (document.getElementById(id + "_name") ? id + "_name" : id);

        } else if (type === "time") {
          // Prefer the visible time textbox; time-only may reuse *_datepicker_description
          if (document.getElementById(id + "_timepicker_description")) {
            elId = id + "_timepicker_description";
          } else if (document.getElementById(id + "_timepicker")) {
            elId = id + "_timepicker";
          } else if (document.getElementById(id + "_datepicker_description")) {
            elId = id + "_datepicker_description";
          } else {
            // last resort: if this is a time-only group, don't poke the backer
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

    // Refresh the validation summary after this field’s validators run
    if (typeof window.globalEvaluationFunction === 'function') {
      window.globalEvaluationFunction();
    }

  } finally {
    updatesOnChange._busy[id] = false;
  }
}

// PRIVATE
//
// Adds and Removes change events. Added when the validators are enabled which is after the first submit.
//
function addChangeEvents(id, type) {
  const handler = updatesOnChange.bind(null, { id, type });
  const $f = getFocusableField(id, type);

  // Unhook EVERYTHING for our namespace before re-hooking (idempotent)
  $f.off('.vchg');
  $('#' + id).off('.vchg');
  $('#' + id + '_name').off('.vchg');
  $('#' + id + '_input_file').off('.vchg');

  const $dpTop = $f.closest('.datetimepicker');
  if ($dpTop.length) $dpTop.off('.vchg');
  $f.siblings('.input-group-addon, .add-on, .btn').off('.vchg');

  // Baseline (covers typing/paste/IME; perfect for text/number)
  // Only for non date/time
  if (type !== 'date' && type !== 'time') {
    $f.on('change.vchg input.vchg keyup.vchg paste.vchg blur.vchg', handler);
  }

  if (type === 'lookup') {
    const $sel  = $('#' + id);
    const $name = $('#' + id + '_name');
    if ($sel.length) {
      $sel.on('change.vchg', handler)
          .on('select2:select.vchg select2:unselect.vchg select2:clear.vchg', handler);
    }
    if ($name.length) {
      $name.on('change.vchg input.vchg keyup.vchg paste.vchg blur.vchg autocompleteselect.vchg autocompletechange.vchg', handler);
    }
  }

  if (type === 'date' || type === 'time') {
    // Prefer the visible UI partners
    const $dateUI = $(`#${id}_datepicker_description, #${id}_datepicker`);
    const $timeUI = $(`#${id}_timepicker_description, #${id}_timepicker`);
    const $dp     = $dateUI.closest('.datetimepicker'); // PP date widget wrapper

    // 👇 detect time-only group once, up-front
    const isTimeOnlyGroup =
      $('#' + id).closest('.form-control-cell')
                 .find('.input-group[data-pp-time-only="1"]').length > 0;

    // Mirror both pieces (when present) into the single backing input
    const mirror = () => { $('#' + id).val(getCompositeDateTimeValue(id)); };

    // 1) Picker change → mirror → validate
    if ($dp.length) {
      $dp.off('.vchg').on('dp.change.vchg', function (e) {
        mirror(); handler(e);
      });
    }

    // 2) Typing / paste / clear / blur in either UI input → mirror → validate
    $dateUI.add($timeUI)
      .off('.vchg')
      .on('input.vchg keyup.vchg paste.vchg change.vchg blur.vchg compositionend.vchg', function (e) {
        mirror();
        // nudge PP's own "validate-on-change" logic just like your text boxes
        if (!isTimeOnlyGroup) { $('#' + id).trigger('change'); } // ❌ skip for time-only
        handler(e);
      });

    // 3) Also listen to the backing input in case PP fires there directly
    $('#' + id).off('.vchg').on('change.vchg input.vchg', handler);
  }


  // 4) Keep your programmatic setter patch (optional but harmless)
  (function patchValueSetter(el){
    try {
      if (!el || el.__emitOnSet) return;
      const proto = Object.getPrototypeOf(el) || HTMLInputElement.prototype;
      const desc  = Object.getOwnPropertyDescriptor(proto, 'value') ||
                    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (!desc || !desc.configurable) return;
      Object.defineProperty(el, 'value', {
        get: function(){ return desc.get.call(this); },
        set: function(v){
          const old = desc.get.call(this);
          desc.set.call(this, v);
          if (v !== old) {
            const ev = new Event('change', { bubbles: true });
            ev.synthetic = true;
            this.dispatchEvent(ev);
          }
        }
      });
      el.__emitOnSet = true;
    } catch(e) { /* no-op */ }
  })(document.getElementById(id));


  if (type === 'file') {
    const $fin = $('#' + id + '_input_file');
    $fin.off('.vchg')
      .on('change.vchg input.vchg', function (e) {
        queueFileValidation(id, type, e);
        // was: field.id (undefined) — use id
        window.FileStockSuppression && window.FileStockSuppression.register(id);
      });
  }
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

function addValidators(fields) {
    if (!fields || !Array.isArray(fields))
        return;

    // add a custom handler to the form submit to add the validators after the first submit
    // if there are no errors, navigation proceeds. if there are errors they must first be cleared.

    // The Page_Validators are is checked and not the fields array because validators may have been added or removed
  // dynamically.
  $('#NextButton').off('.bindV').on('click.bindV', e => {
    __validators_active = true;

    const seen = new Set();
    Page_Validators.forEach(v => {
      const id = v.controltovalidate;
      if (!id || seen.has(id)) return;

      // derive type if not present (helps dates)
      const type = v.type
        || ($('#' + id + '_timepicker_description').length ? 'time'
          : ($('#' + id + '_datepicker_description').length ? 'date' : ''));
      addChangeEvents(id, type);
      seen.add(id);
    });
    // Final pre-submit sweep: ensure all date/time backers have the composite value
    $('.form-control-cell .input-group.datetimepicker:not([data-pp-time-only="1"]) input[id$="_datepicker_description"]:not([data-pp-as-time="1"])').each(function () {
      var baseId = this.id.replace(/_(date|time)picker(?:_description)?$/, '');
      // mirror "date [+ time]" into the single backing input PP validates
      $('#' + baseId).val(getCompositeDateTimeValue(baseId));
      // run your pipeline once so inline UI + summary reflect final state
      updatesOnChange({ id: baseId, type: 'date' }, { isTrusted: true }); // 'date' is fine for datetime too
    });
  });

    // make summary div focusable
    var summary = $('#ValidationSummaryEntityFormView');
    if (!summary.attr('tabindex')) {
        summary.attr('tabindex', '-1');
    }


    fields.forEach(field => {
        var id = field.id;
        if (!id)
            return;

        var required = field.required || false;

        var type = field.type || "";

        // add accessibility modifications
        if (required)
            addAccessibilityMods(id);


        // add field validators
        field.validators.forEach(v => {
            _addValidator(id, type, v);
        });

    });

    // Add global validator last
    Page_Validators.push(createGlobalValidator());
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


// ---- Join a date-only + time-only into a hidden portal field ----------------
function wirePortalComposite(opts) {
  var dateId  = opts.dateId;   // e.g., 'ethi_nextcanadadateonly'
  var timeId  = opts.timeId;   // e.g., 'ethi_nextcanadatimeonly'
  var portalId= opts.portalId; // e.g., 'ethi_nextcanadadateandtimeportal'

  var $date = $('#' + dateId + '_datepicker_description');
  if (!$date.length) $date = $('#' + dateId + '_datepicker'); // fallback

  var $time = $('#' + timeId + '_timepicker_description');
  if (!$time.length) $time = $('#' + timeId + '_datepicker_description'); // fallback if not yet renamed

  var $portal = $('#' + portalId);
  if (!$portal.length) return; // nothing to do

  function normDate(s) {
    s = String(s||'').trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) { var dd=('0'+m2[1]).slice(-2), mm=('0'+m2[2]).slice(-2), yy=m2[3]; return yy+'-'+mm+'-'+dd; }
    return '';
  }
  function normTime(s) {
    if (typeof normalizeTime === 'function') return normalizeTime(String(s||''));
    s = String(s||'').trim();
    var m = s.match(/^\s*(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])?\s*$/);
    if (m) { var h=parseInt(m[1],10), mm=m[2]; if (m[3]) { var pm=/p/i.test(m[3]); h=(h%12)+(pm?12:0); } return ('0'+h).slice(-2)+':'+mm; }
    var m2 = s.match(/^\s*([01]?\d|2[0-3])\s*[hH]\s*([0-5]\d)\s*$/);
    if (m2) return ('0'+m2[1]).slice(-2)+':'+m2[2];
    return '';
  }
  function recompute() {
    var d = normDate($date.val());
    var t = normTime($time.val());
    var v = (d && t) ? (d + ' ' + t) : '';     // only populate when both parts exist
    if ($portal.val() !== v) $portal.val(v);
  }

  // Initial + live updates
  recompute();
  $date.off('.portalJoin').on('input.portalJoin change.portalJoin blur.portalJoin', recompute);
  $time.off('.portalJoin').on('input.portalJoin change.portalJoin blur.portalJoin', recompute);

  // Submit-capture: ensure final value is set before validators/post
  try {
    var formEl = $portal.closest('form').get(0) || $date.closest('form').get(0) || $time.closest('form').get(0);
    if (formEl && !formEl['_ppPortalJoin_' + portalId]) {
      formEl.addEventListener('submit', function(){ recompute(); }, true);
      formEl['_ppPortalJoin_' + portalId] = true;
    }
  } catch(_) {}
}

