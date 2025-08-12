<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SearchingService
{
    //linear search for events
    public static function linearSearch($collection, string $search)
    {

        Log::info("Linear search");

        return $collection->filter(function ($event) use ($search) {
            return Str::contains(strtolower($event->title), $search) ||
                Str::contains(strtolower($event->id), $search) ||
                Str::contains(strtolower($event->duration), $search) ||
                Str::contains(strtolower($event->description), $search) ||
                Str::contains(strtolower(optional($event->category)->name), $search) ||
                Str::contains(strtolower(optional($event->admin)->name), $search);
        });
    }

    //binary search for events
    public static function binarySearch($collection, string $search, string $key)
    {
        $items = $collection->sortBy($key)->values();
        $low = 0;
        $high = $items->count() - 1;
        $results = collect();

        while ($low <= $high) {
            $mid = (int) (($low + $high) / 2);
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
}
