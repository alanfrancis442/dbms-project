"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Link2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatabaseConnection, Database, Table } from "@/lib/types";
import { getDatabases, getTables, createTable } from "@/lib/db-service";
import { useToast } from "@/hooks/use-toast";

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue: string;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  length?: string; // Added length property
  onDeleteAction?: string; // Added for cascade on delete
  onUpdateAction?: string; // Added for cascade on update
}

const DATABASE_TYPES = [
  "MySQL",
  "PostgreSQL",
  "SQLite",
  "SQL Server",
  "Oracle",
];

const CASCADE_OPTIONS = [
  "CASCADE",
  "SET NULL",
  "SET DEFAULT",
  "RESTRICT",
  "NO ACTION",
];

const DATA_TYPES = [
  // String types
  "char",
  "varchar",
  "text",
  "tinytext",
  "mediumtext",
  "longtext",
  // Numeric types
  "integer",
  "smallint",
  "bigint",
  "decimal",
  "numeric",
  "float",
  "real",
  "double",
  // Boolean type
  "boolean",
  // Date/Time types
  "date",
  "time",
  "datetime",
  "timestamp",
  // Binary types
  "binary",
  "varbinary",
  "blob",
  "tinyblob",
  "mediumblob",
  "longblob",
  // JSON and other types
  "json",
  "xml",
  "uuid",
];

export default function CreateTablePage() {
  const { toast } = useToast();
  const [tableName, setTableName] = useState("");
  const [selectedDB, setSelectedDB] = useState(DATABASE_TYPES[0]);
  const [columns, setColumns] = useState<Column[]>([
    {
      name: "",
      type: "varchar",
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
      defaultValue: "",
      isForeignKey: false,
      length: "255", // Default length for varchar
      onDeleteAction: "NO ACTION", // Default action for ON DELETE
      onUpdateAction: "NO ACTION", // Default action for ON UPDATE
    },
  ]);
  const [existingTables, setExistingTables] = useState<Table[]>([]);

  // New state for available databases and selected database
  const [availableDatabases, setAvailableDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [isLoadingDatabases, setIsLoadingDatabases] = useState<boolean>(false);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [login, setlogin] = useState<string>();

  // Fetch available databases when database type changes
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setIsLoadingDatabases(true);
        // In a real application, this would use the actual connection info
        const conn = localStorage.getItem("databaseConnection");
        if (!conn) {
          console.error("No database connection found in localStorage");
          toast({
            title: "No database connection",
            description: "Please connect to a database first.",
            variant: "destructive",
          });
          return;
        }
        setlogin(conn);
        const databases = await getDatabases(JSON.parse(conn));
        setAvailableDatabases(databases);
        setSelectedDatabase(""); // Reset selected database when type changes
      } catch (error) {
        console.error("Failed to fetch databases:", error);
        setAvailableDatabases([]);
      } finally {
        setIsLoadingDatabases(false);
      }
    };

    fetchDatabases();
  }, [selectedDB]);

  // Fetch tables from the selected database
  useEffect(() => {
    const fetchTables = async () => {
      if (!selectedDatabase || !login) {
        setExistingTables([]);
        return;
      }

      try {
        setIsLoadingTables(true);
        const conn = JSON.parse(login);
        const tables = await getTables(conn, selectedDatabase);
        setExistingTables(tables);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
        toast({
          title: "Error",
          description: "Failed to load tables from database.",
          variant: "destructive",
        });
        setExistingTables([]);
      } finally {
        setIsLoadingTables(false);
      }
    };

    fetchTables();
  }, [selectedDatabase, login, toast]);

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        type: "varchar",
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        defaultValue: "",
        isForeignKey: false,
        length: "255", // Default length for varchar
        onDeleteAction: "NO ACTION", // Default action for ON DELETE
        onUpdateAction: "NO ACTION", // Default action for ON UPDATE
      },
    ]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (
    index: number,
    field: keyof Column,
    value: string | boolean
  ) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };

    // If this column is set as primary key, make it not nullable and unique
    if (field === "isPrimaryKey" && value === true) {
      newColumns[index].isNullable = false;
      newColumns[index].isUnique = true;
    }

    // If foreign key is unchecked, reset related properties
    if (field === "isForeignKey" && value === false) {
      newColumns[index].foreignKeyTable = undefined;
      newColumns[index].foreignKeyColumn = undefined;
      newColumns[index].onDeleteAction = "NO ACTION";
      newColumns[index].onUpdateAction = "NO ACTION";
    }

    // Set default length when type changes to varchar or char
    if (field === "type" && (value === "varchar" || value === "char")) {
      newColumns[index].length = "255";
    }

    setColumns(newColumns);
  };

  const handleSave = async () => {
    if (!selectedDatabase || !tableName || columns.some((col) => !col.name)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const conn = JSON.parse(login || "");
      await createTable({
        connection: conn,
        databaseName: selectedDatabase,
        tableName: tableName,
        columns: columns.map((col) => ({
          name: col.name,
          // Include length in the type for varchar and char
          type:
            (col.type === "varchar" || col.type === "char") && col.length
              ? `${col.type}(${col.length})`
              : col.type,
          isPrimaryKey: col.isPrimaryKey,
          isNullable: col.isNullable,
          isUnique: col.isUnique,
          defaultValue: col.defaultValue,
          isForeignKey: col.isForeignKey,
          references:
            col.isForeignKey && col.foreignKeyTable && col.foreignKeyColumn
              ? {
                  table: col.foreignKeyTable,
                  column: col.foreignKeyColumn,
                  onDelete: col.onDeleteAction, // Include ON DELETE action
                  onUpdate: col.onUpdateAction, // Include ON UPDATE action
                }
              : undefined,
        })),
      });

      toast({
        title: "Success",
        description: `Table '${tableName}' has been created.`,
      });

      // Reset the form
      setTableName("");
      setColumns([
        {
          name: "",
          type: "varchar",
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          defaultValue: "",
          isForeignKey: false,
          length: "255", // Default length for varchar
          onDeleteAction: "NO ACTION",
          onUpdateAction: "NO ACTION",
        },
      ]);
    } catch (error) {
      console.error("Failed to create table:", error);
      toast({
        title: "Error",
        description: `Failed to create table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Table</CardTitle>
          <div className="w-64">
            <Select value={selectedDB} onValueChange={setSelectedDB}>
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_TYPES.map((db) => (
                  <SelectItem key={db} value={db}>
                    {db}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Database</label>
            <Select
              value={selectedDatabase}
              onValueChange={setSelectedDatabase}
              disabled={isLoadingDatabases || availableDatabases.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingDatabases
                      ? "Loading databases..."
                      : "Select database"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableDatabases.map((db) => (
                  <SelectItem key={db.name} value={db.name}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Table Name</label>
            <Input
              placeholder="Enter table name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              disabled={!selectedDatabase}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Columns</h3>
              <Button onClick={addColumn} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>

            <ScrollArea className="h-[500px] rounded-md border p-4">
              <div className="space-y-4">
                {columns.map((column, index) => (
                  <div
                    key={index}
                    className="flex flex-col p-4 rounded-lg border"
                  >
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-1 block">
                          Column Name
                        </label>
                        <Input
                          placeholder="Column name"
                          value={column.name}
                          onChange={(e) =>
                            updateColumn(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-48">
                        <label className="text-xs font-medium mb-1 block">
                          Data Type
                        </label>
                        <Select
                          value={column.type}
                          onValueChange={(value) =>
                            updateColumn(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {DATA_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add length input for varchar and char types */}
                      {(column.type === "varchar" ||
                        column.type === "char") && (
                        <div className="w-24">
                          <label className="text-xs font-medium mb-1 block">
                            Length
                          </label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Length"
                            value={column.length || ""}
                            onChange={(e) =>
                              updateColumn(index, "length", e.target.value)
                            }
                          />
                        </div>
                      )}

                      <div className="flex items-end mt-auto">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeColumn(index)}
                          disabled={columns.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-medium mb-1 block">
                          Constraints
                        </label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`pk-${index}`}
                              checked={column.isPrimaryKey}
                              onCheckedChange={(checked) =>
                                updateColumn(
                                  index,
                                  "isPrimaryKey",
                                  checked as boolean
                                )
                              }
                            />
                            <label htmlFor={`pk-${index}`} className="text-sm">
                              Primary Key
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`nullable-${index}`}
                              checked={column.isNullable}
                              disabled={column.isPrimaryKey}
                              onCheckedChange={(checked) =>
                                updateColumn(
                                  index,
                                  "isNullable",
                                  checked as boolean
                                )
                              }
                            />
                            <label
                              htmlFor={`nullable-${index}`}
                              className="text-sm"
                            >
                              Nullable
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`unique-${index}`}
                              checked={column.isUnique}
                              disabled={column.isPrimaryKey}
                              onCheckedChange={(checked) =>
                                updateColumn(
                                  index,
                                  "isUnique",
                                  checked as boolean
                                )
                              }
                            />
                            <label
                              htmlFor={`unique-${index}`}
                              className="text-sm"
                            >
                              Unique
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="w-48">
                        <label className="text-xs font-medium mb-1 block">
                          Default Value
                        </label>
                        <Input
                          placeholder="Default value"
                          value={column.defaultValue}
                          onChange={(e) =>
                            updateColumn(index, "defaultValue", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`fk-${index}`}
                          checked={column.isForeignKey}
                          onCheckedChange={(checked) =>
                            updateColumn(
                              index,
                              "isForeignKey",
                              checked as boolean
                            )
                          }
                        />
                        <label
                          htmlFor={`fk-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Foreign Key
                        </label>
                      </div>

                      {column.isForeignKey && (
                        <div className="ml-6 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium mb-1 block">
                                Referenced Table
                              </label>
                              <Select
                                value={column.foreignKeyTable}
                                onValueChange={(value) =>
                                  updateColumn(index, "foreignKeyTable", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                  {existingTables.map((table) => (
                                    <SelectItem
                                      key={table.name}
                                      value={table.name}
                                    >
                                      {table.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-xs font-medium mb-1 block">
                                Referenced Column
                              </label>
                              <Select
                                value={column.foreignKeyColumn}
                                disabled={!column.foreignKeyTable}
                                onValueChange={(value) =>
                                  updateColumn(index, "foreignKeyColumn", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                  {column.foreignKeyTable &&
                                    existingTables
                                      .find(
                                        (t) => t.name === column.foreignKeyTable
                                      )
                                      ?.columns.map((col, index) => (
                                        <SelectItem
                                          key={index}
                                          value={col.name}
                                        >
                                          {col.name}
                                        </SelectItem>
                                      ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* New cascade options section */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <label className="text-xs font-medium mb-1 block">
                                ON DELETE
                              </label>
                              <Select
                                value={column.onDeleteAction || "NO ACTION"}
                                onValueChange={(value) =>
                                  updateColumn(index, "onDeleteAction", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CASCADE_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">
                                ON UPDATE
                              </label>
                              <Select
                                value={column.onUpdateAction || "NO ACTION"}
                                onValueChange={(value) =>
                                  updateColumn(index, "onUpdateAction", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CASCADE_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button
            onClick={handleSave}
            className="w-full"
            disabled={
              !selectedDatabase ||
              !tableName ||
              columns.some((col) => !col.name)
            }
          >
            <Save className="h-4 w-4 mr-2" />
            Save Table
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
