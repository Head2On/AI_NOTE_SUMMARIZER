from django.urls import path 
from .views import *

urlpatterns = [
    path('upload/', NoteCreateView.as_view(), name='note-upload'),
    path('', NoteListView.as_view(), name='note-list'),
    path('<uuid:pk>/', NoteDetailView.as_view(), name='note-detail'),
    path('<uuid:pk>/share/', NoteGenerateShareLinkView.as_view(), name='note-generate-share'),
    path('<uuid:pk>/share/disable/', NoteDisableShareView.as_view(), name="note-disable-share"),
    path('public/<uuid:pk>/', PublicNoteView.as_view(), name="public-note"),
    path('search/', NoteSearchView.as_view(), name='note-search'),
    path('<uuid:pk>/versions/', NoteVersionListView.as_view(), name='note-version-list'),
    path('<uuid:pk>/rewrite/', NoteRewriteView.as_view(), name='note-rewrite'),
    path('<uuid:pk>/versions/restore/<int:version_id>/', NoteRestoreVersionView.as_view(), name='note-restore-version'),
    path('<uuid:pk>/update/', NoteUpdateView.as_view(), name='note-update'),
    path('<uuid:pk>/summary/', NoteSummaryView.as_view(), name='note-summary'),
    path('<uuid:pk>/translate/', NoteTranslateView.as_view(), name='note-translate'),
    path('<uuid:pk>/export/txt/',NoteExportTextView.as_view(), name='note-exporter-txt'),
    path('<uuid:pk>/export/pdf/',NoteExportPdfView.as_view(), name='note-exporter-pdf'),
    path('<uuid:pk>/delete/', NoteSoftDeleteView.as_view(), name='note-soft-delete'),
    path('trash/', NoteTrashListView.as_view(), name='note-trash-list'),
    path('<uuid:pk>/restore/', NoteRestoreView.as_view(), name='note-restore'),
    path('<uuid:pk>/delete/permanent/', NoteHardDeleteView.as_view(), name='note-hard-delete'),
    path('<uuid:pk>/share-to/', ShareNoteToUserView.as_view(), name="share-note"),
    path('<uuid:pk>/unshare/', UnshareNoteView.as_view(), name="unshare-note"),
    path('share-with-me/', NotesSharedWithMeView.as_view(), name="shared-with-me"),
]
