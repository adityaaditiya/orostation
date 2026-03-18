<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CashEntry;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\User;
use App\Support\SimplePdfExport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CashReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);
        [$includeTransactions, $includeCashEntries] = $this->resolveDataInclusions($filters['transaction_category']);

        $transactionQuery = $this->applyFilters(
            Transaction::query()->notCanceled()->with(['cashier:id,name', 'customer:id,name']),
            $filters
        )->orderByDesc('created_at');

        $cashEntryQuery = $this->applyCashEntryFilters(
            CashEntry::query()->with(['cashier:id,name']),
            $filters
        )->orderByDesc('created_at');

        $transactionsList = $includeTransactions
            ? (clone $transactionQuery)->get()->map(fn ($trx) => [
                'id' => 'transaction-' . $trx->id,
                'category' => 'Transaksi Penjualan',
                'description' => $trx->invoice,
                'cash_in' => (int) $trx->grand_total,
                'cash_out' => 0,
                'created_at' => $trx->created_at,
            ])
            : collect();

        $cashEntryList = $includeCashEntries
            ? (clone $cashEntryQuery)->get()->map(fn ($entry) => [
                'id' => 'cash-entry-' . $entry->id,
                'category' => $entry->category,
                'description' => $entry->description,
                'cash_in' => $entry->type === CashEntry::TYPE_IN ? (int) $entry->amount : 0,
                'cash_out' => $entry->type === CashEntry::TYPE_OUT ? (int) $entry->amount : 0,
                'created_at' => $entry->created_at,
            ])
            : collect();

        $mergedRows = $transactionsList->concat($cashEntryList)->sortByDesc('created_at')->values();
        $transactions = $this->paginateRows($mergedRows, $request);

        $transactionTotals = $includeTransactions
            ? $this->applyFilters(Transaction::query()->notCanceled(), $filters)
                ->selectRaw('COALESCE(SUM(grand_total), 0) as cash_in_total')
                ->first()
            : (object) ['cash_in_total' => 0];

        $cashEntryTotals = $includeCashEntries
            ? $this->applyCashEntryFilters(CashEntry::query(), $filters)
                ->selectRaw("COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) as cash_in_total, COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) as cash_out_total")
                ->first()
            : (object) ['cash_in_total' => 0, 'cash_out_total' => 0];

        $cashInTotal = (int) ($transactionTotals->cash_in_total ?? 0) + (int) ($cashEntryTotals->cash_in_total ?? 0);
        $cashOutTotal = (int) ($cashEntryTotals->cash_out_total ?? 0);

        return Inertia::render('Dashboard/Reports/Cash', [
            'transactions' => $transactions,
            'summary' => [
                'cash_in_total' => $cashInTotal,
                'cash_out_total' => $cashOutTotal,
                'net_total' => $cashInTotal - $cashOutTotal,
            ],
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
            'transactionCategories' => $this->transactionCategories(),
        ]);
    }

    public function export(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $rows = $this->buildExportRows($filters, true);

        return $this->downloadExcel('laporan-keuangan-cash.xls', ['Kategori', 'Deskripsi', 'Uang Masuk', 'Uang Keluar'], $rows);
    }

    public function exportPdf(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $rows = $this->buildExportRows($filters, false);

        return $this->downloadPdf(
            'laporan-keuangan-cash.pdf',
            'Laporan Keuangan Cash',
            $this->buildPeriodLabel($filters),
            ['Kategori', 'Deskripsi', 'Uang Masuk', 'Uang Keluar'],
            $rows
        );
    }

    protected function buildExportRows(array $filters, bool $sortByDate): array
    {
        [$includeTransactions, $includeCashEntries] = $this->resolveDataInclusions($filters['transaction_category']);

        $transactionQuery = $this->applyFilters(
            Transaction::query()->notCanceled()->with(['cashier:id,name', 'customer:id,name']),
            $filters
        )->orderByDesc('created_at');

        $cashEntryQuery = $this->applyCashEntryFilters(
            CashEntry::query()->with(['cashier:id,name']),
            $filters
        )->orderByDesc('created_at');

        $transactionsList = $includeTransactions
            ? (clone $transactionQuery)->get()->map(fn ($trx) => [
                'category' => 'Transaksi Penjualan',
                'description' => $trx->invoice,
                'cash_in' => (int) $trx->grand_total,
                'cash_out' => 0,
                'created_at' => $trx->created_at,
            ])
            : collect();

        $cashEntryList = $includeCashEntries
            ? (clone $cashEntryQuery)->get()->map(fn ($entry) => [
                'category' => $entry->category,
                'description' => $entry->description,
                'cash_in' => $entry->type === CashEntry::TYPE_IN ? (int) $entry->amount : 0,
                'cash_out' => $entry->type === CashEntry::TYPE_OUT ? (int) $entry->amount : 0,
                'created_at' => $entry->created_at,
            ])
            : collect();

        $mergedRows = $transactionsList->concat($cashEntryList);

        if ($sortByDate) {
            $mergedRows = $mergedRows->sortByDesc('created_at')->values();
        }

        return $mergedRows->map(function ($row) {
            return [
                $row['category'],
                $row['description'],
                $this->formatCurrency((int) ($row['cash_in'] ?? 0)),
                $this->formatCurrency((int) ($row['cash_out'] ?? 0)),
            ];
        })->all();
    }

    protected function applyFilters($query, array $filters)
    {
        $query = $query
            ->when($filters['invoice'] ?? null, fn ($q, $invoice) => $q->where('invoice', 'like', '%' . $invoice . '%'))
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['customer_id'] ?? null, fn ($q, $customer) => $q->where('customer_id', $customer))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end));

        if (($filters['shift'] ?? null) === 'pagi') {
            $query->whereTime('created_at', '>=', '06:00:00')->whereTime('created_at', '<', '15:00:00');
        }

        if (($filters['shift'] ?? null) === 'malam') {
            $query->where(function ($shiftQuery) {
                $shiftQuery->whereTime('created_at', '>=', '15:00:00')
                    ->orWhereTime('created_at', '<=', '00:00:00');
            });
        }

        return $query;
    }

    protected function applyCashEntryFilters($query, array $filters)
    {
        $query = $query
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end));

        if (($filters['shift'] ?? null) === 'pagi') {
            $query->whereTime('created_at', '>=', '06:00:00')->whereTime('created_at', '<', '15:00:00');
        }

        if (($filters['shift'] ?? null) === 'malam') {
            $query->where(function ($shiftQuery) {
                $shiftQuery->whereTime('created_at', '>=', '15:00:00')
                    ->orWhereTime('created_at', '<=', '00:00:00');
            });
        }

        if (! empty($filters['transaction_category']) && $filters['transaction_category'] !== 'transaksi_penjualan') {
            $query->where('category', $filters['transaction_category']);
        }

        return $query;
    }

    protected function resolveFilters(Request $request): array
    {
        $defaultDate = Carbon::today()->toDateString();

        return [
            'start_date' => $request->input('start_date') ?: $defaultDate,
            'end_date' => $request->input('end_date') ?: $defaultDate,
            'invoice' => $request->input('invoice'),
            'cashier_id' => $request->input('cashier_id'),
            'customer_id' => $request->input('customer_id'),
            'shift' => $request->input('shift'),
            'transaction_category' => $request->input('transaction_category'),
        ];
    }

    protected function resolveDataInclusions(?string $transactionCategory): array
    {
        $includeTransactions = empty($transactionCategory) || $transactionCategory === 'transaksi_penjualan';
        $includeCashEntries = empty($transactionCategory) || in_array($transactionCategory, CashEntry::CATEGORY_OPTIONS, true);

        return [$includeTransactions, $includeCashEntries];
    }

    protected function transactionCategories(): array
    {
        return array_merge(['Transaksi Penjualan'], CashEntry::CATEGORY_OPTIONS);
    }

    protected function paginateRows(Collection $rows, Request $request, int $perPage = 10): LengthAwarePaginator
    {
        $page = LengthAwarePaginator::resolveCurrentPage();
        $items = $rows->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator($items, $rows->count(), $perPage, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);
    }

    protected function formatCurrency(int $value): string
    {
        return 'Rp ' . number_format($value, 0, ',', '.');
    }

    protected function buildPeriodLabel(array $filters): string
    {
        $start = $filters['start_date'] ?? null;
        $end = $filters['end_date'] ?? null;

        if ($start && $end) {
            return Carbon::parse($start)->format('d/m/Y') . ' - ' . Carbon::parse($end)->format('d/m/Y');
        }

        if ($start) {
            return 'Mulai ' . Carbon::parse($start)->format('d/m/Y');
        }

        if ($end) {
            return 'Sampai ' . Carbon::parse($end)->format('d/m/Y');
        }

        return 'Semua Periode';
    }

    protected function downloadExcel(string $filename, array $headers, array $rows)
    {
        $content = implode("\t", $headers) . "\n";

        foreach ($rows as $row) {
            $content .= implode("\t", array_map(fn ($value) => str_replace(["\t", "\n", "\r"], ' ', (string) $value), $row)) . "\n";
        }

        return response($content, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    protected function downloadPdf(string $filename, string $title, string $period, array $headers, array $rows)
    {
        return SimplePdfExport::download($filename, $title, $period, $headers, $rows);
    }
}
