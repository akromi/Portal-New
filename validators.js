

///////////////////////////////////////////////////////////
//                                                       //
//                 Validator functions                   //
//                                                       //
///////////////////////////////////////////////////////////


// Validates a field - returns true if not null or empty, false otherwise
// function validateRequired(source) { 
//   var id = source.controltovalidate;
//   var val =  $('#' + id).val();

//   return val && val !== '';

///////////////////////////////////////////////////////////
//                                                       //
//                 Validator functions                   //
//                                                       //
///////////////////////////////////////////////////////////


// Validates a field - returns true if not null or empty, false otherwise
// function validateRequired(source) { 
//   var id = source.controltovalidate;
//   var val =  $('#' + id).val();

//   return val && val !== '';
// }
function validateRequired(source) {
  const id = source.controltovalidate;
  const val = getFocusableField(id, source.type).val();
  return !!val && val !== '';
}

function validateEmailFormat(source) {
  const v = String($('#' + source.controltovalidate).val() || '').trim();
  if (!v) return true; // let "required" handle empties

  const at = v.indexOf('@');
  if (at <= 0 || at === v.length - 1) return false;

  const local = v.slice(0, at);
  const domain = v.slice(at + 1);

  // Local part: no leading/trailing dot, no consecutive dots, allowed chars only
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!/^[A-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local)) return false;

  // Domain must contain at least one dot (so a@b is invalid)
  if (!domain.includes('.')) return false;
  if (domain.endsWith('.') || domain.includes('..')) return false;

  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(l => l.length === 0)) return false;

  // Each label: 1–63 chars, alnum/hyphen, no leading/trailing hyphen
  const labelRe = /^(?=.{1,63}$)[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;
  if (labels.some(l => !labelRe.test(l))) return false;

  // TLD letters only; allow 1+ letters so a@b.c is valid (use {2,} to require 2+)
  const tld = labels[labels.length - 1];
  if (!/^[A-Z]{1,}$/i.test(tld)) return false;

  return true;
}


// Validates a phone number - returns true if valid, false otherwise
function validatePhoneNumberFormat(source) {
    var phoneNumber = $('#' + source.controltovalidate).val();
    if (phoneNumber === null || phoneNumber.length === 0) {
        return true;
    }
    
    // Trim whitespace
    phoneNumber = phoneNumber.trim();
    
    // Better UX: Allow partial inputs during typing (less than 10 digits)
    // Only validate format when we have enough characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If we have fewer than 10 digits, it's incomplete but not necessarily wrong yet
    // Return true to avoid premature error messages while user is typing
    if (digitsOnly.length < 10) {
        return true;
    }
    
    // For 10+ digits, validate the full format
    // Accepts: +1234567890, 123-456-7890, (123) 456-7890, etc.
    const phoneNumberRegex = /^(?:[\+\d\s()-]*\d){10,}[\d\s()-]*$/;
    return phoneNumberRegex.test(phoneNumber);
}

/**
 * Validates a phone number has a minimum number of digits.
 * This validator should be used alongside validatePhoneNumberFormat.
 * It enforces minimum digits only (typically at submit time), while
 * validatePhoneNumberFormat allows partial input during typing.
 * 
 * @param {object} source - Validator source object
 * @param {number} minDigits - Minimum number of digits required (default: 10)
 * @returns {boolean} - True if field is empty OR has >= minDigits, false otherwise
 */
function validatePhoneMinDigits(source, minDigits) {
    var min = (typeof minDigits === "number" && minDigits > 0) ? minDigits : 10;
    var phoneNumber = $("#" + source.controltovalidate).val();
    
    if (phoneNumber === null || phoneNumber.length === 0) {
        return true; // let "required" handle empty fields
    }
    
    phoneNumber = phoneNumber.trim();
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    
    // Fail if fewer than minimum digits
    return digitsOnly.length >= min;
}


// Validates a date - returns true if valid, false otherwise
// function validateDateFormat(source) {
//     var raw =  $('#' + source.controltovalidate).val();
//     if (raw === null || raw.length < 10) {
//         return false;
//     }

//     var dateString = raw.substring(0, 10);
//     const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD
//     return dateRegex.test(dateString);
// }

function validateDateFormat(source) {
  const raw = String(getFocusableField(source.controltovalidate, source.type).val() || "");
  if (raw.length < 10) return false;
  
  // Extract the date portion (first 10 characters for YYYY-MM-DD)
  const dateString = raw.substring(0, 10);
  
  // Check basic format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  // Normalize and validate the date is a real calendar date
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Basic range validation
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Create a date object to validate it's a real date
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
    return false;
  }
  
  return true;
}

// Validates a date - returns true if not im the past, false otherwise
// function validateDateNotInThePast(source) {
  
//   var id = source.controltovalidate;
//   var dateString =  $('#' + id).val();

//   // date control may sometimes return an invalid date string, check first
//   if (dateString === 'Invalid date') 
//     return false;

//   var date = new Date(dateString);
//   if (date === null || date === undefined) {
//     return false;
//   }

//   var today = new Date();

//   // add 10 minute buffer - user selects date, reads etc... then submits
//   // date / time entered would be less than today in ms.
//   // so we add the 10 minutes and then test 
//   // date entered + 10 minutes in ms - today (right now) in ms >= 0
//   return date.getTime() + 10 * 60 * 1000 - today.getTime() >= 0;
// }

function validateDateNotInThePast(source) {
  const id = source.controltovalidate;
  const raw = String(getFocusableField(id, source.type).val() || "");
  if (raw === 'Invalid date' || !raw) return false;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  // add 10 minute buffer - user selects date, reads etc... then submits
  // date / time entered would be less than today in ms.
  // so we add the 10 minutes and then test 
  // date entered + 10 minutes in ms - today (right now) in ms >= 0
  return date.getTime() + 10 * 60 * 1000 - today.getTime() >= 0;
}

// Validates an imo - returns true if valid, false otherwise
function validateIMO(source) {
    var raw =  $('#' + source.controltovalidate).val();
    if (!raw) {
        return true;
    }
 
    var imoString = raw.substring(0, 8);
    const imoRegex = /^\d{7,8}$/; // 7 or 8 digits
    return imoRegex.test(imoString);
}

// Validates a business number - returns true if valid, false otherwise
// function validateBusinessNumber(source) {
//     var raw = $('#' + source.controltovalidate).val();
//     if (!raw) {
//         return true;
//     }
//     var businessString = raw.substring(0, 9);
//     const rgxBusiness = /^\d{9}$/;
//     return rgxBusiness.test(businessString);
// }

//Validates a business number - returns true if valid, false otherwise
// validators.js (add anywhere near your other small validators)
 
// Pure helper: Luhn (mod 10) for a 9-digit BN
function bnMod10(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 9) return false;
 
  // Luhn: from rightmost, double every second digit; sum digits; %10 === 0
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = digits.charCodeAt(8 - i) - 48; // right-to-left
    if (i % 2 === 1) {                     // every second (excluding check digit)
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (sum % 10) === 0;
}
 
// PP wrapper: use with your Page_Validators entries
function validateBusinessNumber(source) {
  const raw = $('#' + source.controltovalidate).val();
  const trimmed = String(raw || '').replace(/\s|-/g, '');
  if (!trimmed) return true;          // let "required" handle empties
  return bnMod10(trimmed);
}

// //Mod 11 Canadian Business Number Validator (Recommended by CRA)
// function validateCanadianBusinessNumber(fieldId) {
//   try {
//     // Get the field value
//     const field = document.getElementById(fieldId);
//     if (!field) return false;
    
//     const value = field.value || '';
    
//     // Clean the input - remove all non-digits
//     const cleanValue = value.replace(/\D/g, '');
    
//     // Empty values are valid (let required validators handle this)
//     if (cleanValue === '') return true;
    
//     // Must be exactly 9 digits
//     if (cleanValue.length !== 9) return false;
    
//     // Convert to array of numbers
//     const digits = cleanValue.split('').map(d => parseInt(d, 10));
    
//     // Weights for positions 1-8
//     const weights = [1, 3, 5, 7, 9, 11, 13, 15];
    
//     // Calculate weighted sum
//     let sum = 0;
//     for (let i = 0; i < 8; i++) {
//       sum += digits[i] * weights[i];
//     }
    
//     // Calculate check digit
//     const remainder = sum % 11;
//     const expectedCheckDigit = remainder < 2 ? remainder : 11 - remainder;
    
//     // Compare with actual 9th digit
//     return digits[8] === expectedCheckDigit;
    
//   } catch (error) {
//     return false;
//   }
// }

// Validates a phone extension - returns true if valid, false otherwise
function validatePhoneExtension(source) {
   var extension = $('#' + source.controltovalidate).val();
   if (!extension) {
       return true;
   }
   const rgxExtension = /^(?=(?:[^0-9]*[0-9]){0,10}[^0-9]*$)[\d\s()+-]*$/;
   return rgxExtension.test(extension);
}

// Validates a Canadian Postal Code - returns true if valid, false otherwise
function validateCanadianPostal(source) {
   var postalCode = $('#' + source.controltovalidate).val();
   if (!postalCode) {
       return true;
   }
   const rgxPostalCode = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\s *\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i;
   return rgxPostalCode.test(postalCode);
}

// Validates Positive Number Maximum Seven Digits - returns true if valid, false otherwise
function validatePositiveNumberOnlyMaxSevenDigits(source) {
   var numberMaxSevenOnly = $('#' + source.controltovalidate).val();
   if (!numberMaxSevenOnly) {
       return true;
   }
   const rgxNumberMaxSevenOnly =  /^(?:[1-9][0-9]{0,6})$/;
   return rgxNumberMaxSevenOnly.test(numberMaxSevenOnly);
}

// Validates Positive Number Only - returns true if valid, false otherwise
function validatePositiveNumberOnly(source) {
   var numberOnly = $('#' + source.controltovalidate).val();
   if (!numberOnly) {
       return true;
   }
   const rgxNumberOnly =  /^\d+$/;
   return rgxNumberOnly.test(numberOnly);
}

// // Validates if a file is selected - returns true if valid, false otherwise
// function validateFileSelected(source) {
//   const $inp = $("#" + source.controltovalidate + "_input_file");
//   // Works for native file inputs and PP’s value fallback
//   const hasFiles = $inp[0] && $inp[0].files && $inp[0].files.length >= 0;
//   const hasValue = !!$inp.val();
//   return hasFiles || hasValue;
// }

// // Small shared helper — same targeting pattern you use elsewhere
// function _fileInputFor(src){
//   var baseId = src && src.controltovalidate ? src.controltovalidate : '';
//   return document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
// }

// /**
//  * Validate that the picked file is NOT zero bytes.
//  * Returns:
//  *   true  -> no file picked OR size > 0
//  *   false -> file picked and size === 0
//  */
// function validateFileNotZero(src){
//   var fin = _fileInputFor(src);
//   if (!fin) return true;                         // can't validate → don't block
//   var f = fin.files && fin.files[0];
//   if (!f) return true;                           // no new file → let "required" handle presence
//   return f.size !== 0;                           // only fail on exactly zero
// }

// /**
//  * Validate that the picked file does NOT exceed the max size.
//  * Max resolution order:
//  *   1) data-max-bytes on the input (string int)
//  *   2) window.DEFAULT_MAX_FILE_BYTES (number)
//  *   3) 4 MiB default
//  *
//  * Returns:
//  *   true  -> no file picked OR size <= max
//  *   false -> file picked and size > max
//  */
// function validateFileMaxSize(src){
//   var fin = _fileInputFor(src);
//   if (!fin) return true;
//   var f = fin.files && fin.files[0];
//   if (!f) return true;

//   var fromAttr = fin.getAttribute('data-max-bytes');
//   var maxBytes =
//     (fromAttr && !isNaN(fromAttr)) ? parseInt(fromAttr, 10) :
//     (typeof window.DEFAULT_MAX_FILE_BYTES === 'number' ? window.DEFAULT_MAX_FILE_BYTES :
//      4 * 1024 * 1024); // 4 MiB

//   return f.size <= maxBytes;
// }


// // Accept only: PDF, JPG, PNG, GIF
// function validateFileType(source) {
//   const allowed = new Set(['pdf', 'jpg', 'png', 'gif']); // hard-coded

//   // Power Pages: try *_input_file first, then raw id
//   let $inp = $('#' + source.controltovalidate + '_input_file');
//   if (!$inp.length) $inp = $('#' + source.controltovalidate);

//   const el = $inp.get(0);
//   if (!el || !el.files || el.files.length === 0) return true; // nothing selected

//   const file = el.files[0]; // only check the first file
//   const name = String(file.name || '');
//   const dot = name.lastIndexOf('.');
//   if (dot <= 0) return false; // no extension or starts with '.'

//   const ext = name.slice(dot + 1).toLowerCase();
//   return allowed.has(ext);
// }
// Small shared helper — same targeting pattern you use elsewhere
function _fileInputFor(src){
  var baseId = src && src.controltovalidate ? src.controltovalidate : '';
  return document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
}

// Validates if a file is selected - returns true if valid, false otherwise
function validateFileSelected(source) {
  // Prefer the visible file input; fall back to base id
  var fin = _fileInputFor(source);
  if (!fin) {
    // If the control can't be located, fail closed for "required"
    // so we don't accidentally pass a required field silently.
    return false;
  }

  // Native file list (most reliable)
  if (fin.files && typeof fin.files.length === 'number') {
    return fin.files.length > 0;
  }

  // Fallback: value attribute (older browsers)
  var val = (fin.value || '').trim();
  return val.length > 0;
}

/**
 * Validate that the picked file is NOT zero bytes.
 * Returns:
 *   true  -> no file picked OR size > 0
 *   false -> file picked and size === 0
 */
function validateFileNotZero(src){
  var fin = _fileInputFor(src);
  if (!fin) return true; // can't validate → don't block
  var f = fin.files && fin.files[0];
  if (!f) return true;   // no new file → let "required" handle presence
  return f.size !== 0;   // only fail on exactly zero
}

/**
 * Validate that the picked file does NOT exceed the max size.
 * Max resolution order:
 *   1) data-max-bytes on the input (string int)
 *   2) window.DEFAULT_MAX_FILE_BYTES (number)
 *   3) 4 MiB default
 *
 * Returns:
 *   true  -> no file picked OR size <= max
 *   false -> file picked and size > max
 */
function validateFileMaxSize(src){
  var fin = _fileInputFor(src);
  if (!fin) return true;
  var f = fin.files && fin.files[0];
  if (!f) return true;

  var fromAttr = fin.getAttribute('data-max-bytes');
  var maxBytes =
    (fromAttr && !isNaN(fromAttr)) ? parseInt(fromAttr, 10) :
    (typeof window.DEFAULT_MAX_FILE_BYTES === 'number' ? window.DEFAULT_MAX_FILE_BYTES :
     4 * 1024 * 1024); // 4 MiB

  return f.size <= maxBytes;
}

// Accept only: PDF, JPG, PNG, GIF
function validateFileType(source) {
  const allowed = new Set(['pdf', 'jpg', 'png', 'gif']); // hard-coded set per requirements

  // Power Pages: try *_input_file first, then raw id
  let $inp = $('#' + source.controltovalidate + '_input_file');
  if (!$inp.length) $inp = $('#' + source.controltovalidate);

  const el = $inp.get(0);
  if (!el || !el.files || el.files.length === 0) return true; // nothing selected → let "required" handle presence

  const file = el.files[0]; // only check the first file
  const name = String(file.name || '').trim();
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return false; // no extension or starts with '.'

  const ext = name.slice(dot + 1).toLowerCase();
  return allowed.has(ext);
}



function getFileBaseId(source) {
  const cid = String(source && source.controltovalidate || '');
  return cid
    .replace(/hidden_(filename|filetype|file_size)$/i, '')
    .replace(/_input_file$/i, '');
}

// Enable/disable the built-in RequiredFieldValidator for this file control,
// and hide/show the default required message block (<span id="<base>_err">)
function toggleRequiredForFile(baseId, hasFile) {
  const reqId = 'RequiredFieldValidator' + baseId + 'hidden_filename';
  const req = document.getElementById(reqId);
  if (req) req.enabled = !hasFile;

  const msg = document.getElementById(baseId + '_err');
  if (msg) msg.style.display = hasFile ? 'none' : ''; // hide when a file is chosen
}


function compare2Number(controlId1, controlId2) {
    const controlLabelId = controlId1 + "_label";
    const controlId = controlId1;

    // Get the values of the two fields
    var numberA = $("#" + controlId1).val();
    var numberB = $("#" + controlId2).val();
  
    //Skip validation if either field is empty
    if (numberA === "" || numberB === "") {
        return true;  // Skip comparison if the fields do not contain numbers
    }
    // Validate if both fields contain valid positive numbers
    if (!/^\d+$/.test(numberA) || !/^\d+$/.test(numberB)) {
        return false;  // Skip comparison if the fields do not contain valid numbers
    }
    // Convert values to numbers for comparison
    numberA = Number(numberA);
    numberB = Number(numberB);

    // Check if numberA is less than numberB
    if (numberA < numberB) {
          return false;  // Validation fails if numberA is less than numberB
    }

    return true;  // Validation passes if both fields are valid numbers and the comparison is correct
}

// Compare two date fields: returns true if controlId1 <= controlId2
function compare2Dates(controlId1, controlId2) {
  // Use your helper so we read the *real* input even with date polyfills
  const $a = getFocusableField(controlId1, 'date');
  const $b = getFocusableField(controlId2, 'date');

  const rawA = String(($a && $a.val()) || '').trim();
  const rawB = String(($b && $b.val()) || '').trim();

  // If either is empty, don't block submission here
  if (!rawA || !rawB) return true;

  const toMillis = (raw) => {
    if (raw === 'Invalid date') return NaN;

    // Normalize common formats:
    //  - 'YYYY-MM-DD' (date only) → interpret as UTC midnight for deterministic compare
    //  - 'YYYY-MM-DD HH:mm'       → make ISO-like by replacing space with 'T'
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}(?::\d{2})?)?)?$/);
    if (m) {
      if (!m[2]) return Date.parse(m[1] + 'T00:00:00Z');
      const isoish = raw.replace(' ', 'T');
      const t = Date.parse(isoish);
      if (!isNaN(t)) return t;
    }
    return Date.parse(raw);
  };

  const tA = toMillis(rawA);
  const tB = toMillis(rawB);

  // Invalid parse → fail validation
  if (isNaN(tA) || isNaN(tB)) return false;

  // Pass when A <= B
  return tA <= tB;
};

/* ========= Date/Time helpers (private) ========= */

// Real calendar check for YYYY-MM-DD
function _isValidYmd(ymd){
  var m = /^(\d{4})\-(0[1-9]|1[0-2])\-(0[1-9]|[12]\d|3[01])$/.exec((ymd || '').trim());
  if (!m) return false;
  var y = +m[1], mo = +m[2]-1, d = +m[3];
  var dt = new Date(Date.UTC(y, mo, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo && dt.getUTCDate() === d;
}

// 24h time (HH:mm or HH:mm:ss)
function _isValidTime24(t){
  return /^(?:([01]?\d|2[0-3])):([0-5]\d)(?::([0-5]\d))?$/.test((t || '').trim());
}

// 12h time (h:mm or h:mm:ss with AM/PM, case/periods tolerant)
function _isValidTime12(t){
  return /^(?:0?[1-9]|1[0-2]):([0-5]\d)(?::([0-5]\d))?\s*([Aa]\.?[Mm]\.?|[Pp]\.?[Mm]\.?)$/.test((t || '').trim());
}

// Split "date sep time" (sep can be space or 'T')
function _splitDateTime(s){
  var str = (s || '').trim();
  var sp  = str.indexOf(' ');
  var tp  = str.indexOf('T');
  var p   = (sp >= 0 ? sp : tp);
  if (p < 0) return { date: str, time: '' };
  return { date: str.slice(0, p), time: str.slice(p+1) };
}

// YYYY-MM-DD HH:mm[:ss] (24h)
function _isValidYmdHm24(s){
  var parts = _splitDateTime(s);
  return _isValidYmd(parts.date) && _isValidTime24(parts.time);
}

// YYYY-MM-DD h:mm[:ss] AM/PM (12h)
function _isValidYmdHm12(s){
  var parts = _splitDateTime(s);
  return _isValidYmd(parts.date) && _isValidTime12(parts.time);
}

// Read the logical value PP submits for date/datetime fields
function _readLogicalValue(id){
  if (typeof getCompositeDateTimeValue === 'function') {
    return (getCompositeDateTimeValue(id) || '').trim();
  }
  var el = document.getElementById(id);
  return (el && el.value || '').trim();
}

// Read time from time-only UI/backing
function _readTimeOnlyValue(id){
  var tEl = document.getElementById(id + '_timepicker_description') ||
            document.getElementById(id + '_timepicker');
  if (tEl) return (tEl.value || '').trim();
  var el = document.getElementById(id);
  return (el && el.value || '').trim();
}

/* ========= Public Date validators ========= */

// Date-only (YYYY-MM-DD)
function validateDateOnly(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmd(val);
  source.isvalid = ok; return ok;
}

// Datetime — 24h only (YYYY-MM-DD HH:mm[:ss] or 'T' separator)
function validateDateTime24(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm24(val);
  source.isvalid = ok; return ok;
}

// Datetime — 12h only (YYYY-MM-DD h:mm[:ss] AM/PM)
function validateDateTime12(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm12(val);
  source.isvalid = ok; return ok;
}

// Datetime — accept EITHER 24h OR 12h
function validateDateTimeFlex(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm24(val) || _isValidYmdHm12(val);
  source.isvalid = ok; return ok;
}

// Time-only — 24h (HH:mm[:ss])
function validateTime24(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime24(val);
  source.isvalid = ok; return ok;
}

// Time-only — 12h (h:mm[:ss] AM/PM)
function validateTime12(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime12(val);
  source.isvalid = ok; return ok;
}

// Time-only — accept EITHER 24h OR 12h
function validateTimeFlex(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime24(val) || _isValidTime12(val);
  source.isvalid = ok; return ok;
}

// }
function validateRequired(source) {
  const id = source.controltovalidate;
  const val = getFocusableField(id, source.type).val();
  return !!val && val !== '';
}

function validateEmailFormat(source) {
  const v = String($('#' + source.controltovalidate).val() || '').trim();
  if (!v) return true; // let "required" handle empties

  const at = v.indexOf('@');
  if (at <= 0 || at === v.length - 1) return false;

  const local = v.slice(0, at);
  const domain = v.slice(at + 1);

  // Local part: no leading/trailing dot, no consecutive dots, allowed chars only
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!/^[A-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local)) return false;

  // Domain must contain at least one dot (so a@b is invalid)
  if (!domain.includes('.')) return false;
  if (domain.endsWith('.') || domain.includes('..')) return false;

  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(l => l.length === 0)) return false;

  // Each label: 1–63 chars, alnum/hyphen, no leading/trailing hyphen
  const labelRe = /^(?=.{1,63}$)[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;
  if (labels.some(l => !labelRe.test(l))) return false;

  // TLD letters only; allow 1+ letters so a@b.c is valid (use {2,} to require 2+)
  const tld = labels[labels.length - 1];
  if (!/^[A-Z]{1,}$/i.test(tld)) return false;

  return true;
}


// Validates a phone number - returns true if valid, false otherwise
function validatePhoneNumberFormat(source) {
    var phoneNumber = $('#' + source.controltovalidate).val();
    if (phoneNumber === null || phoneNumber.length === 0) {
        return true;
    }
    
    // Trim whitespace
    phoneNumber = phoneNumber.trim();
    
    // Better UX: Allow partial inputs during typing (less than 10 digits)
    // Only validate format when we have enough characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If we have fewer than 10 digits, it's incomplete but not necessarily wrong yet
    // Return true to avoid premature error messages while user is typing
    if (digitsOnly.length < 10) {
        return true;
    }
    
    // For 10+ digits, validate the full format
    // Accepts: +1234567890, 123-456-7890, (123) 456-7890, etc.
    const phoneNumberRegex = /^(?:[\+\d\s()-]*\d){10,}[\d\s()-]*$/;
    return phoneNumberRegex.test(phoneNumber);
}

// Validates a date - returns true if valid, false otherwise
// function validateDateFormat(source) {
//     var raw =  $('#' + source.controltovalidate).val();
//     if (raw === null || raw.length < 10) {
//         return false;
//     }

//     var dateString = raw.substring(0, 10);
//     const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD
//     return dateRegex.test(dateString);
// }

function validateDateFormat(source) {
  const raw = String(getFocusableField(source.controltovalidate, source.type).val() || "");
  if (raw.length < 10) return false;
  
  // Extract the date portion (first 10 characters for YYYY-MM-DD)
  const dateString = raw.substring(0, 10);
  
  // Check basic format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  // Normalize and validate the date is a real calendar date
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Basic range validation
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Create a date object to validate it's a real date
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
    return false;
  }
  
  return true;
}

// Validates a date - returns true if not im the past, false otherwise
// function validateDateNotInThePast(source) {
  
//   var id = source.controltovalidate;
//   var dateString =  $('#' + id).val();

//   // date control may sometimes return an invalid date string, check first
//   if (dateString === 'Invalid date') 
//     return false;

//   var date = new Date(dateString);
//   if (date === null || date === undefined) {
//     return false;
//   }

//   var today = new Date();

//   // add 10 minute buffer - user selects date, reads etc... then submits
//   // date / time entered would be less than today in ms.
//   // so we add the 10 minutes and then test 
//   // date entered + 10 minutes in ms - today (right now) in ms >= 0
//   return date.getTime() + 10 * 60 * 1000 - today.getTime() >= 0;
// }

function validateDateNotInThePast(source) {
  const id = source.controltovalidate;
  const raw = String(getFocusableField(id, source.type).val() || "");
  if (raw === 'Invalid date' || !raw) return false;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  // add 10 minute buffer - user selects date, reads etc... then submits
  // date / time entered would be less than today in ms.
  // so we add the 10 minutes and then test 
  // date entered + 10 minutes in ms - today (right now) in ms >= 0
  return date.getTime() + 10 * 60 * 1000 - today.getTime() >= 0;
}

// Validates an imo - returns true if valid, false otherwise
function validateIMO(source) {
    var raw =  $('#' + source.controltovalidate).val();
    if (!raw) {
        return true;
    }
 
    var imoString = raw.substring(0, 8);
    const imoRegex = /^\d{7,8}$/; // 7 or 8 digits
    return imoRegex.test(imoString);
}

// Validates a business number - returns true if valid, false otherwise
// function validateBusinessNumber(source) {
//     var raw = $('#' + source.controltovalidate).val();
//     if (!raw) {
//         return true;
//     }
//     var businessString = raw.substring(0, 9);
//     const rgxBusiness = /^\d{9}$/;
//     return rgxBusiness.test(businessString);
// }

//Validates a business number - returns true if valid, false otherwise
// validators.js (add anywhere near your other small validators)
 
// Pure helper: Luhn (mod 10) for a 9-digit BN
function bnMod10(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 9) return false;
 
  // Luhn: from rightmost, double every second digit; sum digits; %10 === 0
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = digits.charCodeAt(8 - i) - 48; // right-to-left
    if (i % 2 === 1) {                     // every second (excluding check digit)
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (sum % 10) === 0;
}
 
// PP wrapper: use with your Page_Validators entries
function validateBusinessNumber(source) {
  const raw = $('#' + source.controltovalidate).val();
  const trimmed = String(raw || '').replace(/\s|-/g, '');
  if (!trimmed) return true;          // let "required" handle empties
  return bnMod10(trimmed);
}

// //Mod 11 Canadian Business Number Validator (Recommended by CRA)
// function validateCanadianBusinessNumber(fieldId) {
//   try {
//     // Get the field value
//     const field = document.getElementById(fieldId);
//     if (!field) return false;
    
//     const value = field.value || '';
    
//     // Clean the input - remove all non-digits
//     const cleanValue = value.replace(/\D/g, '');
    
//     // Empty values are valid (let required validators handle this)
//     if (cleanValue === '') return true;
    
//     // Must be exactly 9 digits
//     if (cleanValue.length !== 9) return false;
    
//     // Convert to array of numbers
//     const digits = cleanValue.split('').map(d => parseInt(d, 10));
    
//     // Weights for positions 1-8
//     const weights = [1, 3, 5, 7, 9, 11, 13, 15];
    
//     // Calculate weighted sum
//     let sum = 0;
//     for (let i = 0; i < 8; i++) {
//       sum += digits[i] * weights[i];
//     }
    
//     // Calculate check digit
//     const remainder = sum % 11;
//     const expectedCheckDigit = remainder < 2 ? remainder : 11 - remainder;
    
//     // Compare with actual 9th digit
//     return digits[8] === expectedCheckDigit;
    
//   } catch (error) {
//     return false;
//   }
// }

// Validates a phone extension - returns true if valid, false otherwise
function validatePhoneExtension(source) {
   var extension = $('#' + source.controltovalidate).val();
   if (!extension) {
       return true;
   }
   const rgxExtension = /^(?=(?:[^0-9]*[0-9]){0,10}[^0-9]*$)[\d\s()+-]*$/;
   return rgxExtension.test(extension);
}

// Validates a Canadian Postal Code - returns true if valid, false otherwise
function validateCanadianPostal(source) {
   var postalCode = $('#' + source.controltovalidate).val();
   if (!postalCode) {
       return true;
   }
   const rgxPostalCode = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\s *\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i;
   return rgxPostalCode.test(postalCode);
}

// Validates Positive Number Maximum Seven Digits - returns true if valid, false otherwise
function validatePositiveNumberOnlyMaxSevenDigits(source) {
   var numberMaxSevenOnly = $('#' + source.controltovalidate).val();
   if (!numberMaxSevenOnly) {
       return true;
   }
   const rgxNumberMaxSevenOnly =  /^(?:[1-9][0-9]{0,6})$/;
   return rgxNumberMaxSevenOnly.test(numberMaxSevenOnly);
}

// Validates Positive Number Only - returns true if valid, false otherwise
function validatePositiveNumberOnly(source) {
   var numberOnly = $('#' + source.controltovalidate).val();
   if (!numberOnly) {
       return true;
   }
   const rgxNumberOnly =  /^\d+$/;
   return rgxNumberOnly.test(numberOnly);
}

// Small shared helper — same targeting pattern you use elsewhere
function _fileInputFor(src){
  var baseId = src && src.controltovalidate ? src.controltovalidate : '';
  return document.getElementById(baseId + '_input_file') || document.getElementById(baseId);
}
// Validates if a file is selected - returns true if valid, false otherwise
function validateFileSelected(source) {
  // Prefer the visible file input; fall back to base id
  var fin = _fileInputFor(source);
  if (!fin) {
    // If the control can't be located, fail closed for "required"
    // so we don't accidentally pass a required field silently.
    return false;
  }

  // Native file list (most reliable)
  if (fin.files && typeof fin.files.length === 'number') {
    return fin.files.length > 0;
  }

  // Fallback: value attribute (older browsers)
  var val = (fin.value || '').trim();
  return val.length > 0;
}

/**
 * Validate that the picked file is NOT zero bytes.
 * Returns:
 *   true  -> no file picked OR size > 0
 *   false -> file picked and size === 0
 */
function validateFileNotZero(src){
  var fin = _fileInputFor(src);
  if (!fin) return true; // can't validate → don't block
  var f = fin.files && fin.files[0];
  if (!f) return true;   // no new file → let "required" handle presence
  return f.size !== 0;   // only fail on exactly zero
}

/**
 * Validate that the picked file does NOT exceed the max size.
 * Max resolution order:
 *   1) data-max-bytes on the input (string int)
 *   2) window.DEFAULT_MAX_FILE_BYTES (number)
 *   3) 4 MiB default
 *
 * Returns:
 *   true  -> no file picked OR size <= max
 *   false -> file picked and size > max
 */
function validateFileMaxSize(src){
  var fin = _fileInputFor(src);
  if (!fin) return true;
  var f = fin.files && fin.files[0];
  if (!f) return true;

  var fromAttr = fin.getAttribute('data-max-bytes');
  var maxBytes =
    (fromAttr && !isNaN(fromAttr)) ? parseInt(fromAttr, 10) :
    (typeof window.DEFAULT_MAX_FILE_BYTES === 'number' ? window.DEFAULT_MAX_FILE_BYTES :
     4 * 1024 * 1024); // 4 MiB

  return f.size <= maxBytes;
}

// Accept only: PDF, JPG, PNG, GIF
function validateFileType(source) {
  const allowed = new Set(['pdf', 'jpg', 'png', 'gif']); // hard-coded set per requirements

  // Power Pages: try *_input_file first, then raw id
  let $inp = $('#' + source.controltovalidate + '_input_file');
  if (!$inp.length) $inp = $('#' + source.controltovalidate);

  const el = $inp.get(0);
  if (!el || !el.files || el.files.length === 0) return true; // nothing selected → let "required" handle presence

  const file = el.files[0]; // only check the first file
  const name = String(file.name || '').trim();
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return false; // no extension or starts with '.'

  const ext = name.slice(dot + 1).toLowerCase();
  return allowed.has(ext);
}

function getFileBaseId(source) {
  const cid = String(source && source.controltovalidate || '');
  return cid
    .replace(/hidden_(filename|filetype|file_size)$/i, '')
    .replace(/_input_file$/i, '');
}

// Enable/disable the built-in RequiredFieldValidator for this file control,
// and hide/show the default required message block (<span id="<base>_err">)
function toggleRequiredForFile(baseId, hasFile) {
  const reqId = 'RequiredFieldValidator' + baseId + 'hidden_filename';
  const req = document.getElementById(reqId);
  if (req) req.enabled = !hasFile;

  const msg = document.getElementById(baseId + '_err');
  if (msg) msg.style.display = hasFile ? 'none' : ''; // hide when a file is chosen
}


function compare2Number(controlId1, controlId2) {
    const controlLabelId = controlId1 + "_label";
    const controlId = controlId1;

    // Get the values of the two fields
    var numberA = $("#" + controlId1).val();
    var numberB = $("#" + controlId2).val();
  
    //Skip validation if either field is empty
    if (numberA === "" || numberB === "") {
        return true;  // Skip comparison if the fields do not contain numbers
    }
    // Validate if both fields contain valid positive numbers
    if (!/^\d+$/.test(numberA) || !/^\d+$/.test(numberB)) {
        return false;  // Skip comparison if the fields do not contain valid numbers
    }
    // Convert values to numbers for comparison
    numberA = Number(numberA);
    numberB = Number(numberB);

    // Check if numberA is less than numberB
    if (numberA < numberB) {
          return false;  // Validation fails if numberA is less than numberB
    }

    return true;  // Validation passes if both fields are valid numbers and the comparison is correct
}

// Compare two date fields: returns true if controlId1 <= controlId2
function compare2Dates(controlId1, controlId2) {
  // Use your helper so we read the *real* input even with date polyfills
  const $a = getFocusableField(controlId1, 'date');
  const $b = getFocusableField(controlId2, 'date');

  const rawA = String(($a && $a.val()) || '').trim();
  const rawB = String(($b && $b.val()) || '').trim();

  // If either is empty, don't block submission here
  if (!rawA || !rawB) return true;

  const toMillis = (raw) => {
    if (raw === 'Invalid date') return NaN;

    // Normalize common formats:
    //  - 'YYYY-MM-DD' (date only) → interpret as UTC midnight for deterministic compare
    //  - 'YYYY-MM-DD HH:mm'       → make ISO-like by replacing space with 'T'
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}(?::\d{2})?)?)?$/);
    if (m) {
      if (!m[2]) return Date.parse(m[1] + 'T00:00:00Z');
      const isoish = raw.replace(' ', 'T');
      const t = Date.parse(isoish);
      if (!isNaN(t)) return t;
    }
    return Date.parse(raw);
  };

  const tA = toMillis(rawA);
  const tB = toMillis(rawB);

  // Invalid parse → fail validation
  if (isNaN(tA) || isNaN(tB)) return false;

  // Pass when A <= B
  return tA <= tB;
};

/* ========= Date/Time helpers (private) ========= */

// Real calendar check for YYYY-MM-DD
function _isValidYmd(ymd){
  var m = /^(\d{4})\-(0[1-9]|1[0-2])\-(0[1-9]|[12]\d|3[01])$/.exec((ymd || '').trim());
  if (!m) return false;
  var y = +m[1], mo = +m[2]-1, d = +m[3];
  var dt = new Date(Date.UTC(y, mo, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo && dt.getUTCDate() === d;
}

// 24h time (HH:mm or HH:mm:ss)
function _isValidTime24(t){
  return /^(?:([01]?\d|2[0-3])):([0-5]\d)(?::([0-5]\d))?$/.test((t || '').trim());
}

// 12h time (h:mm or h:mm:ss with AM/PM, case/periods tolerant)
function _isValidTime12(t){
  return /^(?:0?[1-9]|1[0-2]):([0-5]\d)(?::([0-5]\d))?\s*([Aa]\.?[Mm]\.?|[Pp]\.?[Mm]\.?)$/.test((t || '').trim());
}

// Split "date sep time" (sep can be space or 'T')
function _splitDateTime(s){
  var str = (s || '').trim();
  var sp  = str.indexOf(' ');
  var tp  = str.indexOf('T');
  var p   = (sp >= 0 ? sp : tp);
  if (p < 0) return { date: str, time: '' };
  return { date: str.slice(0, p), time: str.slice(p+1) };
}

// YYYY-MM-DD HH:mm[:ss] (24h)
function _isValidYmdHm24(s){
  var parts = _splitDateTime(s);
  return _isValidYmd(parts.date) && _isValidTime24(parts.time);
}

// YYYY-MM-DD h:mm[:ss] AM/PM (12h)
function _isValidYmdHm12(s){
  var parts = _splitDateTime(s);
  return _isValidYmd(parts.date) && _isValidTime12(parts.time);
}

// Read the logical value PP submits for date/datetime fields
function _readLogicalValue(id){
  if (typeof getCompositeDateTimeValue === 'function') {
    return (getCompositeDateTimeValue(id) || '').trim();
  }
  var el = document.getElementById(id);
  return (el && el.value || '').trim();
}

// Read time from time-only UI/backing
function _readTimeOnlyValue(id){
  var tEl = document.getElementById(id + '_timepicker_description') ||
            document.getElementById(id + '_timepicker');
  if (tEl) return (tEl.value || '').trim();
  var el = document.getElementById(id);
  return (el && el.value || '').trim();
}

/* ========= Public Date validators ========= */

// Date-only (YYYY-MM-DD)
function validateDateOnly(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmd(val);
  source.isvalid = ok; return ok;
}

// Datetime — 24h only (YYYY-MM-DD HH:mm[:ss] or 'T' separator)
function validateDateTime24(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm24(val);
  source.isvalid = ok; return ok;
}

// Datetime — 12h only (YYYY-MM-DD h:mm[:ss] AM/PM)
function validateDateTime12(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm12(val);
  source.isvalid = ok; return ok;
}

// Datetime — accept EITHER 24h OR 12h
function validateDateTimeFlex(source){
  var id  = source.controltovalidate;
  var val = _readLogicalValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidYmdHm24(val) || _isValidYmdHm12(val);
  source.isvalid = ok; return ok;
}

// Time-only — 24h (HH:mm[:ss])
function validateTime24(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime24(val);
  source.isvalid = ok; return ok;
}

// Time-only — 12h (h:mm[:ss] AM/PM)
function validateTime12(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime12(val);
  source.isvalid = ok; return ok;
}

// Time-only — accept EITHER 24h OR 12h
function validateTimeFlex(source){
  var id  = source.controltovalidate;
  var val = _readTimeOnlyValue(id);
  if (val === '') { source.isvalid = true; return true; }
  var ok = _isValidTime24(val) || _isValidTime12(val);
  source.isvalid = ok; return ok;
}
