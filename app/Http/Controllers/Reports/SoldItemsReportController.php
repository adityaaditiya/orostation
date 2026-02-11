<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\TransactionDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SoldItemsReportController extends Controller
{
    /**
     * Display sold items report.
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

        $baseQuery = $this->applyFilters(
            TransactionDetail::query()
                ->with([
                    'product:id,title',
                    'transaction:id,invoice,created_at,cashier_id,customer_id',
                    'transaction.cashier:id,name',
                    'transaction.customer:id,name',
                ])
                ->whereHas('transaction', fn ($query) => $query->notCanceled()),
            $filters
        )->orderByDesc('id');

        $soldItems = (clone $baseQuery)
            ->paginate(10)
            ->withQueryString();

        $totals = (clone $baseQuery)
            ->selectRaw('COALESCE(SUM(qty), 0) as total_items')
            ->selectRaw('COALESCE(SUM(qty * price), 0) as total_nominal')
            ->selectRaw('COUNT(DISTINCT transaction_id) as total_invoices')
            ->first();

        $summary = [
            'total_items' => (int) ($totals->total_items ?? 0),
            'total_nominal' => (int) ($totals->total_nominal ?? 0),
            'total_invoices' => (int) ($totals->total_invoices ?? 0),
        ];

        return Inertia::render('Dashboard/Reports/SoldItems', [
            'soldItems' => $soldItems,
            'summary' => $summary,
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when($filters['invoice'] ?? null, fn ($q, $invoice) => $q->whereHas('transaction', fn ($trx) => $trx->where('invoice', 'like', '%' . $invoice . '%')))
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->whereHas('transaction', fn ($trx) => $trx->where('cashier_id', $cashier)))
            ->when($filters['customer_id'] ?? null, fn ($q, $customer) => $q->whereHas('transaction', fn ($trx) => $trx->where('customer_id', $customer)))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereHas('transaction', fn ($trx) => $trx->whereDate('created_at', '>=', $start)))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereHas('transaction', fn ($trx) => $trx->whereDate('created_at', '<=', $end)));
    }
}
