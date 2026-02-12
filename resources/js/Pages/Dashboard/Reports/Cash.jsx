import React, { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import InputSelect from "@/Components/Dashboard/InputSelect";
import Button from "@/Components/Dashboard/Button";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconArrowDownCircle,
    IconArrowUpCircle,
    IconDatabaseOff,
    IconFileSpreadsheet,
    IconFilter,
    IconSearch,
    IconX,
    IconWallet,
} from "@tabler/icons-react";

const SummaryCard = ({ icon, title, value, description, gradient }) => (
    <div
        className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg`}
    >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
            {React.cloneElement(icon, {
                size: 96,
                strokeWidth: 0.5,
                className: "transform translate-x-4 -translate-y-4",
            })}
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-white/20">
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                <span className="text-sm font-medium opacity-90">{title}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80 mt-1">{description}</p>
        </div>
    </div>
);

const defaultFilterState = {
    start_date: "",
    end_date: "",
    invoice: "",
    cashier_id: "",
    customer_id: "",
    shift: "",
};

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);

const castFilterString = (value) =>
    typeof value === "number" ? String(value) : value ?? "";

const Cash = ({ transactions, summary, filters, cashiers, customers }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filterData, setFilterData] = useState({
        ...defaultFilterState,
        start_date: castFilterString(filters?.start_date),
        end_date: castFilterString(filters?.end_date),
        invoice: castFilterString(filters?.invoice),
        cashier_id: castFilterString(filters?.cashier_id),
        customer_id: castFilterString(filters?.customer_id),
        shift: castFilterString(filters?.shift),
    });

    const cashierFromFilters = useMemo(
        () =>
            cashiers.find(
                (c) => castFilterString(c.id) === filterData.cashier_id
            ) ?? null,
        [cashiers, filterData.cashier_id]
    );

    const customerFromFilters = useMemo(
        () =>
            customers.find(
                (c) => castFilterString(c.id) === filterData.customer_id
            ) ?? null,
        [customers, filterData.customer_id]
    );

    const [selectedCashier, setSelectedCashier] = useState(cashierFromFilters);
    const [selectedCustomer, setSelectedCustomer] =
        useState(customerFromFilters);

    useEffect(
        () => setSelectedCashier(cashierFromFilters),
        [cashierFromFilters]
    );
    useEffect(
        () => setSelectedCustomer(customerFromFilters),
        [customerFromFilters]
    );
    useEffect(() => {
        setFilterData({
            ...defaultFilterState,
            start_date: castFilterString(filters?.start_date),
            end_date: castFilterString(filters?.end_date),
            invoice: castFilterString(filters?.invoice),
            cashier_id: castFilterString(filters?.cashier_id),
            customer_id: castFilterString(filters?.customer_id),
            shift: castFilterString(filters?.shift),
        });
    }, [filters]);

    const handleChange = (field, value) =>
        setFilterData((prev) => ({ ...prev, [field]: value }));
    const handleSelectCashier = (value) => {
        setSelectedCashier(value);
        handleChange("cashier_id", value ? String(value.id) : "");
    };
    const handleSelectCustomer = (value) => {
        setSelectedCustomer(value);
        handleChange("customer_id", value ? String(value.id) : "");
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(route("reports.cash.index"), filterData, {
            preserveScroll: true,
            preserveState: true,
        });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setFilterData(defaultFilterState);
        setSelectedCashier(null);
        setSelectedCustomer(null);
        router.get(route("reports.cash.index"), defaultFilterState, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const rows = transactions?.data ?? [];
    const paginationLinks = transactions?.links ?? [];

    const hasActiveFilters =
        filterData.invoice ||
        filterData.start_date ||
        filterData.end_date ||
        filterData.cashier_id ||
        filterData.customer_id ||
        filterData.shift;

    const safeSummary = {
        cash_in_total: summary?.cash_in_total ?? 0,
        cash_out_total: summary?.cash_out_total ?? 0,
        net_total: summary?.net_total ?? 0,
    };

    const summaryCards = [
        {
            title: "Uang Masuk",
            value: formatCurrency(safeSummary.cash_in_total),
            description: "Total penerimaan",
            icon: <IconArrowUpCircle />,
            gradient: "from-success-500 to-success-700",
        },
        {
            title: "Uang Keluar",
            value: formatCurrency(safeSummary.cash_out_total),
            description: "Total pengeluaran",
            icon: <IconArrowDownCircle />,
            gradient: "from-danger-500 to-danger-700",
        },
        {
            title: "Saldo Bersih",
            value: formatCurrency(safeSummary.net_total),
            description: "Uang masuk - keluar",
            icon: <IconWallet />,
            gradient: "from-primary-500 to-primary-700",
        },
    ];

    const handleExport = () => {
        window.location.href = route("reports.cash.export", filterData);
    };

    return (
        <>
            <Head title="Laporan Keuangan Cash" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconWallet
                                size={28}
                                className="text-primary-500"
                            />
                            Laporan Keuangan Cash
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ringkasan arus kas transaksi dan uang kas
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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {summaryCards.map((card) => (
                        <SummaryCard key={card.title} {...card} />
                    ))}
                </div>

                {showFilters && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-slide-up">
                        <form onSubmit={applyFilters}>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Invoice
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="TRX-..."
                                        value={filterData.invoice}
                                        onChange={(e) =>
                                            handleChange(
                                                "invoice",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <InputSelect
                                    label="Kasir"
                                    data={cashiers}
                                    selected={selectedCashier}
                                    setSelected={handleSelectCashier}
                                    placeholder="Semua kasir"
                                    searchable
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Shift
                                    </label>
                                    <select
                                        value={filterData.shift}
                                        onChange={(e) =>
                                            handleChange("shift", e.target.value)
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    >
                                        <option value="">Semua shift</option>
                                        <option value="pagi">Shift Pagi (06:00 - 15:00)</option>
                                        <option value="malam">Shift Malam (15:00 - 00:00)</option>
                                    </select>
                                </div>
                                {/* <InputSelect
                                    label="Pelanggan"
                                    data={customers}
                                    selected={selectedCustomer}
                                    setSelected={handleSelectCustomer}
                                    placeholder="Semua pelanggan"
                                    searchable
                                /> */}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <IconX size={18} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                >
                                    <IconSearch size={18} />
                                    Terapkan
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {rows.length > 0 ? (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                                Deskripsi
                                            </th>
                                            <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                                Uang Masuk
                                            </th>
                                            <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                                Uang Keluar
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rows.map((trx) => (
                                            <tr
                                                key={trx.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {trx.category}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                    {trx.description}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                                    {formatCurrency(
                                                        trx.cash_in ?? 0
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-500 dark:text-slate-400">
                                                    {formatCurrency(
                                                        trx.cash_out ?? 0
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                label="Export Excel"
                                icon={<IconFileSpreadsheet size={18} />}
                                className="bg-success-500 hover:bg-success-600 text-white"
                                onClick={handleExport}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <IconDatabaseOff
                                size={32}
                                className="text-slate-400"
                            />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
                            Tidak Ada Data
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tidak ada transaksi sesuai filter.
                        </p>
                    </div>
                )}

                {paginationLinks.length > 3 && (
                    <Pagination links={paginationLinks} />
                )}
            </div>
        </>
    );
};

Cash.layout = (page) => <DashboardLayout children={page} />;

export default Cash;
