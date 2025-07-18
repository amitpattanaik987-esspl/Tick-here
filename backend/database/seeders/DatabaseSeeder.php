<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Create dummy users first
        User::factory(20)->create();

        $this->call([
            LocationSeeder::class,
            VenueSeeder::class,
            EventCategorySeeder::class,
            EventSeeder::class,
            TicketSeeder::class
        ]);
    }
}
