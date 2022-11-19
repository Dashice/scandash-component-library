import {
  Component,
  h,
  Prop,
  Watch,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  getAssetPath,
} from '@stencil/core';

import { generateID } from '../../utils';

import { Option } from './types';

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

@Component({
  tag: 'scandash-dropdown',
  styleUrl: 'scandash-dropdown.css',
  shadow: true,
  assetsDirs: ['assets'],
})
export class ScandashDropdown {
  // Variables
  id = generateID('dropdown');

  // Element
  @Element() ref: HTMLElement;

  // Properties

  /**
   * A list of options to be displayed in the dropdown.
   * May be passed as a JSON `string` or an array of `Option` objects.
   */
  @Prop() options!: string | Option[];
  /**
   * The placeholder text to be displayed when no option is selected.
   */
  @Prop() placeholder?: string;
  /**
   * In pixels, the height of each item. Default `40` is 2.5rem.
   * @default 48
   */
  @Prop() itemSize?: number = 48;
  /**
   * In pixels, the size of the font used in the dropdown.
   * @default 16
   */
  @Prop() fontSize?: number = 16;

  // State

  @State() sanitizedOptions: null | Option[] = null;
  @State() selectedOption: null | Option = null;

  @State() isExpanded: boolean = false;

  // Watchers

  /**
   * If the options attribute or prop changes, we reinitialize the component.
   */
  @Watch('options')
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
  @Watch('isExpanded')
  handleIsExpandedChanged() {
    if (!this.ref) return;

    const context = this;

    if (this.isExpanded) {
      addEventListener('click', this.handleClickOutside.bind(context));

      this.focusMostAppropriateOption();
      this.determineListHeight();
    } else {
      removeEventListener('click', this.handleClickOutside.bind(context));
      (
        this.ref.shadowRoot.querySelector(SELECT.COMBOBOX) as HTMLElement
      )?.focus();
    }
  }

  /**
   * When the selected options changes, we emit an event; returning
   * the `Option` object.
   */
  @Watch('selectedOption')
  handleSelectedOptionChanged() {
    this.optionChange.emit(this.selectedOption);
  }

  // Events

  @Event() optionChange: EventEmitter<Option>;

  // Methods

  /**
   * Publically exposed method, which when called, resets the `selectedOption`
   * to its default value, given the `option` prop or attribute configuration.
   */
  @Method()
  async reset() {
    this.getInitialSelectedOption();
  }

  // Methods (Private)

  /**
   * Sanitizes the `options` prop and converts it to an `Option[]`
   * if provided as a JSON `string`.
   */
  private sanitizeOptions() {
    const sanitize = (options: any) => {
      // If options are not an array, throw a type error
      if (!Array.isArray(options)) {
        throw new Error('TypeError: Options attribute must be of type array.');
      }

      // If the array is empty, we throw an empty array error.
      if (options.length === 0) {
        throw new Error('Options attribute must contain at least one option.');
      }

      // Filter out some common bad data
      const filteredOptions: Option[] = options.filter(option => {
        // Filter out array values that are not of type object
        if (typeof option !== 'object') return false;
        // Filter out objects that do not have a `value` or `label` key
        if (!option['label'] || !option['value']) return false;
        // Filter out objects whose `value` is not of type `"string"`
        if (typeof option['value'] !== 'string') return false;
        return true;
      });

      const uniqueFilteredOptions = new Map();

      // Remove any duplicate `Option` objects, if two `Option` objects
      // have the same `value` key / value pair.
      filteredOptions.forEach(option => {
        if (uniqueFilteredOptions.has(option.value)) return;
        uniqueFilteredOptions.set(option.value, option);
      });

      this.sanitizedOptions = [...uniqueFilteredOptions.values()];
    };

    // If options is a string, we attempt to parse it as JSON.
    // Otherwise throw an invalid JSON error.
    if (typeof this.options === 'string') {
      let parsedOptions: Option[] | null = null;

      try {
        parsedOptions = JSON.parse(this.options);
      } catch (error) {
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
  private getInitialSelectedOption() {
    const selectedOption = this.sanitizedOptions?.find(
      option => option.selected && !option.disabled,
    );

    const firstOption =
      this.sanitizedOptions.length === 1 ? this.sanitizedOptions?.[0] : null;

    // Prioritize `Option`'s with `selected` key, otherwise select
    // the first option if only one is provided.
    this.selectedOption = selectedOption || firstOption;
  }

  /**
   * When expanded, focuses either the selected option or the first option.
   */
  private focusMostAppropriateOption() {
    const selectedOption = this.ref.shadowRoot.querySelector(
      SELECT.SELECTED_OPTION,
    );
    const firstEnabledOption = this.ref.shadowRoot.querySelector(
      SELECT.ENABLED_OPTIONS,
    );

    ((selectedOption || firstEnabledOption) as HTMLElement)?.focus();
  }

  /**
   * When the user expands the dropdown, we ensure the max-height of the
   * dropdown prefers to be constrained to the available viewport space,
   * provided it does not become too short.
   *
   * The dropdown will, as a result be vertically scrollable if the max-height
   * is constrained this way.
   */
  private determineListHeight() {
    if (!this.ref) return;

    const root = this.ref.shadowRoot;

    const combo = root.querySelector(SELECT.COMBOBOX) as HTMLElement;
    const list = root.querySelector(SELECT.LIST) as HTMLElement;

    if (!combo || !list) return;

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
  private handleOptionClicked(option: Option) {
    this.selectedOption = option;
    this.isExpanded = false;
  }

  /**
   * When the dropdown is expanded, clicking outside of the dropdown
   * will collapse it.
   */
  private handleClickOutside(event: MouseEvent) {
    if (!this.isExpanded) return;

    const target = event.target as HTMLElement;
    if (!target.closest('scandash-dropdown')) this.isExpanded = false;
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (!this.isExpanded || !this.ref) return;

    // Select all non-disabled options
    const optionsHTML = this.ref.shadowRoot.querySelectorAll(
      SELECT.ENABLED_OPTIONS,
    );

    // Get the currently focused option index
    const target = event.target as HTMLElement;
    const currentOptionsHTMLIndex = Array.from(optionsHTML).findIndex(
      option => option === target,
    );

    // Filter out disabled options from sanitized `Option[]`
    const options = this.sanitizedOptions?.filter(option => !option.disabled);

    switch (event.key) {
      // Select the focused option and close the dropdown.
      case 'Tab':
        this.isExpanded = false;
        this.selectedOption = options?.[currentOptionsHTMLIndex];
      // Move visual focus to previous option.
      case 'ArrowDown':
        const nextIndex = currentOptionsHTMLIndex + 1;
        (optionsHTML[nextIndex] as HTMLElement)?.focus();
        return;
      // Move visual focus to next option.
      case 'ArrowUp':
        const prevIndex = currentOptionsHTMLIndex - 1;
        (optionsHTML[prevIndex] as HTMLElement)?.focus();
        return;
      // Close the dropdown.
      case 'Escape':
        this.isExpanded = false;
        return;
      // Move visual focus to the 10th previous option (or first).
      case 'PageUp':
        const prevTenIndicies = currentOptionsHTMLIndex - 10;
        const prevElement = optionsHTML[prevTenIndicies] as HTMLElement;
        const firstElement = optionsHTML[0] as HTMLElement;

        (prevElement || firstElement)?.focus();
        return;
      // Move visual focus to the 10th next option (or last).
      case 'PageDown':
        const nextTenIndicies = currentOptionsHTMLIndex + 10;
        const nextElement = optionsHTML[nextTenIndicies] as HTMLElement;
        const lastElement = optionsHTML[optionsHTML.length - 1] as HTMLElement;

        (nextElement || lastElement)?.focus();
        return;
      // Move visual focus to the first option.
      case 'Home':
        (optionsHTML[0] as HTMLElement)?.focus();
        return;
      // Move visual focus to the last option.
      case 'End':
        (optionsHTML[optionsHTML.length - 1] as HTMLElement)?.focus();
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
    const iconChevron = getAssetPath(`./assets/chevron.svg`);

    if (this.sanitizedOptions?.length === 0) return null;

    return (
      <div>
        <button
          role="combobox"
          aria-controls={`${this.id}-listbox`}
          aria-expanded={this.isExpanded.toString()}
          aria-haspopup="listbox"
          aria-labelledby={`${this.id}-label`}
          class={this.selectedOption ? undefined : 'empty'}
          onClick={() => (this.isExpanded = !this.isExpanded)}
          style={{
            height: `${this.itemSize}px`,
            fontSize: `${this.fontSize}px`,
          }}>
          {this.selectedOption?.label ? (
            <strong>{this.selectedOption?.label}</strong>
          ) : (
            <span>{this.placeholder || 'Select an option...'}</span>
          )}
          <img
            src={iconChevron}
            alt=""
            aria-hidden="true"
            class={this.isExpanded ? 'rotate-180' : undefined}
            style={{
              height: `${this.itemSize}px`,
              width: `${this.itemSize}px`,
            }}
          />
        </button>
        <div
          id={`${this.id}-listbox`}
          class={this.isExpanded ? undefined : 'visually-hidden no-events'}
          role="listbox"
          aria-labelledby={`${this.id}-label`}>
          {this.sanitizedOptions?.map((option, index) => (
            <button
              key={index}
              class={option.disabled ? 'no-events' : undefined}
              role="option"
              aria-disabled={option.disabled?.toString()}
              aria-posinset={index + 1}
              aria-selected={(
                this.selectedOption?.value === option.value
              ).toString()}
              aria-setsize={this.sanitizedOptions.length}
              onClick={() =>
                !option?.disabled && this.handleOptionClicked(option)
              }
              onKeyDown={e =>
                [
                  'ArrowDown',
                  'ArrowUp',
                  'Escape',
                  'Home',
                  'End',
                  'PageDown',
                  'PageUp',
                  'Tab',
                ].includes(e.key) && e.preventDefault()
              }
              onKeyUp={e => this.handleKeyUp(e)}
              tabIndex={this.isExpanded && !option.disabled ? 0 : -1}
              style={{
                height: `${this.itemSize}px`,
                fontSize: `${this.fontSize}px`,
              }}>
              {this.selectedOption?.value === option.value ? (
                <strong>{option.label}</strong>
              ) : (
                <span>{option.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
