import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";

export default function Create() {
    const { errors } = usePage().props;
    const { data, setData, post, processing } = useForm({
        slug: "",
        menu_label: "",
        title: "",
        content: "",
        sort_order: 0,
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("studio-pages.store"));
    };

    return (
        <>
            <Head title="Tambah Menu Welcome" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tambah Menu Welcome</h1>

            <form onSubmit={submit} className="max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <Input label="Slug" value={data.slug} errors={errors.slug} onChange={(e) => setData("slug", e.target.value)} />
                <Input label="Label Menu" value={data.menu_label} errors={errors.menu_label} onChange={(e) => setData("menu_label", e.target.value)} />
                <Input label="Judul Section" value={data.title} errors={errors.title} onChange={(e) => setData("title", e.target.value)} />
                <Textarea label="Konten" value={data.content} errors={errors.content} onChange={(e) => setData("content", e.target.value)} rows={5} />
                <Input type="number" label="Urutan" value={data.sort_order} errors={errors.sort_order} onChange={(e) => setData("sort_order", e.target.value)} />

                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)} />
                    Aktifkan menu
                </label>

                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600" disabled={processing}>
                        Simpan
                    </button>
                    <Link href={route("studio-pages.index")} className="px-4 py-2 rounded-xl border border-slate-300">
                        Batal
                    </Link>
                </div>
            </form>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
