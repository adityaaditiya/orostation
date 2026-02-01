<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Profit;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesReportController extends Controller
{
    /**
     * Display the sales report.
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

        $baseListQuery = $this->applyFilters(
            Transaction::query()->notCanceled()
                ->with(['cashier:id,name', 'customer:id,name', 'details.product:id,name'])
                ->withSum('details as total_items', 'qty')
                ->withSum('profits as total_profit', 'total'),
            $filters
        )->orderByDesc('created_at');

        $transactions = (clone $baseListQuery)
            ->paginate(10)
            ->withQueryString();

        $aggregateQuery = $this->applyFilters(Transaction::query()->notCanceled(), $filters);

        $totals = (clone $aggregateQuery)
            ->selectRaw('
                COUNT(*) as orders_count,
                COALESCE(SUM(grand_total), 0) as revenue_total,
                COALESCE(SUM(discount), 0) as discount_total
            ')
            ->first();

        $transactionIds = (clone $aggregateQuery)->pluck('id');

        $itemsSold = $transactionIds->isNotEmpty()
            ? TransactionDetail::whereIn('transaction_id', $transactionIds)->sum('qty')
            : 0;

        $profitTotal = $transactionIds->isNotEmpty()
            ? Profit::whereIn('transaction_id', $transactionIds)->sum('total')
            : 0;

        $summary = [
            'orders_count' => (int) ($totals->orders_count ?? 0),
            'revenue_total' => (int) ($totals->revenue_total ?? 0),
            'discount_total' => (int) ($totals->discount_total ?? 0),
            'items_sold' => (int) $itemsSold,
            'profit_total' => (int) $profitTotal,
            'average_order' => ($totals->orders_count ?? 0) > 0
                ? (int) round($totals->revenue_total / $totals->orders_count)
                : 0,
        ];

        return Inertia::render('Dashboard/Reports/Sales', [
            'transactions' => $transactions,
            'summary' => $summary,
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Export sales report to Excel.
     */
    public function export(Request $request)
    {
        $defaultDate = Carbon::today()->toDateString();
        $filters = [
            'start_date' => $request->input('start_date') ?: $defaultDate,
            'end_date' => $request->input('end_date') ?: $defaultDate,
            'invoice' => $request->input('invoice'),
            'cashier_id' => $request->input('cashier_id'),
            'customer_id' => $request->input('customer_id'),
        ];

        $transactions = $this->applyFilters(
            Transaction::query()->notCanceled()
                ->with(['cashier:id,name', 'customer:id,name', 'details.product:id,name'])
                ->withSum('details as total_items', 'qty'),
            $filters
        )->orderByDesc('created_at')->get();

        $headers = ['No', 'Invoice', 'Produk', 'Tanggal', 'Pelanggan', 'Kasir', 'Item', 'Total'];
        $rows = $transactions->values()->map(function ($trx, $index) {
            $productNames = $trx->details
                ->pluck('product.name')
                ->filter()
                ->unique()
                ->implode(', ');

            return [
                $index + 1,
                $trx->invoice,
                $productNames ?: '-',
                $trx->created_at?->format('Y-m-d H:i') ?? '-',
                $trx->customer?->name ?? '-',
                $trx->cashier?->name ?? '-',
                (int) ($trx->total_items ?? 0),
                $this->formatCurrency((int) ($trx->grand_total ?? 0)),
            ];
        })->all();

        return $this->downloadExcel('laporan-penjualan.xls', $headers, $rows);
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

    protected function formatCurrency(int $value): string
    {
        return 'Rp ' . number_format($value, 0, ',', '.');
    }

    protected function downloadExcel(string $filename, array $headers, array $rows)
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            echo '<table border="1"><thead><tr>';
            foreach ($headers as $header) {
                echo '<th>' . e($header) . '</th>';
            }
            echo '</tr></thead><tbody>';
            foreach ($rows as $row) {
                echo '<tr>';
                foreach ($row as $cell) {
                    echo '<td>' . e((string) $cell) . '</td>';
                }
                echo '</tr>';
            }
            echo '</tbody></table>';
        }, $filename, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }
}
