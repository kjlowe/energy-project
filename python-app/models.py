"""Database models and utilities."""

from config import *
from proto import billing_pb2

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLAlchemy setup
Base = declarative_base()


class BillingDB(Base):
    """SQLAlchemy model for Person data with protobuf conversion."""
    
    __tablename__ = 'persons'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    email = Column(String, nullable=False)
    
    def to_proto(self):
        """Convert SQLAlchemy model to protobuf message."""
        person = billing_pb2.Person()
        person.name = self.name
        person.age = self.age
        person.email = self.email
        return person
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'email': self.email
        }
    
    @staticmethod
    def from_proto(proto_person):
        """Create SQLAlchemy model from protobuf message."""
        return BillingDB(
            name=proto_person.name,
            age=proto_person.age,
            email=proto_person.email
        )
    
    @staticmethod
    def from_dict(data):
        """Create SQLAlchemy model from dictionary."""
        return BillingDB(
            name=data.get('name'),
            age=data.get('age'),
            email=data.get('email')
        )
    
    def __repr__(self):
        return f"<Person(id={self.id}, name='{self.name}', age={self.age})>"


class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self, db_path=None):
        """Initialize database manager.
        
        Args:
            db_path: Path to SQLite database file. Defaults to BILLING_DB from config.
        """
        self.db_path = db_path or BILLING_DB
        self.engine = create_engine(f'sqlite:///{self.db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    def get_session(self):
        """Get a new database session."""
        return self.Session()
    
    def get_all_people(self):
        """Get all people from database as list of dicts."""
        session = self.get_session()
        try:
            people = session.query(BillingDB).all()
            return [person.to_dict() for person in people]
        finally:
            session.close()
    
    def get_person_by_id(self, person_id):
        """Get a specific person by ID.
        
        Args:
            person_id: The person's ID
            
        Returns:
            Dictionary representation of person or None if not found
        """
        session = self.get_session()
        try:
            person = session.query(BillingDB).filter_by(id=person_id).first()
            return person.to_dict() if person else None
        finally:
            session.close()
    
    def add_person(self, person_data):
        """Add a new person to the database.
        
        Args:
            person_data: Dictionary with person data or protobuf Person message
            
        Returns:
            Dictionary representation of created person
        """
        session = self.get_session()
        try:
            if isinstance(person_data, billing_pb2.Person):
                person = BillingDB.from_proto(person_data)
            else:
                person = BillingDB.from_dict(person_data)
            
            session.add(person)
            session.commit()
            session.refresh(person)
            return person.to_dict()
        finally:
            session.close()
    
    def update_person(self, person_id, person_data):
        """Update an existing person.
        
        Args:
            person_id: The person's ID
            person_data: Dictionary with updated data
            
        Returns:
            Dictionary representation of updated person or None if not found
        """
        session = self.get_session()
        try:
            person = session.query(BillingDB).filter_by(id=person_id).first()
            if not person:
                return None
            
            if 'name' in person_data:
                person.name = person_data['name']
            if 'age' in person_data:
                person.age = person_data['age']
            if 'email' in person_data:
                person.email = person_data['email']
            
            session.commit()
            session.refresh(person)
            return person.to_dict()
        finally:
            session.close()
    
    def delete_person(self, person_id):
        """Delete a person from the database.
        
        Args:
            person_id: The person's ID
            
        Returns:
            True if deleted, False if not found
        """
        session = self.get_session()
        try:
            person = session.query(BillingDB).filter_by(id=person_id).first()
            if not person:
                return False
            
            session.delete(person)
            session.commit()
            return True
        finally:
            session.close()
