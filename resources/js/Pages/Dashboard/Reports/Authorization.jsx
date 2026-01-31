import React, { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconFileCertificate,
    IconFilter,
    IconSearch,
    IconX,
} from "@tabler/icons-react";

const defaultFilters = {
    start_date: "",
    end_date: "",
};

const Authorization = ({ transactions, filters }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filterData, setFilterData] = useState({
        ...defaultFilters,
        start_date: filters?.start_date ?? "",
        end_date: filters?.end_date ?? "",
    });

    useEffect(() => {
        setFilterData({
            ...defaultFilters,
            start_date: filters?.start_date ?? "",
            end_date: filters?.end_date ?? "",
        });
    }, [filters]);

    const handleChange = (field, value) =>
        setFilterData((prev) => ({ ...prev, [field]: value }));

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route("reports.authorizations.index"), filterData, {
            preserveScroll: true,
            preserveState: true,
        });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setFilterData(defaultFilters);
        router.get(route("reports.authorizations.index"), defaultFilters, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const rows = transactions?.data ?? [];
    const links = transactions?.links ?? [];

    const hasActiveFilters = filterData.start_date || filterData.end_date;

    return (
        <>
            <Head title="Laporan Otorisasi" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconFileCertificate
                                size={28}
                                className="text-primary-500"
                            />
                            Laporan Otorisasi
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Riwayat otorisasi pembatalan transaksi
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                            showFilters || hasActiveFilters
                                ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/50 dark:border-primary-800 dark:text-primary-400"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                    >
                        <IconFilter size={18} />
                        <span>Filter</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-slide-up">
                        <form onSubmit={applyFilters}>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        type="date"
                                        value={filterData.start_date}
                                        onChange={(e) =>
                                            handleChange(
                                                "start_date",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tanggal Akhir
                                    </label>
                                    <input
                                        type="date"
                                        value={filterData.end_date}
                                        onChange={(e) =>
                                            handleChange(
                                                "end_date",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                    >
                                        <IconSearch size={18} />
                                        <span>Cari</span>
                                    </button>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <IconX size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Kasir
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Keterangan Otorisasi
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Email Otorisasi
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Waktu Otorisasi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.length > 0 ? (
                                    rows.map((transaction, index) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {index +
                                                    1 +
                                                    ((transactions?.current_page ??
                                                        1) -
                                                        1) *
                                                        (transactions?.per_page ??
                                                            rows.length ||
                                                            1)}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                {transaction.invoice ?? "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {transaction.cashier?.name ??
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {transaction.cancellation_note ||
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {transaction.canceled_by_email ||
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {transaction.canceled_at ||
                                                    "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                        >
                                            Tidak ada data otorisasi.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {links.length > 3 && <Pagination links={links} />}
            </div>
        </>
    );
};

Authorization.layout = (page) => <DashboardLayout children={page} />;

export default Authorization;
