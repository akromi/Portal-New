# File Native Bridge - Usage Guide

## Overview

The `file-native-bridge.js` module provides a native/stock file-upload error "bridge" that converts browser and Power Pages file validation messages into WET4-compliant inline + summary UX.

NEW: Programmatic-only model — The bridge no longer relies on a markup attribute or global auto-scan. You must explicitly enable it via JavaScript for the forms/fields you want validated.

## Features

- ✅ Single Error Display: Shows only one error at a time, respecting validator order: required → zero-byte → max-size → file-type
- ✅ Full Localization: Supports EN/FR with default messages and per-field customization
- ✅ Configurable: Extensions and max size can be set via data attributes
- ✅ Accessible: Reuses existing inline error rendering and summary pipeline
- ✅ Integrated: Works seamlessly with existing validation flow
- ✅ Auto-suppression: Hides stock/PP file error blocks automatically
- ✅ Programmatic Opt-In: Only validates file inputs that you explicitly enable

## Quick Start

### 1. Include the Script

Add the script to your page after jQuery and the existing validators:

```html
<script src="validators.js"></script>
<script src="validations.js"></script>
<script src="fileInput.js"></script>
<script src="file-native-bridge.js"></script>
```

### 2. Opt-In Programmatically

IMPORTANT: The bridge will NOT validate any file inputs unless you opt-in using one of these programmatic methods:

#### Method A: Enable an entire form

```html
<form id="myForm">
  <label id="myfile_label" for="myfile_input_file">Upload Document</label>
  <input type="file" id="myfile_input_file" />
  <button type="submit">Submit</button>
</form>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    // Enable by selector
    FileStockSuppression.enableForForm('#myForm');

    // Or enable by element reference
    const form = document.getElementById('myForm');
    FileStockSuppression.enableForForm(form);

    // Alias is also available
    FileStockSuppression.registerForm('#myForm');
  });
</script>
```

Once enabled, the bridge will automatically:
- Register all file inputs within that form (ids ending with `_input_file`)
- Use default allowed extensions: pdf, jpg, png, gif
- Use default max size: 4 MiB
- Show localized messages in EN or FR based on `<html lang="...">`

#### Method B: Enable a specific field

```html
<script>
  document.addEventListener('DOMContentLoaded', function () {
    // Opt-in just this baseId (e.g., 'resume' for resume_input_file)
    FileStockSuppression.enableForField('resume');
  });
</script>
```

#### Method C (optional): Global bootstrap (no markup)

Provide a config before the script loads; the bridge will opt in on DOM ready:

```html
<script>
  window.FILE_BRIDGE_CFG = {
    includeForms: ['#myForm', '#secondaryForm'],
    includeFields: ['resume', 'transcript']
  };
</script>
<script src="file-native-bridge.js"></script>
```

## Configuration

### Allowed File Extensions

Use the `data-allowed-ext` attribute to customize allowed extensions:

```html
<input type="file" id="myfile_input_file"
       data-allowed-ext="pdf,docx,xlsx" />
```

You can use comma or space separators, and mixed case (normalized to lowercase):

```html
<!-- All valid: -->
<input data-allowed-ext="pdf,jpg,png,gif">
<input data-allowed-ext="pdf jpg png gif">
<input data-allowed-ext="PDF, JPG, PNG, GIF">
```

### Maximum File Size

Use the `data-max-bytes` attribute to set a custom max size:

```html
<!-- 1 MB limit -->
<input type="file" id="myfile_input_file" data-max-bytes="1048576" />

<!-- 10 MB limit -->
<input type="file" id="myfile_input_file" data-max-bytes="10485760" />
```

If not specified, defaults to:
1. `window.DEFAULT_MAX_FILE_BYTES` (if set globally)
2. 4 MiB (4194304 bytes)

### Custom Error Messages

Override default messages with data attributes:

```html
<input type="file" id="myfile_input_file"
       data-msg-required-en="Please select a file to upload"
       data-msg-required-fr="Veuillez sélectionner un fichier"
       data-msg-zero-en="Empty files cannot be uploaded"
       data-msg-zero-fr="Les fichiers vides ne peuvent pas être téléchargés"
       data-msg-max-en="File exceeds {MB} MB limit"
       data-msg-max-fr="Le fichier dépasse la limite de {MB} Mo"
       data-msg-type-en="Only {list} files are allowed"
       data-msg-type-fr="Seuls les fichiers {list} sont autorisés" />
```

Placeholders:
- `{MB}` - Replaced with max file size in MB (calculated from data-max-bytes)
- `{list}` - Replaced with comma-separated list of allowed extensions

## Default Messages

### English (EN)
- Required: "This file is required."
- Zero-byte: "The selected file is empty (0 bytes). Please choose a non-empty file."
- Max size: "The file is too large. Maximum file size is {MB} MB."
- File type: "The file type is not allowed. Allowed types: {list}."

### French (FR) — typographically correct
- Required: "Ce fichier est obligatoire."
- Zero-byte: "Le fichier sélectionné est vide (0\u00A0octet). Veuillez choisir un fichier non vide."
- Max size: "Le fichier est trop volumineux. La taille maximale est de {MB}\u00A0Mo."
- File type: "Le type de fichier n\u2019est pas autorisé. Types permis\u00A0: {list}."

## Advanced Usage

### Manual Registration (Advanced)

For dynamically added fields or fine-grained control:

```javascript
// Register a single file input (only works if the field or its form is opted in)
window.FileStockSuppression.register('myfile');

// Unregister a file input
window.FileStockSuppression.unregister('myfile');

// Unregister all file inputs across all forms
window.FileStockSuppression.unregisterAll();
```

Note: `register('myfile')` is a no-op unless you have explicitly called `enableForField('myfile')` or enabled its ancestor form via `enableForForm(...)`.

### Integration with validations.js

The bridge automatically integrates with the existing `addChangeEvents` flow. When you call:

```javascript
addChangeEvents('myfile', 'file');
```

It will also call `window.FileStockSuppression.register('myfile')` automatically. If the field has not been opted in (directly or via form), the registration will be silently skipped.

## Validation Order

The bridge evaluates conditions in this exact order and shows only the first failing condition:

1. Required: File must be selected
2. Zero-byte: File size must be > 0 bytes
3. Max size: File size must be ≤ max-bytes
4. File type: File extension must be in allowed list

This ensures users see the most important error first.

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>File Upload Example</title>
</head>
<body>
  <!-- Validation Summary -->
  <div id="ValidationSummaryEntityFormView" style="display:none;">
    <h2>Validation Errors</h2>
    <ul></ul>
  </div>

  <form id="contractForm">
    <label id="contract_label" for="contract_input_file">
      <span class="field-name">Contract Document</span>
      <strong class="required">(required)</strong>
    </label>
    <input type="file"
           id="contract_input_file"
           data-allowed-ext="pdf,docx"
           data-max-bytes="5242880"
           data-msg-required-en="A contract document is required"
           data-msg-required-fr="Un document de contrat est requis"
           data-msg-max-en="Contract must be under {MB} MB"
           data-msg-max-fr="Le contrat doit faire moins de {MB} Mo" />
    <button type="submit">Submit</button>
  </form>

  <!-- Scripts -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="validators.js"></script>
  <script src="validations.js"></script>
  <script src="fileInput.js"></script>
  <script src="file-native-bridge.js"></script>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      // Enable entire form
      FileStockSuppression.enableForForm('#contractForm');

      // Or enable specific fields (base IDs)
      FileStockSuppression.enableForField('contract');
    });
  </script>
</body>
</html>
```

## Troubleshooting

### Bridge Not Working?

1. Ensure you opted in via `enableForForm(...)` and/or `enableForField(...)` (there is no markup attribute).
2. Check script load order: Bridge must load after jQuery, validators.js, validations.js.
3. Check console: Look for `[file-bridge]` log messages.
4. Verify input ID: Prefer ids ending with `_input_file` or match the base ID exactly.
5. Check Page_Validators: `console.log(Page_Validators)` to see if bridge validators are added.

### Multiple Errors Showing?

The bridge ensures only one error shows at a time. If you see multiple:
- Check that stock validators are being suppressed (should happen automatically)
- Verify `suppressStockFileErrors` is defined and working

### Wrong Language?

Messages are based on `<html lang="...">`:
- `lang="en"` or `lang="en-US"` → English
- `lang="fr"` or `lang="fr-CA"` → French
- Default if missing → English

Change the HTML lang attribute to switch languages:
```javascript
document.documentElement.setAttribute('lang', 'fr');
```

## API Reference

### FileStockSuppression.enableForForm(formSelectorOrEl)
Enable the bridge for a specific form and auto-register all its file inputs.
- formSelectorOrEl (string | Element): CSS selector or form element
- Returns: Number of file inputs registered

```javascript
// By selector
FileStockSuppression.enableForForm('#myForm');

// By element
const form = document.getElementById('myForm');
FileStockSuppression.enableForForm(form);
```

### FileStockSuppression.registerForm(formSelectorOrEl)
Alias for `enableForForm()`.

### FileStockSuppression.enableForField(baseId)
Enable the bridge for a specific file field (base ID).
- baseId (string): Base ID of the file input (without `_input_file` suffix)
- Returns: 1 if called successfully

```javascript
FileStockSuppression.enableForField('resume');
```

### FileStockSuppression.register(id)
Register a file input for bridge validation (only if the field or its form is opted in).
- id (string): Base ID of the file input (without `_input_file` suffix)

### FileStockSuppression.unregister(id)
Unregister a file input and remove its bridge validators.
- id (string): Base ID of the file input

### FileStockSuppression.unregisterAll()
Unregister all file inputs across all forms.

## Technical Details

### How It Works

1. There is no global auto-scan. Nothing runs unless you opt in.
2. When a form is enabled: the bridge finds all `input[type="file"][id$="_input_file"]` in that form and registers them.
3. When a field is enabled: the bridge registers that baseId immediately.
4. When validation runs:
   - Bridge validator checks conditions in order and sets `validator.errormessage` to a localized message link.
   - Returns true/false to integrate with your existing error rendering.
5. Optional bootstrap: if `window.FILE_BRIDGE_CFG` is defined before the script loads, it will opt in the specified forms/fields on DOM ready.

### Compatibility

- jQuery: Required (already used by existing validators)
- Page_Validators: Required (Power Pages validation framework)
- Browsers: Modern browsers with File API support
- Power Pages: Compatible with standard PP file input structure

## Support

For issues or questions, check:
1. Console logs (search for `[file-bridge]`)
2. This documentation