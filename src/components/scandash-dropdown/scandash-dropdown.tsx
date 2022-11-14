/**
 * @todo - Convert sanitizedOptions to a Map, to avoid potentially
 * duplicate value keys.
 */

import { Component, h, Prop, Watch, State } from '@stencil/core';

import { generateID } from '../../utils';

import { Option } from './types';

/**
 * An object containing various commonly used selectors for the component.
 */
const SELECT = {
  COMBOBOX: '[role="combobox"]',
  /* LIST: '[role="listbox"]', */ // Unused
  /* OPTIONS: '[role="option"]', */ // Unused
  ENABLED_OPTIONS: '[role="option"]:not([aria-disabled="true"])',
};

@Component({
  tag: 'scandash-dropdown',
  styleUrl: 'scandash-dropdown.css',
  shadow: true,
})
export class ScandashDropdown {
  // Variables
  id = generateID('dropdown');

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
   * The label to be displayed above the dropdown button.
   */
  @Prop() label?: string;

  // State

  @State() sanitizedOptions: null | Option[] = null;
  @State() selectedOption: null | Option = null;

  @State() isExpanded: boolean = false;

  @State() ref: HTMLDivElement | null = null;

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
      (this.ref.querySelector(SELECT.ENABLED_OPTIONS) as HTMLElement)?.focus();
    } else {
      removeEventListener('click', this.handleClickOutside.bind(context));
      (this.ref.querySelector(SELECT.COMBOBOX) as HTMLElement)?.focus();
    }
  }

  // Events

  // Listeners

  // Methods

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

      // Filter out any options that do not contain a `label` or `value` key.
      const filteredOptions = options.filter(option => {
        if (typeof option !== 'object') return false;
        if (
          !option.hasOwnProperty('label') ||
          !option.hasOwnProperty('value')
        ) {
          return false;
        }
        return true;
      });

      this.sanitizedOptions = filteredOptions;
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

  /**
   * @todo - Should handle focusleave event, to close the dropdown.
   */
  private handleKeyUp(event: KeyboardEvent) {
    if (!this.isExpanded || !this.ref) return;

    // Select all non-disabled options
    const optionsHTML = this.ref.querySelectorAll(SELECT.ENABLED_OPTIONS);

    // Get the currently focused option index
    const target = event.target as HTMLElement;
    const currentOptionsHTMLIndex = Array.from(optionsHTML).findIndex(
      option => option === target,
    );

    // Filter out disabled options from sanitized `Option[]`
    const options = this.sanitizedOptions?.filter(option => !option.disabled);

    /**
     * Selects the next available option, otherwise selects the first option.
     */
    const next = () => {
      const nextIndex = currentOptionsHTMLIndex + 1;

      if (optionsHTML[nextIndex]) {
        (optionsHTML[nextIndex] as HTMLElement)?.focus();
        this.selectedOption = options?.[nextIndex];
        return;
      }

      first();
    };

    /**
     * Selects the previous available option, otherwise selects the last option.
     */
    const prev = () => {
      const prevIndex = currentOptionsHTMLIndex - 1;

      if (optionsHTML[prevIndex]) {
        (optionsHTML[prevIndex] as HTMLElement)?.focus();
        this.selectedOption = options?.[prevIndex];
        return;
      }

      last();
    };

    /**
     * Selects the first available option.
     */
    const first = () => {
      (optionsHTML[0] as HTMLElement)?.focus();
      this.selectedOption = options?.[0] || null;
    };

    /**
     * Selects the last available option.
     */
    const last = () => {
      (optionsHTML[optionsHTML.length - 1] as HTMLElement)?.focus();
      this.selectedOption = options?.[options.length - 1] || null;
    };

    switch (event.key) {
      case 'ArrowDown':
        return next();
      case 'ArrowUp':
        return prev();
      case 'Escape':
        this.isExpanded = false;
        return;
      case 'Home':
        return first();
      case 'End':
        return last();
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
    return (
      <div ref={element => (this.ref = element)}>
        <label
          id={`${this.id}-label`}
          onClick={() => (this.isExpanded = !this.isExpanded)}>
          {this.label && <span>{this.label}:</span>}
          <button
            role="combobox"
            aria-controls={`${this.id}-listbox`}
            aria-expanded={this.isExpanded.toString()}
            aria-haspopup="listbox"
            aria-labelledby={`${this.id}-label`}
            tabindex="0">
            {this.selectedOption?.label ? (
              <strong>{this.selectedOption?.label}</strong>
            ) : (
              <span>{this.placeholder || 'Select an option...'}</span>
            )}
          </button>
        </label>

        <div
          id={`${this.id}-listbox`}
          class={this.isExpanded ? '' : 'visually-hidden no-events'}
          role="listbox"
          aria-labelledby={`${this.id}-label`}
          tabindex={-1}>
          {this.sanitizedOptions?.map((option, index) => (
            <button
              key={index}
              class={option.disabled ? 'no-events' : ''}
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
                ['ArrowDown', 'ArrowUp', 'Escape', 'Home', 'End'].includes(
                  e.key,
                ) && e.preventDefault()
              }
              onKeyUp={e => this.handleKeyUp(e)}
              tabIndex={this.isExpanded && !option.disabled ? 0 : -1}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
