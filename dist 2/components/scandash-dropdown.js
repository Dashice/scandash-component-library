import { proxyCustomElement, HTMLElement, createEvent, getAssetPath, h } from '@stencil/core/internal/client';

let iteration = 0;
const generateID = (name) => {
  iteration += 1;
  return `scandash-${iteration}-${name}`;
};

const scandashDropdownCss = ".visually-hidden{position:absolute;overflow:hidden;height:1px;width:1px;padding:0;border:0;clip:rect(1px, 1px, 1px, 1px);clip-path:inset(0px 0px 99.9% 99.9%);-webkit-clip-path:inset(0px 0px 99.9% 99.9%)}.no-events{pointer-events:none}:host{--combo-bg-color:rgb(255, 255, 255);--combo-border-color:rgb(56, 65, 79);--combo-border-color-empty:rgb(224, 226, 235);--combo-border-color-empty-hover:rgb(134, 143, 162);--combo-placehoder-color:rgb(85, 101, 122);--list-hover-color:rgb(237, 239, 243);--list-focus-color:rgb(240, 240, 240);--list-active-color:rgb(219, 223, 230);--list-border-color:rgb(219, 223, 230)}*{box-sizing:border-box}button{width:100%;text-align:start;background:none;border:none;appearance:none}span,strong{display:-webkit-box;overflow:hidden;width:100%;padding:0 1em;font-weight:normal;-webkit-box-orient:vertical;-webkit-line-clamp:2}div{display:flex;flex-direction:column;position:relative}[role='combobox']{display:flex;flex-direction:row;align-items:center;justify-content:space-between;position:relative;background-color:var(--combo-bg-color);border-bottom:1px solid var(--combo-border-color);border-top-left-radius:5px;border-top-right-radius:5px}[role='combobox'].empty{border-bottom:1px solid var(--combo-border-color-empty)}[role='combobox'].empty:hover{border-bottom:1px solid var(--combo-border-color-empty-hover)}[role='combobox']>span{color:var(--combo-placehoder-color)}[role='combobox']>img{transform:scale(0.25)}[role='combobox']>img.rotate-180{transform:scale(-1) scale(0.25)}[role='listbox']{display:block;position:absolute;overflow-y:auto;width:100%;top:calc(100% - 1px);left:0;background-color:white;border:1px solid var(--list-border-color)}[role='option']{cursor:pointer;outline:none}[role='option']:not([aria-selected='true']):hover{background-color:var(--list-hover-color)}[role='option']:not([aria-selected='true']):focus{background-color:var(--list-focus-color)}[aria-disabled='true']{opacity:0.5}[aria-selected='true']{background-color:var(--list-active-color)}";

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
const ScandashDropdown$1 = /*@__PURE__*/ proxyCustomElement(class extends HTMLElement {
  constructor() {
    super();
    this.__registerHost();
    this.__attachShadow();
    this.optionChange = createEvent(this, "optionChange", 7);
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
  static get assetsDirs() { return ["assets"]; }
  get ref() { return this; }
  static get watchers() { return {
    "options": ["handleOptionChanged"],
    "isExpanded": ["handleIsExpandedChanged"],
    "selectedOption": ["handleSelectedOptionChanged"]
  }; }
  static get style() { return scandashDropdownCss; }
}, [1, "scandash-dropdown", {
    "options": [1],
    "placeholder": [1],
    "itemSize": [2, "item-size"],
    "fontSize": [2, "font-size"],
    "sanitizedOptions": [32],
    "selectedOption": [32],
    "isExpanded": [32],
    "reset": [64]
  }]);
function defineCustomElement$1() {
  if (typeof customElements === "undefined") {
    return;
  }
  const components = ["scandash-dropdown"];
  components.forEach(tagName => { switch (tagName) {
    case "scandash-dropdown":
      if (!customElements.get(tagName)) {
        customElements.define(tagName, ScandashDropdown$1);
      }
      break;
  } });
}

const ScandashDropdown = ScandashDropdown$1;
const defineCustomElement = defineCustomElement$1;

export { ScandashDropdown, defineCustomElement };
