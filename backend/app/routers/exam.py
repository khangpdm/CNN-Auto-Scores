from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Exam, ExamStatus, AnswerKey, ExamStatus, SessionStatus, User
from routers.auth import get_current_user
from services.excel_service import parse_and_save_excel_to_db