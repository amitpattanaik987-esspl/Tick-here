<?php

namespace App\Http\Controllers;

use App\Models\venue;
use App\Services\SeatGenerator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class VenueController extends Controller
{
    //get all the venues (admin)
    public function index(Request $request)
    {
        $search = $request->get('search');

        $venues = Venue::with(['location', 'seats'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('venue_name', 'like', "%{$search}%")
                        ->orWhereHas('location', function ($q) use ($search) {
                            $q->where('city', 'like', "%{$search}%");
                        })
                        ->orWhere('max_seats', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhereHas('seats', function ($q) use ($search) {
                            $q->where('price', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('id', 'asc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => "venue fetched",
            'data' => $venues
        ]);
    }


    //create a venue (admin)
    public function create()
    {
        try {
            $data = request()->validate([
                "venue_name" => "required",
                "location_id" => ['required', Rule::exists('locations', 'id')],
                "max_seats" => "required|min:2",
                "price" => "required",
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 404);
        }

        $res = Venue::create([
            "venue_name" => $data['venue_name'],
            "location_id" => $data['location_id'],
            "max_seats" => $data['max_seats']
        ]);

        // Auto-generate seats
        SeatGenerator::generateSeats($res->id, $res->max_seats, $data['price']);

        if ($res) {
            return response()->json([
                'success' => true,
                'message' => "Venue and seats Created"
            ], 200);
        } else {
            return response()->json([
                'success' => false,
                'message' => "Internal Server Error"
            ], 404);
        }
    }

    //delete a venue (admin)
    public function delete(Venue $venue)
    {
        $res = $venue->delete();

        if ($res) {
            return response()->json([
                'success' => true,
                'message' => 'Venue deleted'
            ], 204);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error'
            ], 404);
        }
    }

    //update a venue (admin)
    public function update(Request $request, Venue $venue)
    {
        $validated = $request->validate([
            "venue_name" => "required|string",
            "location_id" => ['required', 'integer', Rule::exists('locations', 'id')],
            "max_seats" => "required|integer|min:2",
            "price" => "required|numeric",
        ]);

        $originalMaxSeats = $venue->max_seats;

        // Update basic venue info
        $venue->update([
            "venue_name" => $validated['venue_name'],
            "location_id" => $validated['location_id'],
            "max_seats" => $validated['max_seats'],
        ]);

        if ($validated['max_seats'] != $originalMaxSeats) {
            // CASE 1: max_seats changed → delete & regenerate seats
            $venue->seats()->delete();
            SeatGenerator::generateSeats($venue->id, $validated['max_seats'], $validated['price']);
        } else {
            // CASE 2: only price changed → update all existing seat prices
            $venue->seats()->update(['price' => $validated['price']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Venue updated successfully.',
            'data' => [
                'venue' => $venue,
                'price' => $validated['price']
            ]
        ], 200);
    }


    public function seats($id)
    {
        $venue = Venue::with('seats')->findOrFail($id);
        return response()->json([
            'success' => true,
            'seats' => $venue->seats,
        ]);
    }
}
