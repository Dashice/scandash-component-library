import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'scandash-dropdown',
  styleUrl: 'scandash-dropdown.css',
  shadow: true,
})
export class ScandashDropdown {

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
