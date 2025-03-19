"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Database, TableProperties, MessageSquare } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Database className="h-6 w-6" />
              <span className="text-xl font-bold">DB FORGE</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/create-table">
                <Button
                  variant={pathname === "/create-table" ? "default" : "ghost"}
                  className="flex items-center"
                >
                  <TableProperties className="h-4 w-4 mr-2" />
                  Create Table
                </Button>
              </Link>

              <Link href="/sql-editor">
                <Button
                  variant={pathname === "/sql-editor" ? "default" : "ghost"}
                  className="flex items-center"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat & SQL
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
