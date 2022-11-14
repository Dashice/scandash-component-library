/**
 * @todo - Convert sanitizedOptions to a Map, to avoid potentially
 * duplicate value keys.
 */

import { Component, h, Prop, Watch, State } from '@stencil/core';

import { generateID } from '../../utils';

import { Option } from './types';

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
  // Elements

  // Properties

  @Prop() options!: string | Option[];
  @Prop() placeholder?: string;
  @Prop() label?: string;

  // State

  @State() sanitizedOptions: null | Option[] = null;
  @State() selectedOption: null | Option = null;

  @State() isExpanded: boolean = false;

  @State() ref: HTMLDivElement | null = null;

  // Watchers

  @Watch('options')
  handleOptionChanged() {
    this.sanitizeOptions();
    this.getInitialSelectedOption();
  }

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

  private sanitizeOptions() {
    const sanitize = (options: any) => {
      if (!Array.isArray(options)) {
        throw new Error('Options attribute must be of type array.');
      }

      if (options.length === 0) {
        throw new Error('Options attribute must contain at least one option.');
      }

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

    sanitize(this.options);
  }

  private getInitialSelectedOption() {
    const selectedOption = this.sanitizedOptions?.find(
      option => option.selected && !option.disabled,
    );
    const firstOption =
      this.sanitizedOptions.length === 1 ? this.sanitizedOptions?.[0] : null;

    this.selectedOption = selectedOption || firstOption;
  }

  private handleOptionClicked(option: Option) {
    this.selectedOption = option;
    this.isExpanded = false;
  }

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

    const optionsHTML = this.ref.querySelectorAll(SELECT.ENABLED_OPTIONS);

    const target = event.target as HTMLElement;
    const currentOptionsHTMLIndex = Array.from(optionsHTML).findIndex(
      option => option === target,
    );

    const options = this.sanitizedOptions?.filter(option => !option.disabled);

    const next = () => {
      const nextIndex = currentOptionsHTMLIndex + 1;

      if (optionsHTML[nextIndex]) {
        (optionsHTML[nextIndex] as HTMLElement)?.focus();
        this.selectedOption = options?.[nextIndex];
        return;
      }

      first();
    };

    const prev = () => {
      const prevIndex = currentOptionsHTMLIndex - 1;

      if (optionsHTML[prevIndex]) {
        (optionsHTML[prevIndex] as HTMLElement)?.focus();
        this.selectedOption = options?.[prevIndex];
        return;
      }

      last();
    };

    const first = () => {
      (optionsHTML[0] as HTMLElement)?.focus();
      this.selectedOption = options?.[0] || null;
    };

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
    this.sanitizeOptions();
    this.getInitialSelectedOption();
  }

  disconnectedCallback() {
    const context = this;

    removeEventListener('click', this.handleClickOutside.bind(context));
  }

  render() {
    const id = generateID('dropdown');

    return (
      <div ref={element => (this.ref = element)}>
        <label
          id={`${id}-label`}
          onClick={() => (this.isExpanded = !this.isExpanded)}>
          {this.label && <span>{this.label}:</span>}
          <button
            aria-controls={`${id}-listbox`}
            aria-expanded={this.isExpanded.toString()}
            aria-haspopup="listbox"
            aria-labelledby={`${id}-label`}
            role="combobox"
            tabindex="0">
            {this.selectedOption?.label ? (
              <strong>{this.selectedOption?.label}</strong>
            ) : (
              <span>{this.placeholder || 'Select an option...'}</span>
            )}
          </button>
        </label>

        <div
          role="listbox"
          class={this.isExpanded ? '' : 'visually-hidden no-events'}
          id={`${id}-listbox`}
          aria-labelledby={`${id}-label`}
          tabindex={-1}>
          {this.sanitizedOptions?.map((option, index) => (
            <button
              key={index}
              role="option"
              class={option.disabled ? 'no-events' : ''}
              aria-selected={(
                this.selectedOption?.value === option.value
              ).toString()}
              aria-setsize={this.sanitizedOptions.length}
              aria-posinset={index + 1}
              aria-disabled={option.disabled?.toString()}
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
