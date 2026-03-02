import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconCirclePlus,
    IconPencilCog,
    IconTrash,
    IconPhone,
    IconNotes,
    IconDatabaseOff,
} from "@tabler/icons-react";

function TrainerCard({ trainer }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {trainer.name}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                    <IconPhone size={16} /> {trainer.no_telp}
                </p>
                <p className="flex items-start gap-2">
                    <IconNotes size={16} className="mt-0.5" />
                    <span className="line-clamp-3">{trainer.biodata}</span>
                </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href={route("trainers.edit", trainer.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning-100 text-warning-700 text-sm font-medium"
                >
                    <IconPencilCog size={16} /> Edit
                </Link>
                <Button
                    type="delete"
                    icon={<IconTrash size={16} />}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-danger-100 text-danger-700 text-sm font-medium"
                    url={route("trainers.destroy", trainer.id)}
                    label="Hapus"
                />
            </div>
        </div>
    );
}

export default function Index({ trainers }) {
    return (
        <>
            <Head title="Trainer" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Trainer
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Kelola data trainer dan biodata.
                    </p>
                </div>
                <Button
                    type="link"
                    icon={<IconCirclePlus size={18} />}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                    label="Tambah Trainer"
                    href={route("trainers.create")}
                />
            </div>

            <div className="mb-4 max-w-sm">
                <Search url={route("trainers.index")} placeholder="Cari trainer..." />
            </div>

            {trainers.data.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {trainers.data.map((trainer) => (
                            <TrainerCard key={trainer.id} trainer={trainer} />
                        ))}
                    </div>
                    <div className="mt-6">
                        <Pagination links={trainers.links} align="end" />
                    </div>
                </>
            ) : (
                <div className="py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                    <IconDatabaseOff size={48} className="mx-auto mb-3" />
                    Data trainer belum tersedia.
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
