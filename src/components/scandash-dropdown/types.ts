export type Option =
  | { label: string; value: string; disabled?: boolean; selected?: boolean }
  | { label: string; value?: never; disabled?: boolean; selected?: boolean }
  | { label?: never; value: string; disabled?: boolean; selected?: boolean };
