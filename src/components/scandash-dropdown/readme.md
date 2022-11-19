# scandash-dropdown



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute     | Description                                                                                                          | Type                 | Default     |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------- |
| `fontSize`             | `font-size`   | In pixels, the size of the font used in the dropdown.                                                                | `number`             | `16`        |
| `itemSize`             | `item-size`   | In pixels, the height of each item. Default `40` is 2.5rem.                                                          | `number`             | `48`        |
| `options` _(required)_ | `options`     | A list of options to be displayed in the dropdown. May be passed as a JSON `string` or an array of `Option` objects. | `Option[] \| string` | `undefined` |
| `placeholder`          | `placeholder` | The placeholder text to be displayed when no option is selected.                                                     | `string`             | `undefined` |


## Events

| Event          | Description | Type                                                                                     |
| -------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `optionChange` |             | `CustomEvent<{ label: string; value: string; disabled?: boolean; selected?: boolean; }>` |


## Methods

### `reset() => Promise<void>`

Publically exposed method, which when called, resets the `selectedOption`
to its default value, given the `option` prop or attribute configuration.

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
