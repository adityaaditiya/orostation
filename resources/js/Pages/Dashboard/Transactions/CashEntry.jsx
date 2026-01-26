import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import toast from "react-hot-toast";
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconWallet,
} from "@tabler/icons-react";

export default function CashEntry() {
    const { errors } = usePage().props;

    const { data, setData, post, processing, reset } = useForm({
        category: "in",
        description: "",
        amount: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("transactions.cash.store"), {
            onSuccess: () => {
                toast.success("Uang kas berhasil disimpan");
                reset("description", "amount");
            },
            onError: () => toast.error("Gagal menyimpan uang kas"),
        });
    };

    return (
        <>
            <Head title="Uang Kas" />

            <div className="mb-6">
                <Link
                    href={route("transactions.history")}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3"
                >
                    <IconArrowLeft size={16} />
                    Kembali ke Riwayat Transaksi
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconWallet size={28} className="text-primary-500" />
                    Uang Kas
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Catat uang masuk dan uang keluar yang akan masuk ke laporan
                    keuangan cash.
                </p>
            </div>

            <form onSubmit={submit}>
                <div className="max-w-2xl">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Kategori
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) =>
                                        setData("category", e.target.value)
                                    }
                                    className={`
                                        w-full h-11 px-4 text-sm rounded-xl
                                        border border-slate-200 dark:border-slate-700
                                        bg-slate-50 dark:bg-slate-800
                                        text-slate-800 dark:text-slate-200
                                        focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                                        transition-all duration-200
                                        ${
                                            errors.category
                                                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                                                : ""
                                        }
                                    `}
                                >
                                    <option value="in">Uang Masuk</option>
                                    <option value="out">Uang Keluar</option>
                                </select>
                                {errors.category && (
                                    <small className="text-xs text-danger-500 dark:text-danger-400">
                                        {errors.category}
                                    </small>
                                )}
                            </div>
                            <Input
                                type="text"
                                label="Deskripsi"
                                placeholder="Contoh: Biaya listrik"
                                errors={errors.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                value={data.description}
                            />
                            <Input
                                type="number"
                                label="Nominal"
                                placeholder="Contoh: 100000"
                                errors={errors.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
                                }
                                value={data.amount}
                                min="0"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={route("transactions.history")}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                <IconDeviceFloppy size={18} />
                                {processing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

CashEntry.layout = (page) => <DashboardLayout children={page} />;
