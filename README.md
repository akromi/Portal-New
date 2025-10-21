# Portal-New

## File Upload Validation System

This repository contains a comprehensive file upload validation system for Power Pages with WET4 compliance.

### Key Files

- **validators.js** - Core validator functions (validateFileSelected, validateFileNotZero, validateFileMaxSize, validateFileType)
- **validations.js** - Global validation orchestration, error rendering, and accessibility framework
- **fileInput.js** - File input accessibility helpers and stock error suppression
- **file-native-bridge.js** - Native file validation bridge with EN/FR localization and **per-form opt-in**

### Recent Updates

#### File Native Bridge (Per-Form Opt-In Model)
A native/stock file-upload error "bridge" that converts browser/PP file validation messages into WET4-compliant inline + summary UX.

**NEW: Opt-In Required** — The bridge no longer auto-registers all file inputs globally. You must explicitly enable it for each form.

**Features:**
- Single error display (respects order: required → zero-byte → max-size → file-type)
- Full EN/FR localization with default messages
- Configurable via data attributes (data-allowed-ext, data-max-bytes)
- Per-field message customization
- Automatic integration with existing validation pipeline
- Stock error suppression
- **Per-form opt-in to prevent unintended validation**

**How to Enable:**

Method 1 - Markup (Recommended):
```html
<form data-file-bridge="on">
  <input type="file" id="myfile_input_file" 
         data-allowed-ext="pdf,docx,xlsx"
         data-max-bytes="5242880" />
</form>
```

Method 2 - Programmatic:
```javascript
FileStockSuppression.enableForForm('#myForm');
// or
FileStockSuppression.registerForm(document.getElementById('myForm'));
```

**Important**: Forms without `data-file-bridge="on"` will NOT have their file inputs validated by the bridge. This prevents validation on submission review pages or other pages where file validation is not desired.

See [FILE-BRIDGE-USAGE.md](FILE-BRIDGE-USAGE.md) for complete documentation.

#### validators.js Updates
- `validateFileType` now reads `data-allowed-ext` dynamically
- Falls back to default extensions [pdf, jpg, png, gif]
- Supports comma or space-separated extension lists

### Usage

1. Include scripts in order:
```html
<script src="validators.js"></script>
<script src="validations.js"></script>
<script src="fileInput.js"></script>
<script src="file-native-bridge.js"></script>
```

2. Enable the bridge for forms that need file validation:
```html
<form data-file-bridge="on">
  <!-- file inputs here will be validated -->
</form>
```

3. Validation runs automatically on change/submit for opted-in forms

### Documentation

- [File Bridge Usage Guide](FILE-BRIDGE-USAGE.md) - Complete guide for file validation bridge
- See inline comments in each file for detailed documentation