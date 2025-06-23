<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    use HasFactory;

    protected $fillable = ['venue_name', 'location_id', 'available_seats'];

    public function eventVenues()
    {
        return $this->hasMany(EventVenue::class);
    }
    
  // for getting price of a seat for an event (/events/locations/{location})

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }
    protected static function booted()
    {
        static::created(function ($venue) {
            $totalSeats = $venue->available_seats;
            $seatsPerRow = 10;
            $seatCount = 0;
            $rowIndex = 0;

            while ($seatCount < $totalSeats) {
                $rowLabel = chr(65 + $rowIndex);

                for ($seatNo = 1; $seatNo <= $seatsPerRow && $seatCount < $totalSeats; $seatNo++) {
                    Seat::create([
                        'venue_id' => $venue->id,
                        'seat_no' => $rowLabel . $seatNo,
                        'label' => $rowLabel,
                        'price' => 150,
                        'is_booked' => false,
                    ]);

                    $seatCount++;
                }

                $rowIndex++;
            }
        });
    }
}
