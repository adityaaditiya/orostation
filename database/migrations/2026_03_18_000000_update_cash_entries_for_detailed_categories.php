<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('cash_entries', 'cash_entries_old');

        Schema::create('cash_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cashier_id');
            $table->enum('type', ['in', 'out']);
            $table->string('category');
            $table->string('description');
            $table->bigInteger('amount');
            $table->timestamps();

            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
        });

        DB::table('cash_entries_old')->orderBy('id')->get()->each(function ($entry) {
            DB::table('cash_entries')->insert([
                'id' => $entry->id,
                'cashier_id' => $entry->cashier_id,
                'type' => $entry->category,
                'category' => 'UANG LAIN LAIN',
                'description' => $entry->description,
                'amount' => $entry->amount,
                'created_at' => $entry->created_at,
                'updated_at' => $entry->updated_at,
            ]);
        });

        Schema::drop('cash_entries_old');
    }

    public function down(): void
    {
        Schema::rename('cash_entries', 'cash_entries_new');

        Schema::create('cash_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cashier_id');
            $table->enum('category', ['in', 'out']);
            $table->string('description');
            $table->bigInteger('amount');
            $table->timestamps();

            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
        });

        DB::table('cash_entries_new')->orderBy('id')->get()->each(function ($entry) {
            DB::table('cash_entries')->insert([
                'id' => $entry->id,
                'cashier_id' => $entry->cashier_id,
                'category' => $entry->type,
                'description' => $entry->description,
                'amount' => $entry->amount,
                'created_at' => $entry->created_at,
                'updated_at' => $entry->updated_at,
            ]);
        });

        Schema::drop('cash_entries_new');
    }
};
