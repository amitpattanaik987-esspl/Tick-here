<?php

namespace Database\Seeders;

use App\Models\EventVenue;
use App\Models\Ticket;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TicketSeeder extends Seeder
{
    public function run()
    {
        $users = User::pluck('id')->toArray();

        $oneMonthFromNow = Carbon::now()->addMonth();

        // Only load event_venues happening within 1 month
        $eventVenues = EventVenue::with('venue.seats')
            ->where('start_datetime', '<=', $oneMonthFromNow)
            ->get();

        $ticketCount = 0;

        foreach ($eventVenues as $eventVenue) {
            $venue = $eventVenue->venue;
            $seats = $venue->seats()->where('is_booked', false)->get();

            if ($seats->count() < 1)
                continue;

            $numTickets = rand(2, 4);

            for ($i = 0; $i < $numTickets; $i++) {
                $userId = Arr::random($users);

                $seatsToBook = $seats->splice(0, rand(1, 3));
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
