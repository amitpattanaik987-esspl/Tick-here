<?php

namespace App\Jobs;

use App\Mail\SubscriptionMail;
use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendNewEventNewsletter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $event;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(Event $event)
    {
        $this->event = $event;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void
    {
        User::where('is_subscribed', true)
            ->chunk(50, function ($users) {
                foreach ($users as $user) {
                    Mail::to($user->email)->queue(
                        new SubscriptionMail($this->event, $user)
                    );
                }
            });
    }
}
