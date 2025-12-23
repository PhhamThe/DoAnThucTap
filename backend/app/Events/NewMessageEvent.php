<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessageEvent implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public $message;
    public $classId;

    public function __construct(Message $message)
    {
        $this->message = $message;
        $this->classId = $message->class_id;
    }

    public function broadcastOn()
    {
        return new Channel('chat.class.' . $this->classId);
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }
}