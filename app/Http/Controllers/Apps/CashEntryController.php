<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\CashEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CashEntryController extends Controller
{
    public function index(string $type)
    {
        abort_unless(in_array($type, CashEntry::TYPES, true), 404);

        return Inertia::render('Dashboard/Transactions/CashEntry', [
            'entryType' => $type,
            'categoryOptions' => CashEntry::CATEGORY_OPTIONS,
        ]);
    }

    public function store(Request $request, string $type)
    {
        abort_unless(in_array($type, CashEntry::TYPES, true), 404);

        $validated = $request->validate([
            'category' => ['required', Rule::in(CashEntry::CATEGORY_OPTIONS)],
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
        ]);

        CashEntry::create([
            'cashier_id' => $request->user()->id,
            'type' => $type,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => (int) $validated['amount'],
        ]);

        return to_route('transactions.cash.index', ['type' => $type]);
    }
}
