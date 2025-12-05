from rest_framework import serializers
from .models import Note, SharedNote
from .utils.extract import extract_text


class NoteSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = ['id', 'title', 'file', 'file_url', 'tags', 'extracted_text', 'created_at']
        read_only_fields = ['extracted_text', 'created_at']

    def create(self, validated_data):
        # Handle tags input (string → list)
        tags = validated_data.get("tags")
        if isinstance(tags, str):
            validated_data["tags"] = [tag.strip() for tag in tags.split(",") if tag.strip()]

        # Create note only ONCE
        instance = super().create(validated_data)

        # Run OCR once safely
        text = extract_text(instance.file)
        instance.extracted_text = text
        instance.save(update_fields=['extracted_text'])

        return instance

    def get_file_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if obj.file else None


class SharedNoteSerializer(serializers.ModelSerializer):
    note = NoteSerializer()

    class Meta:
        model = SharedNote
        fields = ['note', 'shared_at']
