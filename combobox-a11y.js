/**
 * combobox-a11y.js
 * 
 * ARIA 1.2 Combobox utility for accessible autocomplete controls.
 * Provides keyboard navigation and screen reader support for combobox pattern.
 * 
 * Not auto-bound - page authors must explicitly call setupCombobox() for each control.
 * 
 * Usage:
 *   setupCombobox({
 *     input: document.getElementById('myInput'),
 *     listbox: document.getElementById('myListbox'),
 *     getOptions: () => listbox.querySelectorAll('[role="option"]'),
 *     onCommit: (option) => { console.log('Selected:', option.textContent); }
 *   });
 */

(function (window) {
  'use strict';

  /**
   * Sets up ARIA 1.2 combobox pattern on an input + listbox container.
   * 
   * @param {Object} config - Configuration object
   * @param {HTMLElement} config.input - The text input element
   * @param {HTMLElement} config.listbox - The listbox container element
   * @param {Function} config.getOptions - Function that returns array/NodeList of option elements
   * @param {Function} config.onCommit - Callback when user commits a selection (Enter key)
   * @param {boolean} [config.autoExpand=true] - Auto-expand listbox on focus
   * @param {string} [config.expandedClass='expanded'] - Class to add when expanded
   */
  function setupCombobox(config) {
    const {
      input,
      listbox,
      getOptions,
      onCommit,
      autoExpand = true,
      expandedClass = 'expanded'
    } = config;

    if (!input || !listbox || typeof getOptions !== 'function') {
      console.error('[combobox-a11y] Invalid configuration: missing required elements or getOptions');
      return;
    }

    // Prevent duplicate setup
    if (input.dataset.comboboxSetup === 'true') {
      return;
    }
    input.dataset.comboboxSetup = 'true';

    // Generate unique IDs if not present
    if (!input.id) input.id = 'combobox_' + Math.random().toString(36).substr(2, 9);
    if (!listbox.id) listbox.id = input.id + '_listbox';

    // Apply ARIA roles and attributes
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listbox.id);
    input.setAttribute('autocomplete', 'off'); // Disable browser autocomplete

    listbox.setAttribute('role', 'listbox');
    if (!listbox.getAttribute('aria-label') && !listbox.getAttribute('aria-labelledby')) {
      // Fallback label for listbox
      const label = document.querySelector('label[for="' + input.id + '"]');
      if (label && label.id) {
        listbox.setAttribute('aria-labelledby', label.id);
      }
    }

    // State tracking
    let activeIndex = -1;
    let isExpanded = false;

    /**
     * Gets the current array of option elements
     */
    function getCurrentOptions() {
      const opts = getOptions();
      return Array.isArray(opts) ? opts : Array.from(opts || []);
    }

    /**
     * Ensures each option has a unique ID and role="option"
     */
    function ensureOptionIds() {
      const options = getCurrentOptions();
      options.forEach((opt, idx) => {
        if (!opt.id) {
          opt.id = listbox.id + '_option_' + idx;
        }
        if (!opt.getAttribute('role')) {
          opt.setAttribute('role', 'option');
        }
      });
    }

    /**
     * Expands the listbox
     */
    function expand() {
      if (isExpanded) return;
      
      ensureOptionIds();
      isExpanded = true;
      input.setAttribute('aria-expanded', 'true');
      listbox.classList.add(expandedClass);
      
      // Reset active descendant
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
    }

    /**
     * Collapses the listbox
     */
    function collapse() {
      if (!isExpanded) return;
      
      isExpanded = false;
      input.setAttribute('aria-expanded', 'false');
      listbox.classList.remove(expandedClass);
      input.removeAttribute('aria-activedescendant');
      
      // Clear visual focus from options
      const options = getCurrentOptions();
      options.forEach(opt => opt.classList.remove('focused', 'active'));
      activeIndex = -1;
    }

    /**
     * Sets the active option by index
     */
    function setActiveOption(index) {
      const options = getCurrentOptions();
      if (index < 0 || index >= options.length) {
        input.removeAttribute('aria-activedescendant');
        options.forEach(opt => opt.classList.remove('focused', 'active'));
        activeIndex = -1;
        return;
      }

      activeIndex = index;
      const activeOption = options[activeIndex];
      
      // Update aria-activedescendant
      if (activeOption && activeOption.id) {
        input.setAttribute('aria-activedescendant', activeOption.id);
      }

      // Update visual focus
      options.forEach((opt, idx) => {
        if (idx === activeIndex) {
          opt.classList.add('focused', 'active');
          // Scroll into view if needed
          opt.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          opt.classList.remove('focused', 'active');
        }
      });
    }

    /**
     * Moves focus to next/previous option
     */
    function moveActiveOption(direction) {
      const options = getCurrentOptions();
      if (options.length === 0) return;

      let newIndex = activeIndex + direction;
      
      // Wrap around
      if (newIndex < 0) {
        newIndex = options.length - 1;
      } else if (newIndex >= options.length) {
        newIndex = 0;
      }

      setActiveOption(newIndex);
    }

    /**
     * Commits the current selection
     */
    function commitSelection() {
      const options = getCurrentOptions();
      if (activeIndex >= 0 && activeIndex < options.length) {
        const selectedOption = options[activeIndex];
        
        // Call the onCommit callback
        if (typeof onCommit === 'function') {
          onCommit(selectedOption);
        }
        
        // Update input value if option has text
        if (selectedOption.textContent) {
          input.value = selectedOption.textContent.trim();
        }
        
        collapse();
      }
    }

    // Event: Input focus - auto-expand if enabled
    input.addEventListener('focus', function () {
      if (autoExpand) {
        expand();
      }
    });

    // Event: Input blur - collapse after a delay (allow click on option)
    input.addEventListener('blur', function () {
      setTimeout(function () {
        collapse();
      }, 200);
    });

    // Event: Input keydown - keyboard navigation
    input.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isExpanded) {
            expand();
          } else {
            moveActiveOption(1);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (!isExpanded) {
            expand();
          } else {
            moveActiveOption(-1);
          }
          break;

        case 'Enter':
          if (isExpanded && activeIndex >= 0) {
            e.preventDefault();
            commitSelection();
          }
          break;

        case 'Escape':
          e.preventDefault();
          collapse();
          break;

        case 'Tab':
          // Allow Tab to exit; collapse on blur will handle cleanup
          break;

        default:
          // For typing, expand if not already expanded
          if (!isExpanded && e.key.length === 1) {
            expand();
          }
          break;
      }
    });

    // Event: Input change - refresh options when input value changes
    input.addEventListener('input', function () {
      if (isExpanded) {
        ensureOptionIds();
        // Reset active option when filtering
        setActiveOption(-1);
      }
    });

    // Event: Click on option - commit selection
    listbox.addEventListener('click', function (e) {
      const option = e.target.closest('[role="option"]');
      if (option) {
        const options = getCurrentOptions();
        const idx = options.indexOf(option);
        if (idx >= 0) {
          setActiveOption(idx);
          commitSelection();
        }
      }
    });

    // Expose methods for external control if needed
    return {
      expand,
      collapse,
      setActiveOption,
      commitSelection,
      getCurrentOptions
    };
  }

  /**
   * Adds a visually-hidden hint text and links it to the input via aria-describedby.
   * Useful for providing additional context to screen reader users.
   * 
   * @param {HTMLElement} input - The combobox input element
   * @param {string} text - The hint text to add
   * @param {string} [hintId] - Optional ID for the hint element (auto-generated if not provided)
   * @returns {string} - The ID of the created hint element
   */
  function addComboboxHint(input, text, hintId) {
    if (!input || !text) {
      console.error('[combobox-a11y] Invalid parameters for addComboboxHint');
      return null;
    }

    // Generate hint ID if not provided
    const id = hintId || (input.id ? input.id + '_hint' : 'hint_' + Math.random().toString(36).substr(2, 9));

    // Check if hint already exists
    let hint = document.getElementById(id);
    if (!hint) {
      hint = document.createElement('div');
      hint.id = id;
      hint.className = 'wb-inv'; // visually hidden
      hint.textContent = text;
      
      // Insert hint after the input
      input.parentNode.insertBefore(hint, input.nextSibling);
    } else {
      // Update existing hint text
      hint.textContent = text;
    }

    // Add hint ID to aria-describedby (de-dupe)
    const currentDescribedBy = (input.getAttribute('aria-describedby') || '').trim();
    const ids = currentDescribedBy ? currentDescribedBy.split(/\s+/) : [];
    
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      input.setAttribute('aria-describedby', ids.join(' '));
    }

    return id;
  }

  // Export to global scope
  window.ComboboxA11y = {
    setupCombobox,
    addComboboxHint
  };

  // Also export individual functions for convenience
  window.setupCombobox = setupCombobox;
  window.addComboboxHint = addComboboxHint;

})(window);
