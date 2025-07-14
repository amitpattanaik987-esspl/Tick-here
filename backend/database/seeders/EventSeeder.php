<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventVenue;
use App\Models\Location;
use App\Models\Venue;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */

    public function run()
    {
        $admins = Admin::all();
        $categories = EventCategory::all();
        $locations = Location::all();
        $venues = Venue::all();

        $faker = Faker::create();
        $eventCount = 0;
        $maxEvents = 104; // for testing purpose now

        foreach ($locations as $location) {
            $locationVenues = $venues->where('location_id', $location->id)->take(rand(2, 4)); // select 2 to 4 venues per location

            foreach ($locationVenues as $venue) {
                $numEvents = rand(2, 4); // select 2 to 4 events per venue

                for ($i = 0; $i < $numEvents; $i++) {
                    if ($eventCount >= $maxEvents)
                        break 3; // break out of all 3 loops if 104 events details are already ready to create

                    $category = $categories->random(); // select a random category
                    $admin = $admins->random(); // select a random admin

                    // creates all the random details for an event (testing purpose)
                    $title = match (strtolower($category->name)) {
                        'comedy' => $faker->sentence(3) . ' Comedy Night',
                        'kids' => 'Fun for Kids: ' . $faker->words(2, true),
                        'music' => $faker->name . ' Live in Concert',
                        'workshops' => 'Workshop: ' . ucfirst($faker->words(3, true)),
                        'performance' => 'Stage Performance: ' . ucfirst($faker->word),
                        'sports' => ucfirst($faker->word) . ' Championship',
                        default => 'Special Event: ' . ucfirst($faker->words(2, true)),
                    };

                    $description = match ($category->name) {
                        'Comedy' => "Laugh your heart out at {$venue->venue_name}.",
                        'Kids' => "A joyful event for children at {$venue->venue_name}.",
                        'Music' => "Join the rhythm in {$location->city}.",
                        'Workshops' => "Sharpen your skills in our expert-led workshop.",
                        'Performance' => "Experience the best performances in {$location->city}.",
                        'Sports' => "Cheer for your favorite team at {$venue->venue_name}.",
                        default => "Don’t miss this event at {$venue->venue_name}!",
                    };

                    $duration = Carbon::createFromTime(rand(1, 3), rand(0, 59))->format('H:i:s');

                    $thumbnail = 'thumbnails/' . Str::slug($category->name) . '.jpg';

                    $event = Event::create([
                        'title' => $title,
                        'description' => $description,
                        'thumbnail' => $thumbnail,
                        'duration' => $duration,
                        'category_id' => $category->id,
                        'admin_id' => $admin->id,
                    ]);

                    EventVenue::create([
                        'event_id' => $event->id,
                        'location_id' => $location->id,
                        'venue_id' => $venue->id,
                        'start_datetime' => Carbon::now()->addDays(rand(1, 60))->addHours(rand(1, 12)),
                    ]);

                    $eventCount++;
                }
            }
        }

        echo "Seeded $eventCount events.\n";
    }
}
