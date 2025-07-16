"use client";

import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen flex flex-col">
                <AdminNavbar />
               <main className="flex-grow">{children}</main>
             </body>
           </html>
    );
}