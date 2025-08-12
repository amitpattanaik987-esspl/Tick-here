<?php

namespace App\Services;

use App\Jobs\SendNewEventNewsletter;
use App\Models\Event;
use App\Models\User;

class DispatchEmailJobService
{
    public static function push(Event $event)
    {
        User::where('is_subscribed', true)
            ->select('id')
            ->chunk(5, function ($users) use ($event) {
                $userIds = $users->pluck('id')->toArray();
                SendNewEventNewsletter::dispatch($event, $userIds);
            });
    }
}
