import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { IconCirclePlus, IconPencilCog, IconTrash } from "@tabler/icons-react";
import Button from "@/Components/Dashboard/Button";
import Search from "@/Components/Dashboard/Search";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";

export default function Index({ studioPages }) {
    return (
        <>
            <Head title="Pilates Studio Control" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pilates Studio Control</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Kelola konten menu welcome: Home, About, Classes, Schedule, Pricing, Trainers, Testimonials, Contact.</p>
                </div>
                <Link
                    href={route("studio-pages.create")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
                >
                    <IconCirclePlus size={18} />
                    Tambah Menu
                </Link>
            </div>

            <div className="mb-4 w-full sm:w-80">
                <Search url={route("studio-pages.index")} placeholder="Cari menu..." />
            </div>

            <Table.Card title="Data Menu Welcome">
                <Table>
                    <Table.Thead>
                        <tr>
                            <Table.Th className="w-16">Urut</Table.Th>
                            <Table.Th>Menu</Table.Th>
                            <Table.Th>Judul</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {studioPages.data.map((page) => (
                            <tr key={page.id}>
                                <Table.Td>{page.sort_order}</Table.Td>
                                <Table.Td className="font-medium">{page.menu_label}</Table.Td>
                                <Table.Td>{page.title}</Table.Td>
                                <Table.Td>{page.is_active ? "Aktif" : "Nonaktif"}</Table.Td>
                                <Table.Td>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="edit"
                                            icon={<IconPencilCog size={16} />}
                                            className="border bg-warning-100 border-warning-200 text-warning-600 hover:bg-warning-200"
                                            href={route("studio-pages.edit", page.id)}
                                        />
                                        <Button
                                            type="delete"
                                            icon={<IconTrash size={16} />}
                                            className="border bg-danger-100 border-danger-200 text-danger-600 hover:bg-danger-200"
                                            url={route("studio-pages.destroy", page.id)}
                                        />
                                    </div>
                                </Table.Td>
                            </tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.Card>

            <div className="mt-4">
                <Pagination links={studioPages.links} align="end" />
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
