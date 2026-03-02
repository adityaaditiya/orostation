<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Trainer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainerController extends Controller
{
    public function index()
    {
        $trainers = Trainer::when(request()->search, function ($query) {
            $query->where('name', 'like', '%' . request()->search . '%')
                ->orWhere('biodata', 'like', '%' . request()->search . '%');
        })->latest()->paginate(6);

        return Inertia::render('Dashboard/Trainers/Index', [
            'trainers' => $trainers,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Trainers/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'no_telp' => 'required|string|max:50|unique:trainers,no_telp',
            'biodata' => 'required|string',
        ]);

        Trainer::create($request->only(['name', 'no_telp', 'biodata']));

        return to_route('trainers.index');
    }

    public function edit(Trainer $trainer)
    {
        return Inertia::render('Dashboard/Trainers/Edit', [
            'trainer' => $trainer,
        ]);
    }

    public function update(Request $request, Trainer $trainer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'no_telp' => 'required|string|max:50|unique:trainers,no_telp,' . $trainer->id,
            'biodata' => 'required|string',
        ]);

        $trainer->update($request->only(['name', 'no_telp', 'biodata']));

        return to_route('trainers.index');
    }

    public function destroy(Trainer $trainer)
    {
        $trainer->delete();

        return back();
    }
}
