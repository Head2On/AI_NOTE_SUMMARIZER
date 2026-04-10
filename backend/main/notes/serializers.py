# backend/main/notes/serializers.py
from rest_framework import serializers
from .models import Note, SharedNote

class NoteSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Note
        # ADDED 'summary' and 'content' so Next.js can receive the AI data!
        fields = ['id', 'title', 'file', 'file_url', 'tags', 'extracted_text', 'summary', 'created_at', 'file_origin']
        read_only_fields = ['extracted_text', 'summary', 'content', 'created_at']

    def create(self, validated_data):
        # Handle tags input (string → list) safely
        tags = validated_data.get("tags", [])
        if isinstance(tags, str):
            validated_data["tags"] = [tag.strip() for tag in tags.split(",") if tag.strip()]

        # Create note only ONCE
        instance = super().create(validated_data)

        # 🚨 REMOVED the OCR extraction from here! 
        # Your views.py is already handling it. Doing it here without a file check caused the 500 crash.

        return instance

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None

class SharedNoteSerializer(serializers.ModelSerializer):
    note = NoteSerializer()

    class Meta:
        model = SharedNote
        fields = ['note', 'shared_at']