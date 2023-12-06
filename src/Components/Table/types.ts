export type TableSchema = {
  clickable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  width?: number;
  name?: string;
  headerContent?: () => React.ReactNode;
  prop: string;
  cellContent: (rowData?: any, index?: number) => React.ReactNode;
  value?: string | number | ((rowData?: any) => string | number);
};

export type SortState = {
  columnName: string | number;
  order: "asc" | "desc";
};

export type TableProps<DataType> = {
  data: Array<DataType>;
  schema: Array<TableSchema>;
  manualSort?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  onCellClick?: (data: { event: React.MouseEvent<HTMLTableCellElement, MouseEvent>, rowData?: DataType }) => void;
  rowClassMap?: Record<string, (row?: DataType, index?: number) => boolean>;
  wrapperRef?: React.RefObject<HTMLDivElement | null>;
};
