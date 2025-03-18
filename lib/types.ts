export interface DatabaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  type: DatabaseType;
}

export type DatabaseType = 'mysql' | 'postgresql';

export interface Database {
  name: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableNode {
  id: string;
  type: 'table';
  data: {
    label: string;
    columns: Column[];
  };
  position: {
    x: number;
    y: number;
  };
}

export interface TableEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface FlowElements {
  nodes: TableNode[];
  edges: TableEdge[];
}