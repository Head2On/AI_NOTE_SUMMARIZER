documents = {}
save_timers = {}
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asyncio import create_task, sleep
from notes.models import Note
from channels.db import database_sync_to_async

class NoteEditorConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.note_id = self.scope['url_route']['kwargs']['note_id']
        self.room_name = f"note_{self.note_id}"

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        

        if data.get("cursor"):
            data["user"] = str(self.scope["user"].email)

        doc = documents.get(self.note_id, "")

        if data["action"] == "insert":
            doc = doc[:data["index"]] + data["value"] + doc[data["index"]:]
        
        elif data["action"] == "delete":
            doc = doc[:data["start"]] + doc[data["end"]:]
        
        elif data["action"] == "replace":
            doc = doc[:data["start"]] + data["value"] + doc[data["end"]:]

        documents[self.note_id] = doc
        if self.note_id in save_timers:
            save_timers[self.note_id].cancel()

        save_timers[self.note_id] = create_task(self.save_after_pause())


        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "editor_message",
                "data": data
            }
        )

        await self.channel_layer.group_send(
        self.room,
        {
            "type": "sync_typing",
            "payload": data
        }
    )
        
        await self.channel_layer.group_send(
        self.room,
        {
            "type": "apply_patch",
            "patch": data
        }
    )

    async def editor_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def sync_typing(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def apply_patch(self, event):
        await self.send(text_data=json.dumps(event["patch"]))

    async def save_after_pause(self):
        await sleep(2)  # wait 2 seconds with no new typing

        text = documents.get(self.note_id)
        if text is None:
            return

        # Save to DB
        note = await database_sync_to_async(Note.objects.get)(id=self.note_id)
        note.extracted_text = text
        await database_sync_to_async(note.save)()

        print(f"[autosave] note {self.note_id} saved ✔")  # debug log

