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
// PRIVATE
// function globalEvaluationFunction() {
//   // 1) Clear older inline messages
//   for (var i = 0; i < Page_Validators.length; i++) {
//     var v0 = Page_Validators[i];
//     var id0 = String(v0.controltovalidate || '');
//     $('#'+id0+'_label > span[id='+id0+'_err]').remove();
//     $('#'+id0+'_label > br').remove();
//   }

//   // 2) Collect invalid validators → de-dupe by logical field
//   var seen = Object.create(null);
//   var items = []; // { id, type, msg }

//   for (var j = 0; j < Page_Validators.length - 1; j++) { // skip our global
//     var v = Page_Validators[j];
//     if (v.isvalid !== false) continue;

//     var id = String(v.controltovalidate || '');

//     // Ignore PP's hidden file validators (both ..._hidden_* and ...hidden_*)
//     if (/_hidden_(filename|filetype)$/.test(id) || /(hidden_)(filename|filetype)$/.test(id))
//       continue;

//     // Normalize to the base (logical) field id (strip partner suffixes)
//     var base = id.replace(/(_datepicker(_description)?|_timepicker(_description)?|_name|_value|_entityname|_text|_input_file)$/,'');
//     if (seen[base]) continue;   // keep ONE reason per field
//     seen[base] = true;

//     var link = $(v.errormessage);
//     var text = link.text();
//     var msg  = (currentLang === 'en'
//       ? 'Error '  + (items.length+1) + ': ' + text
//       : 'Erreur ' + (items.length+1) + ' : ' + text);

//    var inferredType = v.type || (
//   document.getElementById(base + '_datepicker_description') || document.getElementById(base + '_datepicker') ? 'date' :
//   document.getElementById(base + '_timepicker_description') || document.getElementById(base + '_timepicker') ? 'time' :
//   ($('#' + base).is('select') ? 'lookup' : '')
// );
// items.push({ id: base, type: inferredType, msg: msg });
//   }

//   // 3) Repaint inline (single message per field)
//   for (var k = 0; k < items.length; k++) {
//     updateLabelErrorMessage(items[k].id, items[k].type, items[k].msg);
//   }

//   // // 4) Rebuild the summary list to exactly match the de-duped items
//   // if (items.length > 0) {
//   //   setTimeout(function () {
//   //     var focused = $(':focus');
//   //     var $sum = $('#ValidationSummaryEntityFormView');
//   //     var $ul  = $sum.find('> ul');

//   //     $ul.empty();
//   //     items.forEach(function (it) {
//   //       var $a = $('<a/>', {
//   //         href: '#' + it.id + '_label',
//   //         onclick: 'javascript:scrollToAndFocus("' + it.id + '_label","' + it.id + '"); return false;',
//   //         text: it.msg
//   //       });
//   //       $ul.append($('<li/>').append($a));
//   //     });

//   //     var n = items.length;
//   //     $sum.find('> h2').text(
//   //       currentLang === 'en'
//   //         ? 'The form could not be submitted because ' + n + ' error' + (n > 1 ? 's were found' : ' was found')
//   //         : "Le formulaire n'a pu être soumis car " + n + ' erreur' + (n > 1 ? "s ont été trouvées." : " a été trouvée.")
//   //     );

//   //     $sum.find('a').css('text-decoration', 'underline');
//   //     $sum.blur().show();
//   //     focused.focus();
//   //   }, 250);

//   // 4) Rebuild the summary list to exactly match the de-duped items
// setTimeout(function () {
//   var focused = $(':focus');
//   var $sum = $('#ValidationSummaryEntityFormView');
//   var $ul  = $sum.find('> ul');

//   // Always clear current list
//   $ul.empty();

//   if (items.length === 0) {
//     // No errors → hide the summary and clear heading
//     $sum.find('> h2').text('');
//     $sum.hide();
//     try { focused.focus(); } catch(e) {}
//     return;
//   }

//   // Repopulate with current errors
//   items.forEach(function (it) {
//     var $a = $('<a/>', {
//       href: '#' + it.id + '_label',
//       onclick: 'javascript:scrollToAndFocus("' + it.id + '_label","' + it.id + '"); return false;',
//       text: it.msg
//     });
//     $ul.append($('<li/>').append($a));
//   });

//   var n = items.length;
//   $sum.find('> h2').text(
//     currentLang === 'en'
//       ? 'The form could not be submitted because ' + n + ' error' + (n > 1 ? 's were found' : ' was found')
//       : "Le formulaire n'a pu être soumis car " + n + ' erreur' + (n > 1 ? "s ont été trouvées." : " a été trouvée.")
//   );

//   $sum.find('a').css('text-decoration', 'underline');
//   $sum.blur().show();
//   try { focused.focus(); } catch(e) {}
// }, 250);

//   }

//   return true;

function globalEvaluationFunction() {
  // Re-entrancy guard: prevent tight loops when renderer indirectly retriggers validation
  if (globalEvaluationFunction._busy) return true;
  globalEvaluationFunction._busy = true;
  
  // Clear guard on next tick (after synchronous execution completes)
  setTimeout(function() {
    globalEvaluationFunction._busy = false;
  }, 0);

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

  // 3) Repaint inline (single message per field)
  for (var k = 0; k < items.length; k++) {
    updateLabelErrorMessage(items[k].id, items[k].type, items[k].msg);
  }

  // 4) Rebuild the summary list to exactly match the de-duped items
  setTimeout(function () {
    var focused = $(':focus');
    var $sum = $('#ValidationSummaryEntityFormView');
    var $ul = $sum.find('> ul');

    // Always clear current list
    $ul.empty();

    if (items.length === 0) {
      // No errors → hide the summary and clear heading
      $sum.find('> h2').text('');
      $sum.hide();
      try { focused.focus(); } catch (e) {}
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

    var n = items.length;
    $sum.find('> h2').text(
      currentLang === 'en'
        ? 'The form could not be submitted because ' + n + ' error' + (n > 1 ? 's were found' : ' was found')
        : "Le formulaire n'a pu être soumis car " + n + ' erreur' + (n > 1 ? "s ont été trouvées." : " a été trouvée.")
    );

    $sum.find('a').css('text-decoration', 'underline');
    $sum.blur().show();
    try { focused.focus(); } catch (e) {}
  }, 250);

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

    // detect time-only group once, up-front
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
        if (!isTimeOnlyGroup) { $('#' + id).trigger('change'); } //  skip for time-only
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
    window.__validators_active = true;  // Expose globally for delete handler

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

    // Delegated click handler for file delete buttons
    // Revalidates file fields immediately after delete (post-first-submit)
    $(document).off('click.fileDelete').on('click.fileDelete', 'button[id$="_delete_button"]', function() {
        // Derive baseId from button id (strip _delete_button suffix)
        var buttonId = this.id || '';
        var baseId = buttonId.replace(/_delete_button$/, '');
        if (!baseId) return;

        // Run after deleteFile(...) updates the DOM/hidden fields
        setTimeout(function() {
            // Revalidate the file field
            queueFileValidation(baseId, 'file', { isTrusted: true });

            // If validators have been activated (after first submit), refresh summary
            if (window.__validators_active && typeof globalEvaluationFunction === 'function') {
                globalEvaluationFunction();
            }
        }, 0);
    });
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

// Date field enhancer – Power Pages picker (no WET, no native picker)
(function ($) {
  $(function () {
    var sel = '.form-control-cell .input-group.datetimepicker input[id$="_datepicker_description"]';

    $(sel).each(function () {
      var $ui    = $(this);                                // visible input
      var baseId = this.id.replace(/_datepicker_description$/, '');
      var $back  = $('#' + baseId);                        // backing input

      // Keep backing input for submit; hide from AT/tab
      $back.attr({ 'aria-hidden': 'true', 'tabindex': '-1' });

      // Mirror 'required' to the visible control for AT
      if ($back.prop('required')) $ui.attr('required', 'required');

      // We rely on the PP datepicker; keep TEXT input (no native icon)
      $ui.attr({
        type: 'text',
        inputmode: 'numeric',
        pattern: '\\d{4}-\\d{2}-\\d{2}',
        lang: (document.documentElement.lang || 'en').toLowerCase()
      });
      $ui[0].removeAttribute('placeholder');

      // Keep backing value in sync as user types/picks
      $ui.off('.datex').on('input.datex change.datex', function () {
        $back.val(this.value);
      });

      // Bilingual, keyboardable outer icon — DO NOT override its click
      var $btn = $ui.closest('.input-group.datetimepicker')
                    .find('.input-group-addon,[role="button"]').first();

      if ($btn.length) {
        var lang  = (document.documentElement.lang || 'en').toLowerCase();
        var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';

        // Clean ARIA (we don’t open our own popup; PP does)
        $btn.attr({ title: label, 'aria-label': label, 'aria-haspopup': 'false', tabindex: '0' })
            .removeAttr('aria-controls aria-expanded')
            .off('.datex') // unbind anything we added earlier
            .on('keydown.datex', function (ev) {
              if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); $(this).trigger('click'); }
            });
        // IMPORTANT: no .on('click', ...) here — let PP’s own handler open the picker
      }
    });

    // If <html lang> flips without reload, relabel the button/input
    var mo = new MutationObserver(function () {
      var lang  = (document.documentElement.lang || 'en').toLowerCase();
      var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
      $(sel).attr('lang', lang);
      $('.form-control-cell .input-group.datetimepicker [role="button"]').attr({ title: label, 'aria-label': label });
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // Defensive: if anything re-adds a placeholder, strip it again
    $(document).on('input change focus blur', sel, function () { this.removeAttribute('placeholder'); });
  });
})(window.jQuery || window.$);

// Inside-input calendar icon (PP datepicker) — native-like look
(function ($) {
  $(function () {
    // Target all PP date/datetime visible groups
    $('.form-control-cell .input-group.datetimepicker').each(function () {
      var $grp = $(this);
      var $btn = $grp.find('.input-group-addon.btn,[role="button"]').first();
      var $input = $grp.find('input[id$="_datepicker_description"], input[id$="_datepicker"]');

      if (!$btn.length || !$input.length) return;

      // 1) Make this group use the inside-icon layout you already styled in custom.css
      $grp.addClass('pp-inside');

      // 2) Bilingual label for AT
      var lang  = (document.documentElement.lang || 'en').toLowerCase();
      var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
      $btn.attr({ 'aria-label': label, title: label, 'aria-haspopup': 'false' })
          .removeAttr('aria-controls aria-expanded');

      // 3) Replace PP's icon markup with a native-like inline SVG
      var svg =
        '<svg class="pp-cal" aria-hidden="true" focusable="false" ' +
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="4.5" width="18" height="16.5" rx="2" ry="2"></rect>' +
          '<line x1="16" y1="2.5" x2="16" y2="6"></line>' +
          '<line x1="8"  y1="2.5" x2="8"  y2="6"></line>' +
          '<line x1="3"  y1="9"   x2="21" y2="9"></line>' +
        '</svg>';

      // remove any existing <span class="fa ..."> or .icon-calendar
      $btn.find('.fa, .icon-calendar').remove();
      $btn.append(svg);
    });

    // If <html lang> flips dynamically, relabel the icon
    var mo = new MutationObserver(function () {
      var lang  = (document.documentElement.lang || 'en').toLowerCase();
      var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
      $('.form-control-cell .input-group.datetimepicker.pp-inside .input-group-addon.btn')
        .attr({ 'aria-label': label, title: label });
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})(window.jQuery || window.$);

// --- Pre-submit mirror for PP date/time (runs BEFORE PP validators) ---
(function(){
  var form = document.querySelector('form');
  if (!form || form.__ppPreflightHooked) return;
  form.__ppPreflightHooked = true;

  // Capture phase so this runs before PP's bubble-phase validators
  form.addEventListener('submit', function () {
    // mirror visible → backing
    $('.input-group.datetimepicker input[id$="_datepicker_description"], \
    .input-group.datetimepicker input[id$="_timepicker_description"], \
    .input-group.pp-inside     input[id$="_timepicker_description"], \
    .input-group.pp-inside     input[id$="_datepicker_description"]').each(function () {
      var baseId = this.id.replace(/_(date|time)picker(?:_description)?$/, '');
      $('#' + baseId).val(getCompositeDateTimeValue(baseId));
    });
  }, true);

})();

/* ============================================
   Public helper: disable PP DateFormat validators (hardened)
   ============================================ */
(function (w, $) {
  'use strict';

  var SUFFIX_RE = /(_datepicker(_description)?|_timepicker(_description)?|_name|_value|_entityname|_text|_input_file)$/i;

  function toBaseId(s) { return String(s || '').replace(SUFFIX_RE, ''); }
  function normalizeBases(bases) {
    var arr = Array.isArray(bases) ? bases : [bases];
    var seen = Object.create(null), out = [];
    for (var i = 0; i < arr.length; i++) {
      var b = toBaseId(arr[i]);
      if (b && !seen[b]) { seen[b] = 1; out.push(b); }
    }
    return out;
  }

  function doDisable(targets, opts) {
    var changed = 0;
    var validators = w.Page_Validators || [];
    for (var i = 0; i < validators.length; i++) {
      var v = validators[i];
      if (!v || !v.id) continue;
      if (!/^DateFormatValidator/i.test(String(v.id))) continue;

      var baseCtl = toBaseId(v.controltovalidate);
      var baseId  = String(v.id).replace(/^DateFormatValidator/i, '');

      if (targets.indexOf(baseCtl) === -1 && targets.indexOf(baseId) === -1) continue;

      v.enabled = false;
      v.isvalid = true;
      v.evaluationfunction = function () { return true; };

      var el = document.getElementById(String(v.id));
      if (el) el.style.display = 'none';

      if (typeof w.ValidatorUpdateDisplay === 'function') {
        try { w.ValidatorUpdateDisplay(v); } catch (_) {}
      }
      changed++;
    }

    // Hide any orphaned spans PP might have emitted
    targets.forEach(function (b) {
      ['DateFormatValidator' + b,
       'DateFormatValidator' + b + '_datepicker_description',
       'DateFormatValidator' + b + '_timepicker_description'
      ].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.style.display = 'none';
      });
    });

    // Ensure browser HTML5 constraint validation never blocks our submit
    try { $('form').attr('novalidate', 'novalidate'); } catch (_) {}

    if (opts.repaint) {
      try { targets.forEach(function (b){ if (typeof clearFieldErrorUI === 'function') clearFieldErrorUI(b, 'date'); }); } catch(_){}
      try { if (typeof w.ValidatorUpdateIsValid === 'function') w.ValidatorUpdateIsValid(); } catch(_){}
      try { if (typeof w.globalEvaluationFunction === 'function') w.globalEvaluationFunction(); } catch(_){}
    }
    if (opts.verbose && changed) console.debug('[pp-datefmt] disabled for:', targets.join(', '), '(count=' + changed + ')');
    return changed;
  }

  w.disablePPDateFormatFor = function (bases, options) {
    var opts = Object.assign({
      onSubmit: true,
      submitSelector: '.btn.next, #NextButton, button[type=submit], input[type=submit]',
      wrapPageClientValidate: false,
      repaint: false,
      verbose: false
    }, options || {});

    var targets = normalizeBases(bases);
    if (!targets.length) {
      console.warn('[pp-datefmt] No base ids provided.');
      return function(){};
    }

    // Run now + after DOM ready (in case called too early)
    doDisable(targets, opts);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ doDisable(targets, opts); }, { once: true });
    }

    // Re-apply on partial postbacks (UpdatePanel)
    try {
      if (w.Sys && w.Sys.WebForms && w.Sys.WebForms.PageRequestManager) {
        var prm = w.Sys.WebForms.PageRequestManager.getInstance();
        if (!prm._ppDatefmtHooked) {
          prm.add_endRequest(function () { doDisable(targets, opts); });
          prm._ppDatefmtHooked = true;
        }
      }
    } catch (_) {}

    // Re-apply right before visible submits
    try {
      $(document)
        .off('.ppDatefmt')
        .on('click.ppDatefmt', opts.submitSelector, function () { doDisable(targets, opts); });
    } catch (_) {}

    // Re-apply for programmatic submits (Page_ClientValidate())
    if (opts.wrapPageClientValidate && typeof w.Page_ClientValidate === 'function' && !w._ppDatefmtWrapped) {
      var orig = w.Page_ClientValidate;
      w.Page_ClientValidate = function () {
        doDisable(targets, opts);
        return orig.apply(this, arguments);
      };
      w._ppDatefmtWrapped = true;
    }

    return function rerun(){ return doDisable(targets, opts); };
  };
})(window, window.jQuery || window.$);


// ---- shared helpers ----
function _ppVisFor(baseId, kind /* 'date' | 'time' */) {
  // Power Pages uses *_datepicker_description for date/datetime; some builds add *_timepicker_description.
  if (kind === 'time') {
    const $t = $('#' + baseId + '_timepicker_description');
    if ($t.length) return $t;
    const $t2 = $('#' + baseId + '_timepicker');
    if ($t2.length) return $t2;
  }
  return $('#' + baseId + '_datepicker_description'); // fallback (common in datetime)
}
function _syncVisibleToBack($vis, $orig) {
  const v = String($vis.val() || '').trim();
  $orig.val(v).trigger('change'); // keep PP listeners in the loop
}
function _hideBacking($orig) {
  $orig.addClass('wb-inv').attr({ 'aria-hidden':'true', 'tabindex':'-1' });
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

// validations.js — REPLACE your existing patchDate with this
function patchDate(baseId) {
  var $back = $('#' + baseId);
  if (!$back.length) return;

  // Find the PP visible group for this backing input
  var $cell = $back.closest('.form-control-cell');
  var $grp  = $cell.find('.input-group.datetimepicker, .input-group.pp-inside').first();
  if (!$grp.length) return;

  // Never touch time-only groups
  if ($grp.is('[data-pp-time-only="1"]')) return;

  // Resolve the visible date input
  var $vis = $('#' + baseId + '_datepicker_description, #' + baseId + '_datepicker')
              .filter(':input').first();
  if (!$vis.length) return;

  // Keep TEXT (not native date) so we don't get a second native icon/UI
  try { $vis.attr('type', 'text'); } catch (e) {}
  $vis.addClass('form-control')
      .attr({
        inputmode: 'numeric',
        pattern: '\\d{4}-\\d{2}-\\d{2}',
        'data-pp-as-date': '1'
      })
      // strip PP/WET date wiring on the visible input — PP's addon/button handles the UI
      .removeAttr('data-ui data-type data-date-format placeholder');

  // Use the inside-icon layout
  $grp.addClass('pp-inside');

  // (1) If WET injected its own opener button, remove it (we want ONLY the PP addon)
  $grp.children('button.btn:not(.input-group-addon)').remove();

  // (2) De-dupe addon buttons (keep first -> one tab stop, one icon)
  var $addons = $grp.find('.input-group-addon.btn, [role="button"]');
  if ($addons.length > 1) { $addons.slice(1).remove(); }
  var $btn = $grp.find('.input-group-addon.btn, [role="button"]').first();
  if (!$btn.length) return;

  // (3) Accessible label (bilingual)
  var lang  = (document.documentElement.lang || 'en').toLowerCase();
  var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
  $btn.attr({ 'aria-label': label, title: label, 'aria-haspopup': 'false', tabindex: '0' })
      .removeAttr('aria-controls aria-expanded');

  // (4) Single calendar glyph (remove any legacy icons first)
  $btn.find('.pp-cal, .fa, .icon-calendar, svg').remove();
  $btn.append(
    '<svg class="pp-cal" aria-hidden="true" focusable="false" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="4.5" width="18" height="16.5" rx="2" ry="2"></rect>' +
      '<line x1="16" y1="2.5" x2="16" y2="6"></line>' +
      '<line x1="8"  y1="2.5" x2="8"  y2="6"></line>' +
      '<line x1="3"  y1="9"   x2="21" y2="9"></line>' +
    '</svg>'
  );
}

// validations.js — add once
(function($){
  $(function(){
    $('.form-control-cell .input-group.datetimepicker.pp-inside:not([data-pp-time-only="1"])').each(function(){
      var $grp = $(this);
      // Remove any non-addon WET buttons that create a second tab stop/icon
      $grp.children('button.btn:not(.input-group-addon)').remove();
      // Ensure a single addon button
      var $addons = $grp.find('.input-group-addon.btn, [role="button"]');
      if ($addons.length > 1) { $addons.slice(1).remove(); }
    });
  });
})(window.jQuery || window.$);

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
      $g.find('.input-group-addon.btn,[role="button"]').attr({ 'aria-label': label, title: label });
    });
}

// call once on load; call again after you patch fields or PP redraws
$(function(){
  refreshDateTimeAddonLabels(document);
});

// --- Time-only hardening for PP datetime group (no calendar) -----------------
(function ($, w) {
  'use strict';

  // Open the native time picker if available, otherwise just focus the input.
  function openTimePicker($input) {
    var el = $input && $input[0];
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();     // Chrome/Edge
      } else {
        el.focus();          // fallback
      }
    } catch (e) {
      el.focus();
    }
  }

  // Make a PP datetime group behave as "time-only"
  function hardenTimeOnly(baseId) {
    var $back = $('#' + baseId); // backing input
    if (!$back.length) return;

    // Find the PP visible group for this backing input
    var $grp = $back
      .closest('.control')
      .find('.input-group.datetimepicker, .input-group.pp-inside')
      .first();

    if (!$grp.length) return;

    // Mark and label the group as time-only
    $grp.attr('data-pp-time-only', '1');

    var fr    = (document.documentElement.lang || 'en').toLowerCase().startsWith('fr');
    var label = fr ? 'Choisir une heure' : 'Choose a time';

    var $btn   = $grp.find('.input-group-addon.btn,[role="button"]').first();
    var $tVis  = $grp.find('#' + baseId + '_timepicker_description, #' + baseId + '_timepicker, input[type="time"]').first();
    var $dVis  = $grp.find('#' + baseId + '_datepicker_description, #' + baseId + '_datepicker').first();

    // Ensure the visible "date" input is TEXT so setSelectionRange issues never occur
    if ($dVis.length && $dVis.attr('type') !== 'text') {
      $dVis.attr('type', 'text'); // our date enhancer wants text, not native date
    }

    // If we don't have a time-visible partner yet, fall back to the backing input
    if (!$tVis.length) $tVis = $back;

    // 1) Kill PP’s calendar for this group only (if already initialized)
    try {
      var dp = $grp.data('DateTimePicker');
      if (dp && typeof dp.destroy === 'function') {
        dp.destroy();
      }
    } catch (e) { /* no-op */ }

    // Also destroy if it was bound on the input itself
    try {
      var dp2 = $dVis.data && $dVis.data('DateTimePicker');
      if (dp2 && typeof dp2.destroy === 'function') {
        dp2.destroy();
      }
    } catch (e) { /* no-op */ }

    // 2) Guard against PP re-binding or bubbling dp.* events later
    $grp.off('.pp-timeonly'); // our namespace
    $grp.on('dp.show.pp-timeonly dp.change.pp-timeonly dp.error.pp-timeonly dp.hide.pp-timeonly', function (e) {
      e.stopImmediatePropagation();
      return false;
    });

    // 3) Make the “calendar” button behave like a time button
    if ($btn.length) {
      $btn.attr({
        title: label,
        'aria-label': label,
        'aria-haspopup': 'false'
      })
      .removeAttr('aria-controls aria-expanded')
      .off('.pp-timeonly')
      .on('click.pp-timeonly', function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        var $native = $('#' + baseId + '_nativeTime');
        openTimePicker($native.length ? $native : $tVis);
      })
      .on('keydown.pp-timeonly', function (ev) {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          ev.stopImmediatePropagation();
         var $native = $('#' + baseId + '_nativeTime');
         openTimePicker($native.length ? $native : $tVis);
        }
      });

      // Optional: swap the calendar SVG to a clock glyph for clarity
      $btn.find('.fa, .icon-calendar, .pp-cal').remove();
      if ($btn.find('.pp-clock').length === 0) {
        $btn.append(
          '<svg class="pp-clock" aria-hidden="true" focusable="false" ' +
          'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" ' +
          'fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="9"></circle>' +
          '<polyline points="12,7 12,12 16,14"></polyline>' +
          '</svg>'
        );
      }
    }
    // Optional: if some script re-injects the calendar later, auto-purge it
    try {
      const btnNode = $btn.get(0);
      const mo = new MutationObserver(() => { $btn.find('.pp-cal').remove(); });
      mo.observe(btnNode, { childList: true, subtree: true });
    } catch { }


    // 4) Do NOT auto-open from the visible text input; allow typing freely
    if ($dVis.length) {
      $dVis.off('.pp-timeonly')            // remove prior focus/click handlers
        .attr('aria-label', label);     // keep the label for AT
    }
  }

  // Wrap existing patchTime so we don’t have to touch its internals
  (function wrapPatchTime() {
    var orig = w.patchTime;
    w.patchTime = function (baseId) {
      if (typeof orig === 'function') { orig(baseId); }
      // then harden to truly time-only
      hardenTimeOnly(baseId);
      if (typeof w.ensureTimeAddonWorks === 'function') {
       w.ensureTimeAddonWorks(baseId);
      }
    };
  })();

  // Safety net: if a page marks a group as time-only without calling patchTime,

$(document)
  .off('.pp-timeonly-global')
  .on('dp.show.pp-timeonly-global dp.change.pp-timeonly-global dp.error.pp-timeonly-global dp.hide.pp-timeonly-global',
    '.input-group[data-pp-time-only="1"]',
    function (e) { e.stopImmediatePropagation(); return false; })
  .on('click.pp-timeonly-global',
     '.input-group[data-pp-time-only="1"] .input-group-addon.btn, .input-group[data-pp-time-only="1"] [role="button"]',
     function (ev) {
       ev.preventDefault(); ev.stopImmediatePropagation();
       var $grp  = $(this).closest('.input-group');
       var $time = $grp.find('input[id$="_timepicker_description"], input[id$="_timepicker"], input[type="time"]').first();
       if ($time.length) openTimePicker($time);
     })
  .on('keydown.pp-timeonly-global',
     '.input-group[data-pp-time-only="1"] .input-group-addon.btn, .input-group[data-pp-time-only="1"] [role="button"]',
     function (ev) {
       // Only activate on Enter/Space — allow Tab to move focus out
       if (ev.key !== 'Enter' && ev.key !== ' ') return;
       ev.preventDefault(); ev.stopImmediatePropagation();
       var $grp  = $(this).closest('.input-group');
       var $time = $grp.find('input[id$="_timepicker_description"], input[id$="_timepicker"], input[type="time"]').first();
       if ($time.length) openTimePicker($time);
     });


})(window.jQuery || window.$, window);

// --- helper: ensure a true time partner exists and is used -------------------
function _ensureTimePartner(baseId, $group) {
  // Prefer an existing *_timepicker_description
  var $vis = $('#' + baseId + '_timepicker_description');
  if ($vis.length) return $vis;

  // If the visible partner is still *_datepicker_description, replace it with a time partner
  var $dateVis = $('#' + baseId + '_datepicker_description');
  if ($dateVis.length) {
    // Build a fresh input (don’t clone attributes like the date pattern)
    var cls = ($dateVis.attr('class') || '').trim();
    var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    $vis = $('<input type="text"/>')
      .attr('id', baseId + '_timepicker_description')
      .attr('lang', lang)
      .addClass(cls || 'form-control input-text-box');

    // Keep current value if it looks like time; otherwise clear
    var v = String($dateVis.val() || '').trim();
    try {
      var nv = (typeof normalizeTime === 'function') ? normalizeTime(v) : v;
      if (/^\d{1,2}:[0-5]\d/.test(nv)) $vis.val(nv);
    } catch (_) {}

    $dateVis.after($vis);
    $dateVis.remove();

    // Point the label at the new input
    $('#' + baseId + '_label').attr('for', baseId + '_timepicker_description');
    return $vis;
  }

  // Last resort: create one at the start of the group
  $vis = $('<input type="text" class="form-control input-text-box"/>')
           .attr('id', baseId + '_timepicker_description');
  if ($group && $group.length) $group.prepend($vis);
  $('#' + baseId + '_label').attr('for', baseId + '_timepicker_description');
  return $vis;
}

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


// ensureTimeAddonWorks(baseId)
function ensureTimeAddonWorks(baseId) {
  const lang  = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  const isFr  = lang.startsWith('fr');
  const label = isFr ? "Choisir l’heure" : "Choose a time";

  const $back  = $('#' + baseId);
  if (!$back.length) return;

  const $cell = $back.closest('.form-control-cell');
  const $group = $cell.find('.input-group.pp-inside, .input-group.datetimepicker').first();
  if (!$group.length) return;
  // Ensure only one focusable addon in the group (avoid two tab stops)
  var $addons = $group.find('.input-group-addon.btn, [role="button"]');
  if ($addons.length > 1) { $addons.slice(1).remove(); }

  // Layout + mark time-only
  $group.addClass('pp-inside').attr('data-pp-time-only','1').removeClass('datetimepicker').off('.timeonly-local');
  $group.on('dp.show.timeonly-local dp.change.timeonly-local dp.error.timeonly-local dp.hide.timeonly-local',
    function (e) { e.stopImmediatePropagation(); return false; });

  // Ensure PP DateFormat validator does not run for this base (quietly)
  if (typeof disablePPDateFormatFor === 'function') {
    try { disablePPDateFormatFor(baseId, { repaint: true }); } catch (_) {}
  }

  // Get/ensure the visible TIME partner (rename away from *_datepicker_description)
  var $vis = _ensureTimePartner(baseId, $group);

  // Backing input is submit source only
  $back.addClass('wb-inv').attr({ 'aria-hidden':'true', tabindex: -1 });

  // Make the visible input truly "time" (accept EN/FR + 12h/24h); guard against re-clobbering
  const timePattern =
    '(?:([01]?\\d|2[0-3]):[0-5]\\d(?:[:][0-5]\\d)?)' +               // 24h HH:MM[:SS]
    '|(?:0?[1-9]|1[0-2]):[0-5]\\d(?:[:][0-5]\\d)?\\s*(?:[AaPp][Mm])' + // 12h h:MM[:SS] AM/PM
    '|(?:([01]?\\d|2[0-3])\\s*[hH]\\s*[0-5]\\d)';                    // FR HH h MM

  $vis.attr({
    'data-pp-as-time': '1',
    'aria-label': label,
    inputmode: 'numeric',
    pattern: timePattern,
    autocomplete: 'off'
  }).removeAttr('data-ui data-type data-date-format placeholder');

  try {
    const visEl = $vis.get(0);
    if (!visEl._ppTimePatternMo) {
      const mo = new MutationObserver(() => {
        if ($vis.attr('pattern') !== timePattern) $vis.attr('pattern', timePattern);
        if ($vis.attr('data-ui'))          $vis.removeAttr('data-ui');
        if ($vis.attr('data-type'))        $vis.removeAttr('data-type');
        if ($vis.attr('data-date-format')) $vis.removeAttr('data-date-format');
      });
      mo.observe(visEl, { attributes: true, attributeFilter: ['pattern','data-ui','data-type','data-date-format'] });
      visEl._ppTimePatternMo = mo;
    }
  } catch {}

  //  Step C (init): keep UI quiet on initial render (no red frame)
  _ppMarkRequired(baseId, !!($vis.val() && String($vis.val()).trim()), { deferError: true });

  // Replace the addon icon → a single clock; keep focus behavior
  let $addon = $group.find('.input-group-addon.btn, [role="button"]').first();
  if ($addon.length) {
    $addon.attr({ title: label, 'aria-label': label, 'aria-haspopup': 'false', type:'button', tabindex: 0, 'data-wet4-time-btn': '1' })
          .removeAttr('aria-controls aria-expanded');
    $addon.find('.pp-cal, .fa, .icon-calendar, svg').remove();
    $addon.append(
      '<svg class="pp-clock" aria-hidden="true" focusable="false" ' +
      'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" ' +
      'fill="none" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<polyline points="12,7 12,12 16,14"></polyline>' +
      '</svg>'
    );
    $addon.off('mousedown.timeonly-focus').on('mousedown.timeonly-focus', function(){ /* allow focus */ });
  } else {
    // If there was no addon (unlikely), create one
    $addon = $('<button type="button" class="input-group-addon btn" data-wet4-time-btn="1" />')
      .attr({ title: label, 'aria-label': label, 'aria-haspopup': 'false', tabindex: 0 })
      .html(
        '<svg class="pp-clock" aria-hidden="true" focusable="false" ' +
        'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" ' +
        'fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="9"></circle>' +
          '<polyline points="12,7 12,12 16,14"></polyline>' +
        '</svg>'
      );
    $group.append($addon);
  }

  // Create/attach a hidden native <input type="time"> for showPicker()
  let $native = $('#' + baseId + '_nativeTime');
  if (!$native.length) {
    $native = $('<input type="time" class="wb-inv" step="60" autocomplete="off">')
      .attr({ id: baseId + '_nativeTime', 'aria-hidden':'true', tabindex: -1 })
      .insertAfter($vis);
  }

  // stickiness cache
  let lastTime = (typeof normalizeTime === 'function')
    ? normalizeTime(String($vis.val() || ''))
    : String($vis.val() || '').trim();

  // Native → visible/backing
  $native.off('.timeonly-native').on('change.timeonly-native input.timeonly-native', function () {
    const raw = this.value ? this.value.slice(0, 5) : '';
    const v = (typeof normalizeTime === 'function') ? normalizeTime(raw) : raw;
    if ($back.length && $back.val() !== v) $back.val(v);     // 1) backing (no events)
    if (v !== $vis.val()) {                                  // 2) visible + events
      $vis.val(v).trigger('input').trigger('change');
    }
    if (v) lastTime = v;
    //  Step C (typing/picking): quiet required UI while interacting
    _ppMarkRequired(baseId, !!v, { deferError: true });
    if (typeof setIsDirty === 'function') { try { setIsDirty($vis.attr('id')); } catch (_) { } }
  });

  // Visible typing → preload native + keep backing in sync
  $vis.off('.timeonly-sync')
      .on('input.timeonly-sync change.timeonly-sync', function () {
        const cur = (typeof normalizeTime === 'function')
          ? normalizeTime(String($vis.val() || ''))
          : String($vis.val() || '').trim();
        $native.val(cur || '');
        if ($back.length && $back.val() !== cur) $back.val(cur || ''); // no events
        if (cur) lastTime = cur;
        //  Step C (typing): quiet required UI
        _ppMarkRequired(baseId, !!cur, { deferError: true });
      })
      // Blur stickiness: restore if PP/other clears after blur
      .on('blur.timeonly-stick', function () {
        const visEl  = this;
        const curVis = (typeof normalizeTime === 'function')
          ? normalizeTime(String(visEl.value || ''))
          : String(visEl.value || '').trim();
        if (curVis) lastTime = curVis;

        setTimeout(() => {
          const stillEmpty = !visEl.value || !visEl.value.trim();
          const recovered  = lastTime || ($back.length ? String($back.val() || '') : '') || ($native.val() || '');
          if (stillEmpty && recovered) {
            visEl.value = recovered;
            if ($back.length) $back.val(recovered);
            $native.val(recovered);
            $(visEl).trigger('input').trigger('change');
          }
          //  Step C (blur): still quiet (no red) after blur
          _ppMarkRequired(baseId, !!(visEl.value && visEl.value.trim()), { deferError: true });
        }, 120);
      });

  // initial preload so the native picker lands on current value
  try {
    const cur = (typeof normalizeTime === 'function')
      ? normalizeTime(String($vis.val() || ''))
      : String($vis.val() || '').trim();
    $native.val(cur || '');
  } catch { }
  //  Step C (post-init): quiet required UI after preload
  _ppMarkRequired(baseId, !!($vis.val() && String($vis.val()).trim()), { deferError: true });

  // Step C (submit-capture): mirror visible → backing BEFORE required runs; show red only on submit
  try {
    var formEl = $group.closest('form').get(0);
    if (formEl && !formEl['_ppTimeSubmit_' + baseId]) {
      formEl.addEventListener('submit', function () {
        var v = String($vis.val() || '').trim();
        if ($back.length) $back.val(v || '');
        _ppMarkRequired(baseId, !!v, { showNow: true });
      }, true); // capture
      formEl['_ppTimeSubmit_' + baseId] = true;
    }
  } catch (_){}

  // Addon → open native picker (with focus ring)
  $addon.off('.timeonly').on('click.timeonly keydown.timeonly', function (ev) {
    if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
    const btnEl = this; btnEl.tabIndex = 0; btnEl.focus();
    requestAnimationFrame(() => { if (document.activeElement !== btnEl) btnEl.focus(); });

    ev.preventDefault(); ev.stopImmediatePropagation();

    try {
      const cur = (typeof normalizeTime === 'function')
        ? normalizeTime(String($vis.val() || ''))
        : String($vis.val() || '').trim();
      if (cur) $native.val(cur);
    } catch (_) {}

    const el = $native.get(0);
    if (el && typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch (_) {}
    }
    openSimpleTimeOverlay($vis.get(0), isFr);
  });
}

// Minimal overlay fallback (only if showPicker is unavailable)
function openSimpleTimeOverlay(input, isFr) {
  closeSimpleTimeOverlay();
  const wrap = document.createElement('div');
  wrap.id = (input.id || 'time') + '_overlay';
  wrap.setAttribute('role','dialog'); wrap.setAttribute('aria-modal','true');
  Object.assign(wrap.style, {
    position:'absolute', zIndex:9999, background:'#fff', border:'1px solid #bbb',
    borderRadius:'6px', padding:'8px', boxShadow:'0 4px 12px rgba(0,0,0,.15)', fontSize:'14px'
  });
  const r = input.getBoundingClientRect();
  wrap.style.top  = (window.scrollY + r.bottom + 6) + 'px';
  wrap.style.left = (window.scrollX + r.left) + 'px';

  const label = document.createElement('div');
  label.textContent = isFr ? 'Choisir une heure' : 'Choose a time';
  label.style.marginBottom = '6px';

  const hh = document.createElement('select'); hh.style.marginRight = '6px';
  for (let h=0; h<24; h++) hh.add(new Option(String(h).padStart(2,'0'), String(h).padStart(2,'0')));
  const mm = document.createElement('select');
  for (let m=0; m<60; m+=5) mm.add(new Option(String(m).padStart(2,'0'), String(m).padStart(2,'0')));

  const m  = String(input.value || '').match(/^(\d{1,2}):([0-5]\d)/);
  if (m) { hh.value = String(m[1]).padStart(2,'0'); mm.value = m[2]; }

  const ok = document.createElement('button'); ok.type='button'; ok.textContent='OK'; ok.style.marginLeft='8px';
  const ca = document.createElement('button'); ca.type='button'; ca.textContent=isFr?'Annuler':'Cancel'; ca.style.marginLeft='6px';

  ok.onclick = function(){
    const v = hh.value + ':' + mm.value;
    input.value = v;
    input.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}));
    input.dispatchEvent(new Event('change',{bubbles:true,cancelable:true}));
    closeSimpleTimeOverlay(); input.focus();
  };
  ca.onclick = closeSimpleTimeOverlay;

  wrap.append(label, hh, mm, ok, ca);
  document.body.appendChild(wrap);

  setTimeout(() => {
    const onDoc = e => { if (!wrap.contains(e.target)) closeSimpleTimeOverlay(); };
    const onKey = e => { if (e.key === 'Escape') closeSimpleTimeOverlay(); };
    document.addEventListener('mousedown', onDoc, { once:true });
    document.addEventListener('keydown',   onKey, { once:true });
    wrap._cleanup = () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown',   onKey);
    };
  }, 0);
}
function closeSimpleTimeOverlay(){
  const el = document.querySelector('[id$="_overlay"]');
  if (el){ el._cleanup && el._cleanup(); el.remove(); }
}

// Inside-input calendar icon (PP datepicker) — native-like look
(function ($) {
  $(function () {
    // Skip groups explicitly marked time-only and run once per group
    $('.form-control-cell .input-group.datetimepicker:not([data-pp-time-only="1"])').each(function () {
      var $grp = $(this);
      if ($grp.data('ppInsideBound')) return;
      $grp.data('ppInsideBound', true);

      // Ensure we only have ONE focusable addon button
      var $addons = $grp.find('.input-group-addon.btn, [role="button"]');
      if ($addons.length > 1) {
        // Keep the first; remove the rest to avoid a second tab stop
        $addons.slice(1).remove();
      }
      var $btn = $grp.find('.input-group-addon.btn, [role="button"]').first();

      var $input = $grp.find('input[id$="_datepicker_description"], input[id$="_datepicker"]');
      if (!$btn.length || !$input.length) return;

      // 1) Use the inside-icon layout you styled in custom.css
      $grp.addClass('pp-inside');
      $grp.children('button.btn:not(.input-group-addon)').remove();
      // 2) Bilingual label for AT
      var lang  = (document.documentElement.lang || 'en').toLowerCase();
      var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
      $btn.attr({ 'aria-label': label, title: label, 'aria-haspopup': 'false', tabindex: '0' })
          .removeAttr('aria-controls aria-expanded');

      // 3) Replace icon markup with a single inline SVG; remove any legacy icons
      var svg =
        '<svg class="pp-cal" aria-hidden="true" focusable="false" ' +
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="4.5" width="18" height="16.5" rx="2" ry="2"></rect>' +
          '<line x1="16" y1="2.5" x2="16" y2="6"></line>' +
          '<line x1="8"  y1="2.5" x2="8"  y2="6"></line>' +
          '<line x1="3"  y1="9"   x2="21" y2="9"></line>' +
        '</svg>';

      // Remove any existing icon(s) then append exactly one
      $btn.find('.pp-cal, .fa, .icon-calendar, svg').remove();
      $btn.append(svg);
    });

    // If <html lang> flips dynamically, relabel the icon
    var mo = new MutationObserver(function () {
      var lang  = (document.documentElement.lang || 'en').toLowerCase();
      var label = lang.startsWith('fr') ? 'Choisir une date' : 'Choose a date';
      $('.form-control-cell .input-group.datetimepicker.pp-inside:not([data-pp-time-only="1"]) .input-group-addon.btn')
        .attr({ 'aria-label': label, title: label });
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})(window.jQuery || window.$);
// Safety net: fix pattern on any already-rendered time-only groups
$(function () {
  $('.form-control-cell .input-group[data-pp-time-only="1"]').each(function () {
    const $grp = $(this);
    const $back = $grp.closest('.control').find('input[id]').first(); // the hidden/backing input
    const baseId = $back.attr('id');
    if (baseId && typeof ensureTimeAddonWorks === 'function') {
      ensureTimeAddonWorks(baseId); // re-enforces the time pattern + handlers
    } else {
      // Fallback: set pattern directly on the visible input if baseId not found
      const $vis = $grp.find('input[id$="_timepicker_description"], input[id$="_timepicker"], input[id$="_datepicker_description"]').first();
      if ($vis.length) {
        const timePattern =
          '(?:([01]?\\d|2[0-3]):[0-5]\\d(?:[:][0-5]\\d)?)' +
          '|(?:0?[1-9]|1[0-2]):[0-5]\\d(?:[:][0-5]\\d)?\\s*(?:[AaPp][Mm])' +
          '|(?:([01]?\\d|2[0-3])\\s*[hH]\\s*[0-5]\\d)';
        $vis.attr({ 'data-pp-as-time': '1', inputmode: 'numeric', pattern: timePattern, autocomplete: 'off' })
            .removeAttr('data-ui data-type data-date-format placeholder');
      }
    }
  });
});

// Put near your other helpers
function initWetDatePolyfill(ids){
  var wet$ = window.jQuery || window.$wet;
  ids = Array.isArray(ids) ? ids : [ids].filter(Boolean);

  ids.forEach(id => {
    var el = document.getElementById(id);
    if (el) { el.type = 'date'; el.classList.add('wb-date'); }
  });

  // bilingual watermark
  var isFr = (document.documentElement.lang || 'en').toLowerCase().startsWith('fr');
  ids.forEach(id => {
    var el = document.getElementById(id);
    if (el) el.setAttribute('placeholder', isFr ? 'AAAA-MM-JJ' : 'YYYY-MM-DD');
  });

  // trigger the polyfill with WET's jQuery
  if (wet$) {
    var nodes = ids.map(id => document.getElementById(id)).filter(Boolean);
    wet$(document).trigger('wb-init.wb-date', [nodes]);
  }
}
// 

