<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventVenue extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'venue_id',
        'start_datetime',
        'location_id',
    ];


    protected $with = ['venue'];

    //this gives all the venue details from the venue table by the venue_id key
    public function venue()
    {
        return $this->belongsTo(Venue::class, );
    }

    //this gives all the location details from the location table by the location_id key
    public function location()
    {

        return $this->belongsTo(Location::class, );
    }
    public function event()
    {
        return $this->belongsTo(Event::class, );
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
