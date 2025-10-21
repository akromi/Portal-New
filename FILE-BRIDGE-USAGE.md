# File Native Bridge - Usage Guide

## Overview

The `file-native-bridge.js` module provides a native/stock file-upload error "bridge" that converts browser and Power Pages file validation messages into WET4-compliant inline + summary UX.

**NEW: Per-Form Opt-In Model** — The bridge no longer auto-registers all file inputs globally. You must explicitly enable it for each form that needs file validation.

## Features

- ✅ **Single Error Display**: Shows only one error at a time, respecting validator order: required → zero-byte → max-size → file-type
- ✅ **Full Localization**: Supports EN/FR with default messages and per-field customization
- ✅ **Configurable**: Extensions and max size can be set via data attributes
- ✅ **Accessible**: Reuses existing inline error rendering and summary pipeline
- ✅ **Integrated**: Works seamlessly with existing validation flow
- ✅ **Auto-suppression**: Hides stock/PP file error blocks automatically
- ✅ **Per-Form Opt-In**: Only validates file inputs in forms that explicitly enable the bridge

## Quick Start

### 1. Include the Script

Add the script to your page **after** jQuery and the existing validators:

```html
<script src="validators.js"></script>
<script src="validations.js"></script>
<script src="fileInput.js"></script>
<script src="file-native-bridge.js"></script>
```

### 2. Opt-In Per Form

**IMPORTANT**: The bridge will NOT validate any file inputs unless you opt-in a form using one of these methods:

#### Method A: Markup (Recommended)

Add `data-file-bridge="on"` to your form element:

```html
<form data-file-bridge="on">
  <label id="myfile_label" for="myfile_input_file">Upload Document</label>
  <input type="file" id="myfile_input_file" />
  <button type="submit">Submit</button>
</form>
```

#### Method B: Programmatic

Call `FileStockSuppression.enableForForm()` on page load:

```html
<form id="myForm">
  <label id="myfile_label" for="myfile_input_file">Upload Document</label>
  <input type="file" id="myfile_input_file" />
  <button type="submit">Submit</button>
</form>

<script>
  // Enable by selector
  FileStockSuppression.enableForForm('#myForm');
  
  // Or enable by element reference
  const form = document.getElementById('myForm');
  FileStockSuppression.enableForForm(form);
  
  // Or use the alias
  FileStockSuppression.registerForm('#myForm');
</script>
```

Once opted in, the bridge will automatically:
- Register all file inputs within that form
- Use default allowed extensions: pdf, jpg, png, gif
- Use default max size: 4 MB
- Show appropriate error messages in EN or FR based on `<html lang="...">`

## Configuration

### Allowed File Extensions

Use the `data-allowed-ext` attribute to customize allowed extensions:

```html
<input type="file" id="myfile_input_file" 
       data-allowed-ext="pdf,docx,xlsx" />
```

You can use comma or space separators, and mixed case (will be normalized to lowercase):

```html
<!-- All valid: -->
data-allowed-ext="pdf,jpg,png,gif"
data-allowed-ext="pdf jpg png gif"
data-allowed-ext="PDF, JPG, PNG, GIF"
```

### Maximum File Size

Use the `data-max-bytes` attribute to set a custom max size:

```html
<!-- 1 MB limit -->
<input type="file" id="myfile_input_file" 
       data-max-bytes="1048576" />

<!-- 10 MB limit -->
<input type="file" id="myfile_input_file" 
       data-max-bytes="10485760" />
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

**Placeholders:**
- `{MB}` - Replaced with max file size in MB (calculated from data-max-bytes)
- `{list}` - Replaced with comma-separated list of allowed extensions

## Default Messages

### English (EN)
- **Required**: "This file is required."
- **Zero-byte**: "The selected file is empty (0 bytes). Please choose a non-empty file."
- **Max size**: "The file is too large. Maximum file size is {MB} MB."
- **File type**: "The file type is not allowed. Allowed types: {list}."

### French (FR)
- **Required**: "Ce fichier est obligatoire."
- **Zero-byte**: "Le fichier sélectionné est vide (0 octet). Veuillez choisir un fichier non vide."
- **Max size**: "Le fichier est trop volumineux. La taille maximale est de {MB} Mo."
- **File type**: "Le type de fichier n'est pas autorisé. Types permis : {list}."

## Advanced Usage

### Manual Registration (Advanced)

For dynamically added fields or fine-grained control:

```javascript
// Register a single file input (only works if its form is opted in)
window.FileStockSuppression.register('myfile');

// Unregister a file input
window.FileStockSuppression.unregister('myfile');

// Unregister all file inputs across all forms
window.FileStockSuppression.unregisterAll();
```

**Note**: `register('myfile')` is a **no-op** unless the input's ancestor form has `data-file-bridge="on"` or was enabled via `enableForForm()`. This ensures the bridge only activates on opted-in forms.

### Integration with validations.js

The bridge automatically integrates with the existing `addChangeEvents` flow. When you call:

```javascript
addChangeEvents('myfile', 'file');
```

It will also call `window.FileStockSuppression.register('myfile')` automatically. However, if the form is not opted in, the registration will be silently skipped.

## Validation Order

The bridge evaluates conditions in this exact order and shows **only the first failing condition**:

1. **Required**: File must be selected
2. **Zero-byte**: File size must be > 0 bytes
3. **Max size**: File size must be ≤ max-bytes
4. **File type**: File extension must be in allowed list

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

  <!-- Form WITH opt-in - File validation will work -->
  <form data-file-bridge="on">
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

  <!-- Form WITHOUT opt-in - File validation will NOT run -->
  <form>
    <label id="review_file_label" for="review_file_input_file">
      Review File (No Validation)
    </label>
    <input type="file" id="review_file_input_file" />
    <button type="submit">Submit Review</button>
  </form>

  <!-- Scripts -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="validators.js"></script>
  <script src="validations.js"></script>
  <script src="fileInput.js"></script>
  <script src="file-native-bridge.js"></script>

  <script>
    // Add validators (only the opted-in form will validate files)
    addValidators([{
      id: 'contract',
      type: 'file',
      required: true,
      validators: []  // Bridge handles all validation
    }]);
  </script>
</body>
</html>
```

## Troubleshooting

### Bridge Not Working?

1. **Check form opt-in**: Ensure your form has `data-file-bridge="on"` OR you called `FileStockSuppression.enableForForm()`
2. **Check script load order**: Bridge must load after jQuery, validators.js, validations.js
3. **Check console**: Look for `[file-bridge]` log messages
4. **Verify input ID**: Must end with `_input_file` or match base ID exactly
5. **Check Page_Validators**: Run `console.log(Page_Validators)` to see if bridge validators are added

### Multiple Errors Showing?

The bridge ensures only one error shows at a time. If you see multiple:
- Check that stock validators are being suppressed (should happen automatically)
- Verify `suppressStockFileErrors` is defined and working

### Wrong Language?

Messages are based on `<html lang="...">` attribute:
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
- **formSelectorOrEl** (string | Element): CSS selector or form element
- **Returns**: Number of file inputs registered

```javascript
// By selector
FileStockSuppression.enableForForm('#myForm');

// By element
const form = document.getElementById('myForm');
FileStockSuppression.enableForForm(form);
```

### FileStockSuppression.registerForm(formSelectorOrEl)
Alias for `enableForForm()`.

### FileStockSuppression.register(id)
Register a file input for bridge validation (only if its form is opted in).
- **id** (string): Base ID of the file input (without `_input_file` suffix)

### FileStockSuppression.unregister(id)
Unregister a file input and remove its bridge validators.
- **id** (string): Base ID of the file input

### FileStockSuppression.unregisterAll()
Unregister all file inputs across all forms.

## Technical Details

### How It Works

1. On page load, finds all `form[data-file-bridge="on"]` elements
2. For each opted-in form:
   - Finds all `input[type="file"][id$="_input_file"]` within that form
   - Creates a bridge validator object for each
   - Adds it to `Page_Validators` array (after existing validators for that field)
   - Hooks into the `invalid` event to prevent native browser tooltips
   - Calls `suppressStockFileErrors` to hide PP stock messages
3. When validation runs:
   - Bridge validator checks all conditions in order
   - Sets `validator.errormessage` to localized message link
   - Returns true/false to integrate with existing error rendering
4. Forms without `data-file-bridge="on"` are ignored — their file inputs will NOT be validated by the bridge

### Compatibility

- **jQuery**: Required (already used by existing validators)
- **Page_Validators**: Required (Power Pages validation framework)
- **Browsers**: Modern browsers with File API support
- **Power Pages**: Compatible with standard PP file input structure

## Support

For issues or questions, check:
1. Console logs (search for `[file-bridge]`)
2. This documentation
3. Test file: `/tmp/test-file-bridge.html` (if available)
