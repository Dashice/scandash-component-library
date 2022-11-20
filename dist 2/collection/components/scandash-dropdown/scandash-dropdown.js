import { h, getAssetPath, } from '@stencil/core';
import { generateID } from '../../utils';
/**
 * An object containing various commonly used selectors for the component.
 */
const SELECT = {
  COMBOBOX: '[role="combobox"]',
  LIST: '[role="listbox"]',
  /* OPTIONS: '[role="option"]', */ // Unused
  ENABLED_OPTIONS: '[role="option"]:not([aria-disabled="true"])',
  SELECTED_OPTION: '[role="option"][aria-selected="true"]',
};
export class ScandashDropdown {
  constructor() {
    // Variables
    this.id = generateID('dropdown');
    this.options = undefined;
    this.placeholder = undefined;
    this.itemSize = 48;
    this.fontSize = 16;
    this.sanitizedOptions = null;
    this.selectedOption = null;
    this.isExpanded = false;
  }
  // Watchers
  /**
   * If the options attribute or prop changes, we reinitialize the component.
   */
  handleOptionChanged() {
    this.isExpanded = false;
    this.sanitizeOptions();
    this.getInitialSelectedOption();
  }
  /**
   * If the dropdown is expanded, we render the options and attach
   * a click listener to the window used to collapse the dropdown when
   * a user clicks outside of it.
   */
  handleIsExpandedChanged() {
    var _a;
    if (!this.ref)
      return;
    const context = this;
    if (this.isExpanded) {
      addEventListener('click', this.handleClickOutside.bind(context));
      this.focusMostAppropriateOption();
      this.determineListHeight();
    }
    else {
      removeEventListener('click', this.handleClickOutside.bind(context));
      (_a = this.ref.shadowRoot.querySelector(SELECT.COMBOBOX)) === null || _a === void 0 ? void 0 : _a.focus();
    }
  }
  /**
   * When the selected options changes, we emit an event; returning
   * the `Option` object.
   */
  handleSelectedOptionChanged() {
    this.optionChange.emit(this.selectedOption);
  }
  // Methods
  /**
   * Publically exposed method, which when called, resets the `selectedOption`
   * to its default value, given the `option` prop or attribute configuration.
   */
  async reset() {
    this.getInitialSelectedOption();
  }
  // Methods (Private)
  /**
   * Sanitizes the `options` prop and converts it to an `Option[]`
   * if provided as a JSON `string`.
   */
  sanitizeOptions() {
    const sanitize = (options) => {
      // If options are not an array, throw a type error
      if (!Array.isArray(options)) {
        throw new Error('TypeError: Options attribute must be of type array.');
      }
      // If the array is empty, we throw an empty array error.
      if (options.length === 0) {
        throw new Error('Options attribute must contain at least one option.');
      }
      // Filter out some common bad data
      const filteredOptions = options.filter(option => {
        // Filter out array values that are not of type object
        if (typeof option !== 'object')
          return false;
        // Filter out objects that do not have a `value` or `label` key
        if (!option['label'] || !option['value'])
          return false;
        // Filter out objects whose `value` is not of type `"string"`
        if (typeof option['value'] !== 'string')
          return false;
        return true;
      });
      const uniqueFilteredOptions = new Map();
      // Remove any duplicate `Option` objects, if two `Option` objects
      // have the same `value` key / value pair.
      filteredOptions.forEach(option => {
        if (uniqueFilteredOptions.has(option.value))
          return;
        uniqueFilteredOptions.set(option.value, option);
      });
      this.sanitizedOptions = [...uniqueFilteredOptions.values()];
    };
    // If options is a string, we attempt to parse it as JSON.
    // Otherwise throw an invalid JSON error.
    if (typeof this.options === 'string') {
      let parsedOptions = null;
      try {
        parsedOptions = JSON.parse(this.options);
      }
      catch (error) {
        console.warn('Invalid JSON string');
      }
      sanitize(parsedOptions);
      return;
    }
    // If options is an array, we sanitize it without parsing.
    sanitize(this.options);
  }
  /**
   * Sets the initial selected option, if one is provided through
   * `options.selected`. If only one option is provided, it will
   * be automatically selected, regardless if `selected` key is set.
   */
  getInitialSelectedOption() {
    var _a, _b;
    const selectedOption = (_a = this.sanitizedOptions) === null || _a === void 0 ? void 0 : _a.find(option => option.selected && !option.disabled);
    const firstOption = this.sanitizedOptions.length === 1 ? (_b = this.sanitizedOptions) === null || _b === void 0 ? void 0 : _b[0] : null;
    // Prioritize `Option`'s with `selected` key, otherwise select
    // the first option if only one is provided.
    this.selectedOption = selectedOption || firstOption;
  }
  /**
   * When expanded, focuses either the selected option or the first option.
   */
  focusMostAppropriateOption() {
    var _a;
    const selectedOption = this.ref.shadowRoot.querySelector(SELECT.SELECTED_OPTION);
    const firstEnabledOption = this.ref.shadowRoot.querySelector(SELECT.ENABLED_OPTIONS);
    (_a = ((selectedOption || firstEnabledOption))) === null || _a === void 0 ? void 0 : _a.focus();
  }
  /**
   * When the user expands the dropdown, we ensure the max-height of the
   * dropdown prefers to be constrained to the available viewport space,
   * provided it does not become too short.
   *
   * The dropdown will, as a result be vertically scrollable if the max-height
   * is constrained this way.
   */
  determineListHeight() {
    if (!this.ref)
      return;
    const root = this.ref.shadowRoot;
    const combo = root.querySelector(SELECT.COMBOBOX);
    const list = root.querySelector(SELECT.LIST);
    if (!combo || !list)
      return;
    // We get the bounding rect of the combo box and get its current
    // bottom coordinate on the viewport. Then we proceed to subtract
    // the bottom coordinate from the viewport height to get the
    // available space below the combo box.
    // We also subtract 16px from the available space to for UX purposes,
    // to ensure the dropdown not touch the bottom of the viewport.
    // We use visualViewport on the window object to get the viewport height
    // as it is more accurate than the window.innerHeight property on iOS.
    const comboRect = combo.getBoundingClientRect();
    const comboBottom = comboRect.bottom;
    const viewportHeight = visualViewport.height || innerHeight;
    const availableListHeight = viewportHeight - comboBottom;
    const bottomOffset = 16; // 1em
    const maxHeight = availableListHeight - bottomOffset;
    if (maxHeight < 200) {
      list.style.maxHeight = '';
      return;
    }
    list.style.maxHeight = `${maxHeight}px`;
  }
  /**
   * When an option is clicked, it is selected and the dropdown is collapsed.
   */
  handleOptionClicked(option) {
    this.selectedOption = option;
    this.isExpanded = false;
  }
  /**
   * When the dropdown is expanded, clicking outside of the dropdown
   * will collapse it.
   */
  handleClickOutside(event) {
    if (!this.isExpanded)
      return;
    const target = event.target;
    if (!target.closest('scandash-dropdown'))
      this.isExpanded = false;
  }
  handleKeyUp(event) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!this.isExpanded || !this.ref)
      return;
    // Select all non-disabled options
    const optionsHTML = this.ref.shadowRoot.querySelectorAll(SELECT.ENABLED_OPTIONS);
    // Get the currently focused option index
    const target = event.target;
    const currentOptionsHTMLIndex = Array.from(optionsHTML).findIndex(option => option === target);
    // Filter out disabled options from sanitized `Option[]`
    const options = (_a = this.sanitizedOptions) === null || _a === void 0 ? void 0 : _a.filter(option => !option.disabled);
    switch (event.key) {
      // Select the focused option and close the dropdown.
      case 'Tab':
        this.isExpanded = false;
        this.selectedOption = options === null || options === void 0 ? void 0 : options[currentOptionsHTMLIndex];
      // Move visual focus to previous option.
      case 'ArrowDown':
        const nextIndex = currentOptionsHTMLIndex + 1;
        (_b = optionsHTML[nextIndex]) === null || _b === void 0 ? void 0 : _b.focus();
        return;
      // Move visual focus to next option.
      case 'ArrowUp':
        const prevIndex = currentOptionsHTMLIndex - 1;
        (_c = optionsHTML[prevIndex]) === null || _c === void 0 ? void 0 : _c.focus();
        return;
      // Close the dropdown.
      case 'Escape':
        this.isExpanded = false;
        return;
      // Move visual focus to the 10th previous option (or first).
      case 'PageUp':
        const prevTenIndicies = currentOptionsHTMLIndex - 10;
        const prevElement = optionsHTML[prevTenIndicies];
        const firstElement = optionsHTML[0];
        (_d = (prevElement || firstElement)) === null || _d === void 0 ? void 0 : _d.focus();
        return;
      // Move visual focus to the 10th next option (or last).
      case 'PageDown':
        const nextTenIndicies = currentOptionsHTMLIndex + 10;
        const nextElement = optionsHTML[nextTenIndicies];
        const lastElement = optionsHTML[optionsHTML.length - 1];
        (_e = (nextElement || lastElement)) === null || _e === void 0 ? void 0 : _e.focus();
        return;
      // Move visual focus to the first option.
      case 'Home':
        (_f = optionsHTML[0]) === null || _f === void 0 ? void 0 : _f.focus();
        return;
      // Move visual focus to the last option.
      case 'End':
        (_g = optionsHTML[optionsHTML.length - 1]) === null || _g === void 0 ? void 0 : _g.focus();
        return;
    }
  }
  // Lifecycle Methods
  connectedCallback() {
    // When the component is first connected,
    // we sanitize the options before displaying them.
    this.sanitizeOptions();
    // After sanitizing the options, we check if one of them
    // can be selected upon initial render.
    this.getInitialSelectedOption();
  }
  disconnectedCallback() {
    const context = this;
    // If the component is disconnected, we remove the clickOutside listener
    // This has no effect if the dropdown was disconnected when collapsed.
    removeEventListener('click', this.handleClickOutside.bind(context));
  }
  render() {
    var _a, _b, _c, _d;
    const iconChevron = getAssetPath(`assets/chevron.svg`);
    if (((_a = this.sanitizedOptions) === null || _a === void 0 ? void 0 : _a.length) === 0)
      return null;
    return (h("div", null, h("button", { role: "combobox", "aria-controls": `${this.id}-listbox`, "aria-expanded": this.isExpanded.toString(), "aria-haspopup": "listbox", "aria-labelledby": `${this.id}-label`, class: this.selectedOption ? undefined : 'empty', onClick: () => (this.isExpanded = !this.isExpanded), style: {
        height: `${this.itemSize}px`,
        fontSize: `${this.fontSize}px`,
      } }, ((_b = this.selectedOption) === null || _b === void 0 ? void 0 : _b.label) ? (h("strong", null, (_c = this.selectedOption) === null || _c === void 0 ? void 0 : _c.label)) : (h("span", null, this.placeholder || 'Select an option...')), h("img", { src: iconChevron, alt: "", "aria-hidden": "true", class: this.isExpanded ? 'rotate-180' : undefined, style: {
        height: `${this.itemSize}px`,
        width: `${this.itemSize}px`,
      } })), h("div", { id: `${this.id}-listbox`, class: this.isExpanded ? undefined : 'visually-hidden no-events', role: "listbox", "aria-labelledby": `${this.id}-label` }, (_d = this.sanitizedOptions) === null || _d === void 0 ? void 0 : _d.map((option, index) => {
      var _a, _b, _c;
      return (h("button", { key: index, class: option.disabled ? 'no-events' : undefined, role: "option", "aria-disabled": (_a = option.disabled) === null || _a === void 0 ? void 0 : _a.toString(), "aria-posinset": index + 1, "aria-selected": (((_b = this.selectedOption) === null || _b === void 0 ? void 0 : _b.value) === option.value).toString(), "aria-setsize": this.sanitizedOptions.length, onClick: () => !(option === null || option === void 0 ? void 0 : option.disabled) && this.handleOptionClicked(option), onKeyDown: e => [
          'ArrowDown',
          'ArrowUp',
          'Escape',
          'Home',
          'End',
          'PageDown',
          'PageUp',
          'Tab',
        ].includes(e.key) && e.preventDefault(), onKeyUp: e => this.handleKeyUp(e), tabIndex: this.isExpanded && !option.disabled ? 0 : -1, style: {
          height: `${this.itemSize}px`,
          fontSize: `${this.fontSize}px`,
        } }, ((_c = this.selectedOption) === null || _c === void 0 ? void 0 : _c.value) === option.value ? (h("strong", null, option.label)) : (h("span", null, option.label))));
    }))));
  }
  static get is() { return "scandash-dropdown"; }
  static get encapsulation() { return "shadow"; }
  static get originalStyleUrls() {
    return {
      "$": ["scandash-dropdown.css"]
    };
  }
  static get styleUrls() {
    return {
      "$": ["scandash-dropdown.css"]
    };
  }
  static get assetsDirs() { return ["assets"]; }
  static get properties() {
    return {
      "options": {
        "type": "string",
        "mutable": false,
        "complexType": {
          "original": "string | Option[]",
          "resolved": "Option[] | string",
          "references": {
            "Option": {
              "location": "import",
              "path": "./types"
            }
          }
        },
        "required": true,
        "optional": false,
        "docs": {
          "tags": [],
          "text": "A list of options to be displayed in the dropdown.\nMay be passed as a JSON `string` or an array of `Option` objects."
        },
        "attribute": "options",
        "reflect": false
      },
      "placeholder": {
        "type": "string",
        "mutable": false,
        "complexType": {
          "original": "string",
          "resolved": "string",
          "references": {}
        },
        "required": false,
        "optional": true,
        "docs": {
          "tags": [],
          "text": "The placeholder text to be displayed when no option is selected."
        },
        "attribute": "placeholder",
        "reflect": false
      },
      "itemSize": {
        "type": "number",
        "mutable": false,
        "complexType": {
          "original": "number",
          "resolved": "number",
          "references": {}
        },
        "required": false,
        "optional": true,
        "docs": {
          "tags": [{
              "name": "default",
              "text": "48"
            }],
          "text": "In pixels, the height of each item. Default `40` is 2.5rem."
        },
        "attribute": "item-size",
        "reflect": false,
        "defaultValue": "48"
      },
      "fontSize": {
        "type": "number",
        "mutable": false,
        "complexType": {
          "original": "number",
          "resolved": "number",
          "references": {}
        },
        "required": false,
        "optional": true,
        "docs": {
          "tags": [{
              "name": "default",
              "text": "16"
            }],
          "text": "In pixels, the size of the font used in the dropdown."
        },
        "attribute": "font-size",
        "reflect": false,
        "defaultValue": "16"
      }
    };
  }
  static get states() {
    return {
      "sanitizedOptions": {},
      "selectedOption": {},
      "isExpanded": {}
    };
  }
  static get events() {
    return [{
        "method": "optionChange",
        "name": "optionChange",
        "bubbles": true,
        "cancelable": true,
        "composed": true,
        "docs": {
          "tags": [],
          "text": ""
        },
        "complexType": {
          "original": "Option",
          "resolved": "{ label: string; value: string; disabled?: boolean; selected?: boolean; }",
          "references": {
            "Option": {
              "location": "import",
              "path": "./types"
            }
          }
        }
      }];
  }
  static get methods() {
    return {
      "reset": {
        "complexType": {
          "signature": "() => Promise<void>",
          "parameters": [],
          "references": {
            "Promise": {
              "location": "global"
            }
          },
          "return": "Promise<void>"
        },
        "docs": {
          "text": "Publically exposed method, which when called, resets the `selectedOption`\nto its default value, given the `option` prop or attribute configuration.",
          "tags": []
        }
      }
    };
  }
  static get elementRef() { return "ref"; }
  static get watchers() {
    return [{
        "propName": "options",
        "methodName": "handleOptionChanged"
      }, {
        "propName": "isExpanded",
        "methodName": "handleIsExpandedChanged"
      }, {
        "propName": "selectedOption",
        "methodName": "handleSelectedOptionChanged"
      }];
  }
}
