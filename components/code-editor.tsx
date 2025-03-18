"use client";

import { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "javascript" | "sql";
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "sql",
  height = "400px",
}: MonacoEditorProps) {
  const monaco = useMonaco();

  // Configure Monaco editor when loaded
  useEffect(() => {
    if (monaco) {
      // Register SQL language features
      if (language === "sql") {
        // SQL keywords suggestion list
        const sqlKeywords = [
          "SELECT",
          "FROM",
          "WHERE",
          "INSERT",
          "UPDATE",
          "DELETE",
          "CREATE",
          "TABLE",
          "ALTER",
          "DROP",
          "INDEX",
          "VIEW",
          "TRIGGER",
          "PROCEDURE",
          "FUNCTION",
          "DATABASE",
          "SCHEMA",
          "JOIN",
          "INNER",
          "LEFT",
          "RIGHT",
          "OUTER",
          "FULL",
          "GROUP BY",
          "ORDER BY",
          "HAVING",
          "LIMIT",
          "OFFSET",
          "UNION",
          "ALL",
          "AS",
          "DISTINCT",
          "IN",
          "LIKE",
          "BETWEEN",
          "IS NULL",
          "IS NOT NULL",
          "AND",
          "OR",
          "NOT",
          "AVG",
          "COUNT",
          "MAX",
          "MIN",
          "SUM",
          "PRIMARY KEY",
          "FOREIGN KEY",
          "REFERENCES",
          "DEFAULT",
          "AUTO_INCREMENT",
          "INT",
          "VARCHAR",
          "TEXT",
          "DATE",
          "DATETIME",
          "BOOLEAN",
          "FLOAT",
          "DECIMAL",
        ];

        // SQL data types
        const sqlTypes = [
          "INT",
          "INTEGER",
          "TINYINT",
          "SMALLINT",
          "MEDIUMINT",
          "BIGINT",
          "DECIMAL",
          "NUMERIC",
          "FLOAT",
          "DOUBLE",
          "BIT",
          "CHAR",
          "VARCHAR",
          "BINARY",
          "VARBINARY",
          "TEXT",
          "TINYTEXT",
          "MEDIUMTEXT",
          "LONGTEXT",
          "BLOB",
          "TINYBLOB",
          "MEDIUMBLOB",
          "LONGBLOB",
          "ENUM",
          "SET",
          "DATE",
          "DATETIME",
          "TIMESTAMP",
          "TIME",
          "YEAR",
          "BOOLEAN",
          "JSON",
        ];

        // Register SQL completions provider
        monaco.languages.registerCompletionItemProvider("sql", {
          provideCompletionItems: (model, position, context, token) => {
            const textUntilPosition = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const wordUntilPosition =
              textUntilPosition.trim().split(/\s+/).pop() || "";

            const range = {
              startLineNumber: position.lineNumber,
              startColumn: position.column - wordUntilPosition.length,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            };

            // Create keyword suggestions
            const keywordSuggestions = sqlKeywords.map((keyword) => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              detail: "SQL Keyword",
              documentation: `SQL keyword: ${keyword}`,
              range,
            }));

            // Create type suggestions
            const typeSuggestions = sqlTypes.map((type) => ({
              label: type,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: type,
              detail: "SQL Data Type",
              documentation: `SQL data type: ${type}`,
              range,
            }));

            return {
              suggestions: [...keywordSuggestions, ...typeSuggestions],
            };
          },
        });
      }
    }
  }, [monaco, language]);

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(newValue) => onChange(newValue || "")}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        quickSuggestions: true, // Enable quick suggestions
        suggestOnTriggerCharacters: true, // Show suggestions when typing trigger characters
        parameterHints: { enabled: true }, // Enable parameter hints
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showMethods: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          showIssues: true,
          showUsers: true,
        },
      }}
      className="border rounded-md"
    />
  );
}
