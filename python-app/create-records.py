"""
Simple SQLAlchemy + Protobuf Demo
Run: python demo.py
"""

from config import *
from proto import billing_pb2
from models import DatabaseManager
import random

# Initialize database manager
db = DatabaseManager()

# Generate random people
first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis"]

print("🎲 Generating random people...\n")

for i in range(3):
    # Create protobuf message
    person = billing_pb2.Person()
    person.name = f"{random.choice(first_names)} {random.choice(last_names)}"
    person.age = random.randint(20, 60)
    person.email = f"{person.name.lower().replace(' ', '.')}@example.com"
    
    print(f"Created: {person.name}, {person.age}, {person.email}")
    
    # Add to database using DatabaseManager
    db.add_person(person)

print("\n💾 Saved to database!\n")
print("=" * 60)
print("\n📖 Reading from database...\n")

# Get all people using DatabaseManager
all_people = db.get_all_people()

for person_dict in all_people:
    print(f"ID: {person_dict['id']}")
    print(f"  Name:  {person_dict['name']}")
    print(f"  Age:   {person_dict['age']}")
    print(f"  Email: {person_dict['email']}")
    print()

print("=" * 60)
print(f"✅ Success! Stored and retrieved {len(all_people)} people")