export const BOARD_CONFIG_VERSION: 3;

export interface PresetItem {
  main?: string;
  alt?: string;
  [key: string]: unknown;
}

export interface ColumnConfig {
  key: string;
  kind: 'chars' | 'time' | 'word';
  sourceField: string;
  header?: { main?: string; alt?: string };
  cssClass?: string;
  inlineStyle?: string;
  widthVar?: string;
  flexGrow?: number;
  minChars?: number;
  presetKey?: string;
  unitCount?: number;
  padEnd?: number;
  charset?: string;
  unitCapacity?: number;
  colorFields?: { background?: string; text?: string };
  textAlign?: string;
  fullWidth?: boolean;
  timeSeparator?: string;
}

export interface BoardConfigWindow {
  strategy?: 'nextByTime' | 'static';
  timeField?: string;
}

export interface UiConfig {
  mode?: string;
  rows?: number;
  cascadeMs?: number;
  refreshMs?: number;
  hiddenColumns?: string[];
  errorMessage?: { main?: string; description?: string };
  window?: BoardConfigWindow;
  flapAnimationMs?: number;
  colGap?: string;
  rowGap?: string;
  charFontSize?: string;
  mainFontSize?: string;
  altFontSize?: string;
  charWidth?: string;
  charHeight?: string;
  showHeader?: boolean;
  blankColor?: string;
  blankTextColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  borderColor?: string;
  headerFontFamily?: string;
}

export interface BoardRow {
  [field: string]: unknown;
}

export interface BoardConfig {
  schema_version?: number;
  columns: ColumnConfig[];
  presets?: Record<string, PresetItem[]>;
  rows?: BoardRow[];
  ui?: UiConfig;
}

export interface BoardInstance {
  updateBoard(presets: Record<string, PresetItem[]>, rows: BoardRow[]): Promise<void>;
  destroyBoard(): void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function mountBoard(el: HTMLElement, config: BoardConfig): BoardInstance;

export function normalizeBoardConfig(raw: unknown): BoardConfig;

export function validateBoardConfig(raw: unknown): ValidationResult;
