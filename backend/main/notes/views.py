from email.mime import text
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from .utils.rewrite import rewrite_text
from accounts.serializers import User
from .models import Note, NoteVersion
from .utils.summarizer import summarize_text, generate_ai_content
from .utils.extract import extract_text_from_pdf
from .serializers import *
from rest_framework import generics, permissions
from .utils.translation import detect_language, translate_text
from .utils.exporter import create_pdf_from_text
from django.utils import timezone
# Create your views here.


class NoteCreateView(generics.CreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    # backend/main/notes/views.py

    def perform_create(self, serializer):
        # 1. Initial save
        note = serializer.save(user=self.request.user, status='PROCESSING')
        task_type = self.request.data.get('task_type', 'summary')

        # 2. Extract Text (if file exists)
        if note.file:
            try:
                from .utils.extract import extract_text
                # Use the actual field name from your model: 'extracted_text'
                note.extracted_text = extract_text(note.file)
                note.save()
            except Exception as e:
                print(f"Extraction failed: {e}")

        # 3. Call AI summarizing logic
        if note.extracted_text:
            try:
                from .utils.summarizer import generate_ai_content
                # Use the field 'summary' (Ensure you added it to models.py!)
                ai_result = generate_ai_content(note.extracted_text, task_type=task_type)
                note.summary = ai_result 
                note.status = 'COMPLETED'
            except Exception as e:
                note.status = 'FAILED'
                print(f"AI Error: {e}")
        else:
            note.status = 'COMPLETED'
                
        note.save()
            

class NoteListView(generics.ListAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Note.objects.filter(user=user, is_delete=False)

        category = self.request.GET.get("category")
        if category:
            qs = qs.filter(category__iexact=category)

        tag = self.request.GET.get("tag")
        if tag:
            qs = qs.filter(tags__icontains=tag)


        file_type = self.request.GET.get('type')
        if file_type == "pdf":
            qs = qs.filter(file__iendswith=".pdf")
        elif file_type == "image":
            qs = qs.exclude(file__iendswith=".pdf")

        #sorting 
        sort = self.request.GET.get("sort")
        if sort == "newest":
            qs = qs.order_by("created_at")
        else:
            qs = qs.order_by("-created_at")
        return qs
    
class NoteDetailView(generics.RetrieveAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)
    
class NoteSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.GET.get('q', '')
        if not query:
            return Response({"error": "Query parameter 'q' is required"}, status=400)
        notes = Note.objects.filter(
            user = request.user
        ).filter(
            Q(extracted_text__icontains=query) | Q(file__icontains=query) 
        )

        serializer = NoteSerializer(notes, many = True, context={'request': request})
        return Response(serializer.data)
    

class NoteTranslateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # 1. Get target language from query params (?to=hi)
        target_lang = request.GET.get("to", "en").strip()

        try:
            # Good job filtering by request.user for security!
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found or unauthorized"}, status=404)
        
        text = note.extracted_text

        if not text:
            return Response({"error": "No text available to translate"}, status=400)

        # 2. Perform Detection and Translation
        try:
            source_lang = detect_language(text)
            translated = translate_text(text, target_lang)
            
            if not translated:
                return Response({"error": "Translation service returned empty result"}, status=502)

            # 3. Return structured data
            return Response({
                "note_id": pk,
                "source_language": source_lang,
                "target_language": target_lang,
                "original_text": text,
                "translated_text": translated
            })

        except Exception as e:
            # Log the error (e.g., API timeout or Credential issue)
            print(f"Translation Error: {e}") 
            return Response({"error": "Translation service is currently unavailable"}, status=503)
class NoteExportTextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        text = note.extracted_text or ""
        response = HttpResponse(text, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="note_{pk}.txt"'
        return response
    
class NoteExportPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        text = note.extracted_text or ""
        pdf_buffer = create_pdf_from_text(text)

        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="note_{pk}.pdf"'
        return response
    
class NoteSoftDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)
        
        note.is_delete = True
        note.deleted_at = timezone.now()
        note.save()

        return Response({"message":"Note moved to trash"})
    

class NoteTrashListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = Note.objects.filter(user=request.user, is_delete=True)
        serializer = NoteSerializer(notes, many=True, context={"request":request})

        return Response(serializer.data)
    
class NoteRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user, is_delete=True)
        except Note.DoesNotExist:
            return Response({"error": "Note not found in trash"}, status=404)

        note.is_delete = False
        note.deleted_at = None
        note.save()

        return Response({"message": "Note restored successfully"})

class NoteHardDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user, is_delete=True)
        except Note.DoesNotExist:
            return Response({"error": "Note not found in trash"}, status=404)

        note.delete()
        return Response({"message": "Note permanently deleted"})


class NoteSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)
        
        if not note.extracted_text:
            return Response({"error": "No extracted text to summarize"}, status=400)
        
        summary = summarize_text(note.extracted_text)

        return Response({
            "note_id": str(note.id),
            "summary": summary
        })
    
class NoteGenerateShareLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=400)
        
        note.generate_share_token()

        share_url = f"{request.build_absolute_uri('/api/notes/public/')}{note.id}/?token={note.share_token}"

        return Response({
            "message": "Share link generated",
            "share_url": share_url
        })


class PublicNoteView(APIView):
    permission_classes = []  # no auth

    def get(self, request, pk):
        token = request.GET.get("token")

        try:
            note = Note.objects.get(id=pk, is_public=True, share_token=token)
        except Note.DoesNotExist:
            return Response({"error": "Invalid or expired link"}, status=404)

        data = {
            "title": note.title,
            "file_url": request.build_absolute_uri(note.file.url),
            "extracted_text": note.extracted_text,
            "created_at": note.created_at
        }

        return Response(data)


class NoteDisableShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        note.is_public = False
        note.share_token = None
        note.save()

        return Response({"message": "Share link disabled"})


# For share with Private User
class ShareNoteToUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email required"}, status=400)

        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Prevent sharing with yourself
        if target_user == request.user:
            return Response({"error": "You cannot share with yourself"}, status=400)

        # Create share relation
        SharedNote.objects.get_or_create(note=note, shared_with=target_user)

        return Response({"message": f"Note shared with {email}"})

# Remove Access
class UnshareNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        email = request.data.get("email")

        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        SharedNote.objects.filter(note=note, shared_with=target_user).delete()

        return Response({"message": f"Access removed from {email}"})


class NotesSharedWithMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shares = SharedNote.objects.filter(shared_with=request.user)
        serializer = SharedNoteSerializer(shares, many=True, context={"request": request})
        return Response(serializer.data)

class NoteUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self,request,pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error" : "Note not found"}, status=404)
        
        NoteVersion.objects.create(
            note = note,
            title = note.title,
            category = note.category,
            tags = note.tags,
            content = note.extracted_text
        )

        note.title = request.data.get("title", note.title)
        note.category = request.data.get("category", note.category)
        if "tags" in request.data:
            note.tags = [t.strip() for t in request.data["tags"].split(",")]
        if "extracted_text" in request.data:
            note.extracted_text = request.data["extracted_text"]
        note.save()

        return Response({"message": "Note updated and version saved"}) 
    
class NoteVersionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)
        versions = note.versions.all().order_by("created_at")
        data = [
            {
                "version_id": v.id,
                "title":v.title,
                "category":v.category,
                "tags":v.tags,
                "content_preview":v.extracted_text[:200] + "..." if len(v.content) > 200 else v.content,
                "created_at":v.created_at
            }
            for v in versions
        ]
        return Response(data)

class NoteRestoreVersionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, version_id):
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        try:
            version = NoteVersion.objects.get(id=version_id, note=note)
        except NoteVersion.DoesNotExist:
            return Response({"error": "Version not found"}, status=404)

        # Save current state before restoring
        NoteVersion.objects.create(
            note=note,
            title=note.title,
            category=note.category,
            tags=note.tags,
            extracted_text=note.extracted_text
        )

        # Restore
        note.title = version.title
        note.category = version.category
        note.tags = version.tags
        note.extracted_text = version.content # <-- CHANGED FROM version.extracted_text
        note.save()

        return Response({"message": "Version restored successfully"})


class NoteRewriteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        mode = request.GET.get("mode", "improve")  
        try:
            note = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=404)

        if not note.extracted_text:
            return Response({"error": "No text available to rewrite"}, status=400)

        result = rewrite_text(note.extracted_text, mode)

        return Response({
            "note_id": str(note.id),
            "mode": mode,
            "rewritten_text": result
        })
