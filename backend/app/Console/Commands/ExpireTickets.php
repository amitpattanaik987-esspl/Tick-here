<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EventVenue;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ExpireTickets extends Command
{
    protected $signature = 'tickets:expire';
    protected $description = 'Mark tickets as expired for past events and release seats';

    public function handle()
    {
        $now = Carbon::now();

        $expiredVenues = EventVenue::where('start_datetime', '<', $now)->pluck('id');

        $tickets = Ticket::whereIn('event_venue_id', $expiredVenues)
            ->where('status', 'booked')
            ->get();

        foreach ($tickets as $ticket) {
            DB::transaction(function () use ($ticket) {
                $ticket->status = 'expired';
                $ticket->save();

                // Free the seats
                foreach ($ticket->ticketSeats as $ticketSeat) {
                    $seat = $ticketSeat->seat;
                    if ($seat) {
                        $seat->is_booked = 0;
                        $seat->save();
                    }
                }
            });
        }

        $this->info('Expired tickets updated and seats released.');
    }
}
