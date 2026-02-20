<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\StudioPage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudioPageController extends Controller
{
    public function index()
    {
        StudioPage::ensureDefaults();

        $studioPages = StudioPage::when(request()->search, function ($query) {
            $query->where('menu_label', 'like', '%' . request()->search . '%')
                ->orWhere('title', 'like', '%' . request()->search . '%');
        })->orderBy('sort_order')->paginate(10)->withQueryString();

        return Inertia::render('Dashboard/StudioPages/Index', [
            'studioPages' => $studioPages,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/StudioPages/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'slug' => ['required', 'alpha_dash', 'max:100', 'unique:studio_pages,slug'],
            'menu_label' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        StudioPage::create($data);

        return to_route('studio-pages.index');
    }

    public function edit(StudioPage $studio_page)
    {
        return Inertia::render('Dashboard/StudioPages/Edit', [
            'studioPage' => $studio_page,
        ]);
    }

    public function update(Request $request, StudioPage $studio_page)
    {
        $data = $request->validate([
            'slug' => ['required', 'alpha_dash', 'max:100', Rule::unique('studio_pages', 'slug')->ignore($studio_page->id)],
            'menu_label' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $studio_page->update($data);

        return to_route('studio-pages.index');
    }

    public function destroy(StudioPage $studio_page)
    {
        $studio_page->delete();

        return to_route('studio-pages.index');
    }
}
