from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class Submission(Base):
    __tablename__ = "submissions_cafes_partenaires"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True, nullable=False, default="professional")
    data = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
