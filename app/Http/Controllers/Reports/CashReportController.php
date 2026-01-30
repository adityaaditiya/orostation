<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CashEntry;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CashReportController extends Controller
{
    /**
     * Display the cash flow report.
     */
    public function index(Request $request)
    {
        $defaultDate = Carbon::today()->toDateString();
        $filters = [
            'start_date' => $request->input('start_date') ?: $defaultDate,
            'end_date' => $request->input('end_date') ?: $defaultDate,
            'invoice' => $request->input('invoice'),
            'cashier_id' => $request->input('cashier_id'),
            'customer_id' => $request->input('customer_id'),
        ];

        $transactionQuery = $this->applyFilters(
            Transaction::query()
                ->with(['cashier:id,name', 'customer:id,name']),
            $filters
        )->orderByDesc('created_at');

        $cashEntryQuery = $this->applyCashEntryFilters(
            CashEntry::query()->with(['cashier:id,name']),
            $filters
        )->orderByDesc('created_at');

        $transactionsList = (clone $transactionQuery)
            ->get()
            ->map(fn ($trx) => [
                'id' => 'transaction-' . $trx->id,
                'category' => 'Transaksi Penjualan',
                'description' => $trx->invoice,
                'cash_in' => (int) $trx->grand_total,
                'cash_out' => 0,
                'created_at' => $trx->created_at,
            ]);

        $cashEntryList = (clone $cashEntryQuery)
            ->get()
            ->map(fn ($entry) => [
                'id' => 'cash-entry-' . $entry->id,
                'category' => $entry->category === 'in' ? 'Uang Masuk' : 'Uang Keluar',
                'description' => $entry->description,
                'cash_in' => $entry->category === 'in' ? (int) $entry->amount : 0,
                'cash_out' => $entry->category === 'out' ? (int) $entry->amount : 0,
                'created_at' => $entry->created_at,
            ]);

        $mergedRows = $transactionsList
            ->concat($cashEntryList)
            ->sortByDesc('created_at')
            ->values();

        $transactions = $this->paginateRows($mergedRows, $request);

        $transactionTotals = $this->applyFilters(Transaction::query(), $filters)
            ->selectRaw('COALESCE(SUM(grand_total), 0) as cash_in_total')
            ->first();

        $cashEntryTotals = $this->applyCashEntryFilters(CashEntry::query(), $filters)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN category = 'in' THEN amount ELSE 0 END), 0) as cash_in_total,
                COALESCE(SUM(CASE WHEN category = 'out' THEN amount ELSE 0 END), 0) as cash_out_total
            ")
            ->first();

        $cashInTotal = (int) ($transactionTotals->cash_in_total ?? 0)
            + (int) ($cashEntryTotals->cash_in_total ?? 0);
        $cashOutTotal = (int) ($cashEntryTotals->cash_out_total ?? 0);

        $summary = [
            'cash_in_total' => $cashInTotal,
            'cash_out_total' => $cashOutTotal,
            'net_total' => $cashInTotal - $cashOutTotal,
        ];

        return Inertia::render('Dashboard/Reports/Cash', [
            'transactions' => $transactions,
            'summary' => $summary,
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Apply table filters.
     */
    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when($filters['invoice'] ?? null, fn ($q, $invoice) => $q->where('invoice', 'like', '%' . $invoice . '%'))
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['customer_id'] ?? null, fn ($q, $customer) => $q->where('customer_id', $customer))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end));
    }

    /**
     * Apply table filters for cash entries.
     */
    protected function applyCashEntryFilters($query, array $filters)
    {
        $query = $query
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end));

        if (! empty($filters['invoice']) || ! empty($filters['customer_id'])) {
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    /**
     * Paginate merged report rows.
     */
    protected function paginateRows(Collection $rows, Request $request, int $perPage = 10)
    {
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $pageItems = $rows->forPage($currentPage, $perPage)->values();

        return new LengthAwarePaginator($pageItems, $rows->count(), $perPage, $currentPage, [
            'path' => LengthAwarePaginator::resolveCurrentPath(),
            'query' => $request->query(),
        ]);
    }
}
