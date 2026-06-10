"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompactCurrency } from "@/lib/format";

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string;
  title: string | null;
  dealCount: number;
  openValue: number;
  wonValue: number;
};

export function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company, email…"
          className="pl-8"
        />
      </div>

      <div className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Deals</TableHead>
              <TableHead className="text-right">Open</TableHead>
              <TableHead className="text-right">Won</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No contacts match “{query}”.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {c.company}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.title ?? "—"}
                </TableCell>
                <TableCell className="font-numeric text-muted-foreground text-xs">
                  {c.email ?? "—"}
                </TableCell>
                <TableCell className="font-numeric text-muted-foreground text-xs">
                  {c.phone ?? "—"}
                </TableCell>
                <TableCell className="font-numeric text-right">
                  {c.dealCount}
                </TableCell>
                <TableCell className="font-numeric text-right">
                  {formatCompactCurrency(c.openValue)}
                </TableCell>
                <TableCell className="font-numeric text-success text-right">
                  {c.wonValue > 0 ? formatCompactCurrency(c.wonValue) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
