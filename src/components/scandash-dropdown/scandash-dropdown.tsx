/**
 * @todo - Convert sanitizedOptions to a Map, to avoid potentially
 * duplicate value keys.
 */

import { Component, Host, h, Prop, Watch, State } from '@stencil/core';

import { generateID } from '../../utils';

import { Option } from './types';

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

  // Watchers

  @Watch('options')
  handleOptionChanged() {
    this.sanitizeOptions();
    this.getInitialSelectedOption();
  }

  @Watch('isExpanded')
  handleIsExpandedChanged() {
    const context = this;

    if (this.isExpanded) {
      addEventListener('click', this.handleClickOutside.bind(context));
    } else {
      removeEventListener('click', this.handleClickOutside.bind(context));
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
      option => option.selected,
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
      <Host>
        <div>
          <label
            id={`${id}-label`}
            onClick={() => (this.isExpanded = !this.isExpanded)}>
            {this.label && <span>{this.label}:</span>}
            <div
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
            </div>
          </label>

          <div
            role="listbox"
            class={this.isExpanded ? '' : 'visually-hidden no-events'}
            id={`${id}-listbox`}
            aria-labelledby={`${id}-label`}
            tabindex={-1}>
            {this.sanitizedOptions?.map((option, index) => (
              <div
                key={index}
                role="option"
                aria-selected={(
                  this.selectedOption?.value === option.value
                ).toString()}
                aria-setsize={this.sanitizedOptions.length}
                aria-posinset={index + 1}
                onClick={() => this.handleOptionClicked(option)}
                tabIndex={this.isExpanded ? 0 : -1}>
                {option.label}
              </div>
            ))}
          </div>
        </div>
      </Host>
    );
  }
}
