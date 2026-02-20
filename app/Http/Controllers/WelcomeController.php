<?php

namespace App\Http\Controllers;

use App\Models\StudioPage;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function __invoke()
    {
        StudioPage::ensureDefaults();

        $sections = StudioPage::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'menu_label', 'title', 'content']);

        return Inertia::render('Welcome', [
            'sections' => $sections,
        ]);
    }
}
