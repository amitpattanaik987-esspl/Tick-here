<?php

namespace Database\Seeders;

use App\Models\EventVenue;
use App\Models\Seat;
use App\Models\Ticket;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {

        $users = User::pluck('id')->toArray();

        $eventVenues = EventVenue::with('venue.seats')->get();

        $ticketCount = 0;

        // Loop through each event venue to book ticket for it
        foreach ($eventVenues as $eventVenue) {
            $venue = $eventVenue->venue;
            $seats = $venue->seats()->where('is_booked', false)->get();

            if ($seats->count() < 1)
                continue; // Need minimum seats to book

            $numTickets = rand(2, 4); // Book 2–4 tickets per venue

            for ($i = 0; $i < $numTickets; $i++) {
                $userId = Arr::random($users);

                $seatsToBook = $seats->splice(0, rand(1, 3)); // Book 1–3 seats per ticket
                if ($seatsToBook->isEmpty())
                    break;

                $totalPrice = $seatsToBook->sum('price');

                DB::beginTransaction();

                try {
                    $ticket = Ticket::create([
                        'user_id' => $userId,
                        'event_venue_id' => $eventVenue->id,
                        'ticket_code' => Str::upper(Str::random(10)),
                        'total_price' => $totalPrice,
                        'status' => 'booked',
                    ]);

                    foreach ($seatsToBook as $seat) {
                        TicketSeat::create([
                            'ticket_id' => $ticket->id,
                            'seat_id' => $seat->id,
                        ]);

                        $seat->update(['is_booked' => true]);
                    }

                    DB::commit();
                    $ticketCount++;
                } catch (\Throwable $e) {
                    DB::rollBack();
                    Log::error('TicketSeeder error', ['message' => $e->getMessage()]);
                }
            }
        }

        echo "Seeded $ticketCount tickets.\n";
    }
}

