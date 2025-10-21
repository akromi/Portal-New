# Portal-New

## File Upload Validation System

This repository contains a comprehensive file upload validation system for Power Pages with WET4 compliance.

### Key Files

- **validators.js** - Core validator functions (validateFileSelected, validateFileNotZero, validateFileMaxSize, validateFileType)
- **validations.js** - Global validation orchestration, error rendering, and accessibility framework
- **fileInput.js** - File input accessibility helpers and stock error suppression
- **file-native-bridge.js** - NEW: Native file validation bridge with EN/FR localization

### Recent Updates

#### File Native Bridge (NEW)
A native/stock file-upload error "bridge" that converts browser/PP file validation messages into WET4-compliant inline + summary UX.

**Features:**
- Single error display (respects order: required → zero-byte → max-size → file-type)
- Full EN/FR localization with default messages
- Configurable via data attributes (data-allowed-ext, data-max-bytes)
- Per-field message customization
- Automatic integration with existing validation pipeline
- Stock error suppression

**Quick Start:**
```html
<input type="file" id="myfile_input_file" 
       data-allowed-ext="pdf,docx,xlsx"
       data-max-bytes="5242880" />
```

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

2. The bridge auto-registers all file inputs on page load

3. Validation runs automatically on change/submit

### Documentation

- [File Bridge Usage Guide](FILE-BRIDGE-USAGE.md) - Complete guide for file validation bridge
- See inline comments in each file for detailed documentation