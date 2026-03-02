import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import toast from "react-hot-toast";
import { IconUsers, IconDeviceFloppy, IconArrowLeft } from "@tabler/icons-react";

export default function Create() {
    const { errors } = usePage().props;
    const { data, setData, post, processing } = useForm({
        name: "",
        no_telp: "",
        biodata: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("trainers.store"), {
            onSuccess: () => toast.success("Trainer berhasil ditambahkan"),
            onError: () => toast.error("Gagal menyimpan trainer"),
        });
    };

    return (
        <>
            <Head title="Tambah Trainer" />
            <div className="mb-6">
                <Link href={route("trainers.index")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3">
                    <IconArrowLeft size={16} /> Kembali ke Trainer
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconUsers size={28} className="text-primary-500" /> Tambah Trainer
                </h1>
            </div>

            <form onSubmit={submit} className="max-w-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="text" label="Nama Trainer" errors={errors.name} value={data.name} onChange={(e) => setData("name", e.target.value)} />
                        <Input type="text" label="No. Handphone" errors={errors.no_telp} value={data.no_telp} onChange={(e) => setData("no_telp", e.target.value)} />
                    </div>
                    <Textarea label="Biodata" rows={4} errors={errors.biodata} value={data.biodata} onChange={(e) => setData("biodata", e.target.value)} />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href={route("trainers.index")} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600">Batal</Link>
                        <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white">
                            <IconDeviceFloppy size={18} /> {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
