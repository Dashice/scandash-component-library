import { Component, Host, h, Prop, Watch, State } from '@stencil/core';

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

  // State

  @State() sanitizedOptions: null | Option[] = null;

  // Watchers

  @Watch('options')
  handleOptionChanged() {
    this.sanitizeOptions();
  }

  // Events

  // Listeners

  // Methods

  private sanitizeOptions() {
    const sanitize = (options: any) => {
      if (!Array.isArray(options)) return;
      if (options.length === 0) return;

      const filteredOptions = options.filter(option => {
        if (typeof option !== 'object') return false;
        if (!option.hasOwnProperty('label') && !option.hasOwnProperty('value')) {
          return false;
        }
        return true;
      });

      this.sanitizedOptions = filteredOptions;
    };

    if (typeof this.options === 'string') {
      try {
        const parsedOptions = JSON.parse(this.options);
        sanitize(parsedOptions);
      } catch (error) {
        console.warn('Invalid JSON string');
      }

      return;
    }

    sanitize(this.options);
  }

  // Lifecycle Methods

  componentWillRender() {
    this.sanitizeOptions();
  }

  render() {
    return (
      <Host>
        <ul>
          {this.sanitizedOptions?.map(option => (
            <li>{option.label || option.value}</li>
          ))}
        </ul>
      </Host>
    );
  }
}
