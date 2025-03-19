"use client";

import { useState } from "react";
import { ConnectionForm } from "@/components/connection-form";
import { DatabaseSelector } from "@/components/database-selector";
import { TableList } from "@/components/table-list";
import { DiagramView } from "@/components/diagram-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { DatabaseConnection, Table } from "@/lib/types";
import { getTables } from "@/lib/db-service";
import { Database, LayoutGrid } from "lucide-react";

export default function Home() {
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [currentView, setCurrentView] = useState<
    "connection" | "database" | "tables" | "diagram"
  >("connection");

  const handleConnect = (conn: DatabaseConnection) => {
    console.log("Connected to database:", conn);
    localStorage.setItem("databaseConnection", JSON.stringify(conn));
    setConnection(conn);
    setCurrentView("database");
  };

  const handleSelectDatabase = async (databaseName: string) => {
    if (!connection) return;

    setSelectedDatabase(databaseName);
    setIsLoadingTables(true);

    try {
      const fetchedTables = await getTables(connection, databaseName);
      setTables(fetchedTables);
      setCurrentView("tables");
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleSelectTables = (tables: Table[]) => {
    setSelectedTables(tables);
    setCurrentView("diagram");
  };

  const handleBackToTables = () => {
    setCurrentView("tables");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Connection step */}
        {currentView === "connection" && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold">Connect to Your Database</h2>
              <p className="text-muted-foreground">
                Enter your database connection details to start visualizing
                relationships
              </p>
            </div>
            <ConnectionForm onConnect={handleConnect} />
          </div>
        )}

        {/* Database selection step */}
        {currentView === "database" && connection && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold">Select a Database</h2>
              <p className="text-muted-foreground">
                Choose which database you want to visualize
              </p>
            </div>
            <DatabaseSelector
              connection={connection}
              onSelectDatabase={handleSelectDatabase}
            />
          </div>
        )}

        {/* Table selection step */}
        {currentView === "tables" && connection && selectedDatabase && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Tables in {selectedDatabase}
                </h2>
                <p className="text-muted-foreground">
                  Select the tables you want to include in your visualization
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Connected to: {connection.host}:{connection.port}
                </span>
              </div>
            </div>
            <TableList
              tables={tables}
              isLoading={isLoadingTables}
              onSelectTables={handleSelectTables}
            />
          </div>
        )}

        {/* Diagram view */}
        {currentView === "diagram" && selectedTables.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Database Diagram</h2>
                <p className="text-muted-foreground">
                  Visualizing {selectedTables.length} tables from{" "}
                  {selectedDatabase}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  <LayoutGrid className="inline h-4 w-4 mr-1" />
                  {selectedTables.length} tables selected
                </span>
              </div>
            </div>
            <DiagramView tables={selectedTables} onBack={handleBackToTables} />
          </div>
        )}
      </div>
    </main>
  );
}
