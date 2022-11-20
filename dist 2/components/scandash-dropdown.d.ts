import type { Components, JSX } from "../types/components";

interface ScandashDropdown extends Components.ScandashDropdown, HTMLElement {}
export const ScandashDropdown: {
  prototype: ScandashDropdown;
  new (): ScandashDropdown;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
