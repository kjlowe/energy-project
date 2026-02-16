"""Database models and utilities."""

from config import *
from proto.billing import *

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLAlchemy setup
Base = declarative_base()


class BillingDB(Base):
    """SQLAlchemy model for BillingYear data with protobuf conversion."""
    
    __tablename__ = 'billing_years'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    proto_data = Column(String, nullable=False)  # Serialized protobuf
    start_month = Column(Integer, nullable=False)
    start_year = Column(Integer, nullable=False)
    num_months = Column(Integer, nullable=False)

    def to_proto(self):
        """Convert SQLAlchemy model to protobuf message."""
        return BillingYear().parse(bytes.fromhex(self.proto_data))

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        from proto_utils import proto_to_dict

        proto = self.to_proto()
        result = {
            'id': self.id,
            **proto_to_dict(proto)  # Complete serialization with all nested fields
        }
        return result
    
    @staticmethod
    def from_proto(proto_billing_year):
        """Create SQLAlchemy model from protobuf message."""
        return BillingDB(
            proto_data=bytes(proto_billing_year).hex(),
            start_month=proto_billing_year.start_month,
            start_year=proto_billing_year.start_year,
            num_months=proto_billing_year.num_months
        )
    
    def __repr__(self):
        return f"<BillingYear(id={self.id}, start={self.start_year}-{self.start_month}, months={self.num_months})>"


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
    
    def get_all_billing_years(self):
        """Get all billing years from database as list of dicts."""
        session = self.get_session()
        try:
            billing_years = session.query(BillingDB).all()
            return [by.to_dict() for by in billing_years]
        finally:
            session.close()
    
    def get_billing_year_by_id(self, billing_year_id):
        """Get a specific billing year by ID.
        
        Args:
            billing_year_id: The billing year's ID
            
        Returns:
            Dictionary representation of billing year or None if not found
        """
        session = self.get_session()
        try:
            billing_year = session.query(BillingDB).filter_by(id=billing_year_id).first()
            return billing_year.to_dict() if billing_year else None
        finally:
            session.close()
    
    def add_billing_year(self, billing_year_data):
        """Add a new billing year to the database.
        
        Args:
            billing_year_data: Protobuf BillingYear message
            
        Returns:
            Dictionary representation of created billing year
        """
        session = self.get_session()
        try:
            if isinstance(billing_year_data, BillingYear):
                billing_year = BillingDB.from_proto(billing_year_data)
            else:
                raise ValueError("billing_year_data must be a BillingYear protobuf message")
            
            session.add(billing_year)
            session.commit()
            session.refresh(billing_year)
            return billing_year.to_dict()
        finally:
            session.close()
    
    def delete_billing_year(self, billing_year_id):
        """Delete a billing year from the database.
        
        Args:
            billing_year_id: The billing year's ID
            
        Returns:
            True if deleted, False if not found
        """
        session = self.get_session()
        try:
            billing_year = session.query(BillingDB).filter_by(id=billing_year_id).first()
            if not billing_year:
                return False
            
            session.delete(billing_year)
            session.commit()
            return True
        finally:
            session.close()
