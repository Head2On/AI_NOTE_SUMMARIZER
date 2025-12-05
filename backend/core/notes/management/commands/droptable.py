from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Drops the notes_note table'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            try:
                cursor.execute("DROP TABLE notes_note CASCADE")
                self.stdout.write(self.style.SUCCESS('Successfully dropped the "notes_note" table.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error dropping "notes_note" table: {e}'))
