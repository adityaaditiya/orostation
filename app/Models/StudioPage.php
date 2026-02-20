<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioPage extends Model
{
    protected $fillable = [
        'slug',
        'menu_label',
        'title',
        'content',
        'sort_order',
        'is_active',
    ];

    public const DEFAULT_PAGES = [
        ['slug' => 'home', 'menu_label' => 'Home', 'title' => 'Welcome to Our Pilates Studio', 'content' => 'Build strength, flexibility, and focus with professional pilates classes for all levels.', 'sort_order' => 1],
        ['slug' => 'about', 'menu_label' => 'About', 'title' => 'About Our Studio', 'content' => 'We are passionate about helping members move better and feel better every day.', 'sort_order' => 2],
        ['slug' => 'classes', 'menu_label' => 'Classes', 'title' => 'Classes', 'content' => 'Explore mat pilates, reformer sessions, private coaching, and group programs.', 'sort_order' => 3],
        ['slug' => 'schedule', 'menu_label' => 'Schedule', 'title' => 'Class Schedule', 'content' => 'Morning and evening slots are available throughout the week.', 'sort_order' => 4],
        ['slug' => 'pricing', 'menu_label' => 'Pricing', 'title' => 'Membership Pricing', 'content' => 'Choose a package that suits your goals with flexible monthly plans.', 'sort_order' => 5],
        ['slug' => 'trainers', 'menu_label' => 'Trainers', 'title' => 'Meet Our Trainers', 'content' => 'Certified instructors ready to guide your journey safely and effectively.', 'sort_order' => 6],
        ['slug' => 'testimonials', 'menu_label' => 'Testimonials', 'title' => 'What Members Say', 'content' => 'Real stories from members who transformed their posture and confidence.', 'sort_order' => 7],
        ['slug' => 'contact', 'menu_label' => 'Contact', 'title' => 'Contact Us', 'content' => 'Reach out via phone, WhatsApp, or visit our studio for a free consultation.', 'sort_order' => 8],
    ];

    public static function ensureDefaults(): void
    {
        foreach (self::DEFAULT_PAGES as $page) {
            self::firstOrCreate(
                ['slug' => $page['slug']],
                [
                    'menu_label' => $page['menu_label'],
                    'title' => $page['title'],
                    'content' => $page['content'],
                    'sort_order' => $page['sort_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
