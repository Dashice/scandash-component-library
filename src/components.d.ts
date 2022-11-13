/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Option } from "./components/scandash-dropdown/types";
export namespace Components {
    interface ScandashDropdown {
        "options": string | Option[];
    }
}
declare global {
    interface HTMLScandashDropdownElement extends Components.ScandashDropdown, HTMLStencilElement {
    }
    var HTMLScandashDropdownElement: {
        prototype: HTMLScandashDropdownElement;
        new (): HTMLScandashDropdownElement;
    };
    interface HTMLElementTagNameMap {
        "scandash-dropdown": HTMLScandashDropdownElement;
    }
}
declare namespace LocalJSX {
    interface ScandashDropdown {
        "options": string | Option[];
    }
    interface IntrinsicElements {
        "scandash-dropdown": ScandashDropdown;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "scandash-dropdown": LocalJSX.ScandashDropdown & JSXBase.HTMLAttributes<HTMLScandashDropdownElement>;
        }
    }
}
