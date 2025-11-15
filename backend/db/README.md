# Database Module

Repository pattern structure for Spectra database operations.

## Structure

```
db/
├── __init__.py       # Main Database class (use this!)
├── base.py           # Shared connection logic
├── media.py          # MediaRepository for media_items table
├── schema.sql        # Database schema
└── README.md         # This file
```

## Usage

### Basic Usage

```python
from db import Database

# Create database instance
db = Database()

# Create tables (first time only)
db.create_tables()

# Insert a media item
item = {
    'id': 'movie_001',
    'title': 'Inception',
    'media_type': 'movie',
    'year': 2010,
    'description': 'A thief who steals secrets...',
    'metadata': {'director': 'Christopher Nolan'},
    'embedding': np.random.rand(384),
    'taste_vector': np.array([0.5, 0.6, 0.8, ...])  # 8D
}
db.media.insert_item(item)

# Search by taste vector
results = db.media.search_by_taste(
    taste_vector=user_taste_vector,
    media_type='movie',
    limit=10
)

# Close when done
db.close()
```

### With Context Manager (Recommended)

```python
from db import Database

with Database() as db:
    db.media.insert_item(item)
    results = db.media.search_by_taste(taste_vector)
# Automatically closes connection
```

## Available Operations

### Media Repository (`db.media`)

- `insert_item(item)` - Insert single media item
- `batch_insert(items)` - Insert multiple items
- `search_by_taste(taste_vector, media_type, limit)` - Find similar items
- `get_item_by_id(item_id)` - Get specific item
- `get_all_by_type(media_type, limit)` - Get all items of a type
- `count_items(media_type)` - Count total items

## Configuration

Set database URL via environment variable:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
```

Or pass directly:

```python
db = Database("postgresql://user:pass@localhost:5432/dbname")
```

## Future Expansion

When adding users/profiles, create new repository files:

```
db/
├── users.py          # UserRepository (future)
├── profiles.py       # ProfileRepository (future)
└── ...
```

Then add to `__init__.py`:

```python
class Database:
    def __init__(self, connection_string=None):
        self.connection = DatabaseConnection(connection_string)
        self.media = MediaRepository(self.connection)
        self.users = UserRepository(self.connection)      # Add this
        self.profiles = ProfileRepository(self.connection) # Add this
```

Usage becomes:

```python
with Database() as db:
    db.media.insert_item(item)
    db.users.create_user(username, email)
    db.profiles.save_taste_profile(user_id, taste_vector)
```

## Testing

Run the test script:

```bash
# Make sure PostgreSQL is running
docker-compose up -d

# Run tests
python test_db.py
```

