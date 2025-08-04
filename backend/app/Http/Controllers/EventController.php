<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventVenue;
use App\Models\Location;
use App\Models\Venue;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;


class EventController extends Controller
{

    //get all the events with sorting(admin)
    public function index(Request $request)
    {
        $sortKey = $request->get('sort_by');
        $sortOrder = $request->get('sort_order', 'desc');
        $search = $request->get('search');

        $sortMap = [
            'sl' => 'id',
            'title' => 'title',
            'admin' => 'created_by',
            'duration' => 'duration',
        ];

        $sortBy = $sortMap[$sortKey] ?? 'id';

        $statusFilter = null;
        if (in_array(strtolower($search), ['completed', 'active', 'inactive', 'cancelled'])) {
            $statusFilter = strtolower($search);
            $search = null;
        }

        $query = Event::with(['category', 'admin', 'eventVenue']);

        if ($statusFilter) {
            $query->withComputedStatus($statusFilter);
        }

        if ($search) {
            $firstChar = substr($search, 0, 1);
            $query->where(function ($q) use ($firstChar) {
                $q->where('title', 'like', "%{$firstChar}%")
                    ->orWhere('description', 'like', "%{$firstChar}%");
            });
        }

        $events = $query->orderBy($sortBy, $sortOrder)->get();

        if ($search) {
            if (in_array($sortKey, ['title', 'admin'])) {
                $events = $this->binarySearch($events, strtolower($search), $sortBy);
            } else {
                $events = $this->linearSearch($events, strtolower($search));
            }
        }

        $page = (int) $request->get('page', 1);
        $perPage = 10;
        $offset = ($page - 1) * $perPage;

        $paginated = new LengthAwarePaginator(
            $events->slice($offset, $perPage)->values(),
            $events->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json([
            'success' => true,
            'payload' => $paginated,
        ]);
    }

    //linear search for events
    private function linearSearch($collection, string $search)
    {

        Log::info("Linear search");

        return $collection->filter(function ($event) use ($search) {
            return Str::contains(strtolower($event->title), $search) ||
                Str::contains(strtolower($event->description), $search);
        });
    }

    //binary search for events
    private function binarySearch($collection, string $search, string $key)
    {
        $items = $collection->sortBy($key)->values();
        $low = 0;
        $high = $items->count() - 1;
        $results = collect();

        while ($low <= $high) {
            $mid = (int)(($low + $high) / 2);
            $value = strtolower(data_get($items[$mid], $key, ''));

            if (Str::contains($value, $search)) {
                // Search left side
                $left = $mid;
                while ($left >= 0 && Str::contains(strtolower(data_get($items[$left], $key)), $search)) {
                    $results->push($items[$left]);
                    $left--;
                }

                // Search right side
                $right = $mid + 1;
                while ($right < $items->count() && Str::contains(strtolower(data_get($items[$right], $key)), $search)) {
                    $results->push($items[$right]);
                    $right++;
                }

                break;
            } elseif ($value < $search) {
                $low = $mid + 1;
            } else {
                $high = $mid - 1;
            }
        }

        return $results->unique('id')->values();
    }


    public function getEvent(Event $event)
    {
        $event = Event::with([
            'category',
            'admin',
            'eventVenue.venue.location',
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

        $data['thumbnail'] = request()->file('thumbnail')->store('thumbnails', 'public');

        $event = Event::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'thumbnail' => $data['thumbnail'],
            'duration' => $data['duration'],
            'category_id' => $data['category_id'],
            'admin_id' => auth('admin')->id(),
        ]);

        foreach ($data['venues'] as $venue) {
            $date = Carbon::parse($venue['start_datetime'])->toDateString();

            $isBooked = EventVenue::where('venue_id', $venue['venue_id'])
                ->whereDate('start_datetime', $date)
                ->exists();

            if ($isBooked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Venue ID ' . $venue['venue_id'] . ' is already booked on ' . $date,
                ], 422);
            }

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
            ])->where('start_datetime', '>=', now())
            ->orderBy('start_datetime', 'asc')
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
