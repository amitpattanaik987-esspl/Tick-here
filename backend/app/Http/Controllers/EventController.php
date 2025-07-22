<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventVenue;
use App\Models\Location;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{

    //get all the events with sorting(admin)
    public function index(Request $request)
    {
        $sortBy = $request->get('sort_by', 'id'); // default to 'id'
        $sortOrder = $request->get('sort_order', 'desc');
        $search = $request->get('search');

        $statusFilter = null;
        if (in_array(strtolower($search), ['completed', 'active', 'inactive', 'cancelled'])) {
            $statusFilter = strtolower($search);
            $search = null;
        }

        $validSorts = ['id', 'title', 'created_by', 'duration']; // whitelist columns

        if (!in_array($sortBy, $validSorts)) {
            $sortBy = 'id';
        }

        Log::info('Search term: ' . $search);
        Log::info('Status filter: ' . ($statusFilter ?? 'none'));


        $events = Event::with(['category', 'admin', 'eventVenue'])->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")->orWhere('duration', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('admin', function ($q3) use ($search) {
                        $q3->where('name', 'like', "%{$search}%");
                    });
            });
        })->when($statusFilter, function ($query, $statusFilter) {
            $query->withComputedStatus($statusFilter);
        })
            ->orderBy($sortBy, $sortOrder)
            ->paginate(10);

        return response()->json([
            'success' => true,
            'payload' => $events,
        ]);
    }

    //get an event
    public function getEvent(Event $event)
    {
        $event = Event::with([
            'category',
            'admin',
            'eventVenue.venue.location',
            // Eager load ticket count per venue
            'eventVenue' => function ($query) {
                $query->withCount('tickets as tickets_booked');
            }
        ])->find($event->id);

        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $event
        ]);
    }

    //Creates an event with multiple venues(admin)
    public function create()
    {
        // Validate request
        try {
            $data = request()->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string|min:10',
                'thumbnail' => 'required|image',
                'duration' => 'required',
                'category_id' => 'required|integer|exists:event_categories,id',
                'venues' => 'required|array',
                'venues.*.location_id' => 'required_with:venues|exists:locations,id',
                'venues.*.venue_id' => 'required_with:venues|exists:venues,id',
                'venues.*.start_datetime' => 'required_with:venues|date',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        // Upload and store image
        $data['thumbnail'] = request()->file('thumbnail')->store('thumbnails', 'public');

        // Create event
        $event = Event::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'thumbnail' => $data['thumbnail'],
            'duration' => $data['duration'],
            'category_id' => $data['category_id'],
            'admin_id' => auth('admin')->id(),
        ]);

        // Loop through each venue entry and insert into DB
        foreach ($data['venues'] as $venue) {
            EventVenue::create([
                'event_id' => $event->id,
                'venue_id' => $venue['venue_id'],
                'location_id' => $venue['location_id'],
                'start_datetime' => $venue['start_datetime'] . ':00',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully.',
        ], 201);
    }

    //deletes an Event (admin)
    public function delete(Event $event)
    {
        $res = $event->delete();

        if ($res) {
            return response()->json([
                'success' => true,
                'message' => 'Event deleted'
            ], 204);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error'
            ], 404);
        }
    }

    // cancel an event (unlink from event_venue || delete row from event_venue table not event table)
    public function cancel(Event $event)
    {
        // Ensure only Active or Inactive events are cancellable
        $hasVenues = $event->eventVenue()->exists();
        if (!$hasVenues) {
            return response()->json([
                'success' => false,
                'message' => 'Event already cancelled or has no venues.'
            ], 400);
        }

        $event->eventVenue()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event cancelled successfully.'
        ]);
    }

    //update an event (admin)
    public function update(Request $request, Event $event)
    {
        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found.'
            ], 404);
        }

        Log::info($request->all());

        // Determine edit mode
        $editMode = $request->input('__edit_mode', 'full');

        // Base validation for both modes
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'duration' => 'required|regex:/^\d{1,2}:\d{1,2}:\d{1,2}$/',
            'category_id' => ['required', 'integer', Rule::exists('event_categories', 'id')],
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png',
        ];

        // Add venue validation only if full mode
        if ($editMode === 'full') {
            $rules['venues'] = 'required|array|min:1';
            $rules['venues.*.location_id'] = 'required_with:venues|exists:locations,id';
            $rules['venues.*.venue_id'] = 'required_with:venues|exists:venues,id';
            $rules['venues.*.start_datetime'] = 'required_with:venues|date';
        }

        $validated = $request->validate($rules);

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail && Storage::disk('public')->exists($event->thumbnail)) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $validated['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        // Update event main data
        $event->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'duration' => $validated['duration'],
            'thumbnail' => $validated['thumbnail'] ?? $event->thumbnail,
            'category_id' => $validated['category_id'],
        ]);

        // Only update venues if full mode
        if ($editMode === 'full' && isset($validated['venues'])) {
            // Remove old venues
            EventVenue::where('event_id', $event->id)->delete();

            foreach ($validated['venues'] as $venue) {
                EventVenue::create([
                    'event_id' => $event->id,
                    'location_id' => $venue['location_id'],
                    'venue_id' => $venue['venue_id'],
                    'start_datetime' => $venue['start_datetime'],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully.',
            'data' => $event->load(['eventVenue.venue.location'])
        ]);
    }

    // get events by a particular location
    public function getEventsByLocation(Location $location)
    {
        // Step 1: Get all event_venue IDs for the location
        $eventVenues = $location->eventVenues()
            ->with([
                'event:id,title,thumbnail,duration,category_id',
                'event.category:id,name',
                'venue:id,venue_name',
            ])
            ->get();

        $events = [];

        foreach ($eventVenues as $ev) {
            $event = $ev->event;

            // Step 2: Query minimum seat price only (instead of loading all seats into memory)
            $seatPrice = DB::table('seats')
                ->where('venue_id', $ev->venue->id)
                ->value('price');

            $events[] = [
                'id' => $event->id,
                'title' => $event->title,
                'thumbnail' => $event->thumbnail,
                'duration' => $event->duration,
                'category' => $event->category->name ?? null,
                'start_datetime' => $ev->start_datetime,
                'lowest_price' => $seatPrice,
            ];
        }

        return response()->json(['data' => $events]);
    }
}
