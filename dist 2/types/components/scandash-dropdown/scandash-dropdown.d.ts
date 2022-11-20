import { EventEmitter } from '../../stencil-public-runtime';
import { Option } from './types';
export declare class ScandashDropdown {
  id: string;
  ref: HTMLElement;
  /**
   * A list of options to be displayed in the dropdown.
   * May be passed as a JSON `string` or an array of `Option` objects.
   */
  options: string | Option[];
  /**
   * The placeholder text to be displayed when no option is selected.
   */
  placeholder?: string;
  /**
   * In pixels, the height of each item. Default `40` is 2.5rem.
   * @default 48
   */
  itemSize?: number;
  /**
   * In pixels, the size of the font used in the dropdown.
   * @default 16
   */
  fontSize?: number;
  sanitizedOptions: null | Option[];
  selectedOption: null | Option;
  isExpanded: boolean;
  /**
   * If the options attribute or prop changes, we reinitialize the component.
   */
  handleOptionChanged(): void;
  /**
   * If the dropdown is expanded, we render the options and attach
   * a click listener to the window used to collapse the dropdown when
   * a user clicks outside of it.
   */
  handleIsExpandedChanged(): void;
  /**
   * When the selected options changes, we emit an event; returning
   * the `Option` object.
   */
  handleSelectedOptionChanged(): void;
  optionChange: EventEmitter<Option>;
  /**
   * Publically exposed method, which when called, resets the `selectedOption`
   * to its default value, given the `option` prop or attribute configuration.
   */
  reset(): Promise<void>;
  /**
   * Sanitizes the `options` prop and converts it to an `Option[]`
   * if provided as a JSON `string`.
   */
  private sanitizeOptions;
  /**
   * Sets the initial selected option, if one is provided through
   * `options.selected`. If only one option is provided, it will
   * be automatically selected, regardless if `selected` key is set.
   */
  private getInitialSelectedOption;
  /**
   * When expanded, focuses either the selected option or the first option.
   */
  private focusMostAppropriateOption;
  /**
   * When the user expands the dropdown, we ensure the max-height of the
   * dropdown prefers to be constrained to the available viewport space,
   * provided it does not become too short.
   *
   * The dropdown will, as a result be vertically scrollable if the max-height
   * is constrained this way.
   */
  private determineListHeight;
  /**
   * When an option is clicked, it is selected and the dropdown is collapsed.
   */
  private handleOptionClicked;
  /**
   * When the dropdown is expanded, clicking outside of the dropdown
   * will collapse it.
   */
  private handleClickOutside;
  private handleKeyUp;
  connectedCallback(): void;
  disconnectedCallback(): void;
  render(): any;
}
