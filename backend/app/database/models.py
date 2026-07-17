from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime, Boolean, Text, Enum, \
    UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .connection import Base


# ============ ENUMS ============
class UserRole(enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"


class ExamStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    GRADING = "grading"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SessionStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    GRADING = "grading"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ExamPermission(enum.Enum):
    VIEWER = "viewer"  # Chỉ xem
    GRADER = "grader"  # Chỉ chấm điểm
    EDITOR = "editor"  # Sửa được
    OWNER = "owner"  # Toàn quyền


# ============ USERS ============
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.TEACHER)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    exams = relationship("Exam", back_populates="creator")
    exam_sessions = relationship("ExamSession", back_populates="creator")
    answer_keys = relationship("AnswerKey", back_populates="creator")
    scan_batches = relationship("ScanBatch", back_populates="scanner")
    students = relationship("Student", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")

    # Chia sẻ: Người được chia sẻ
    shared_exams = relationship("ExamShared", foreign_keys="[ExamShared.user_id]", back_populates="user")
    # Chia sẻ: Người đã chia sẻ
    shared_by_me = relationship("ExamShared", foreign_keys="[ExamShared.shared_by]", back_populates="shared_by_user")


# ============ EXAMS ============
class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    # Tự sinh: VD: HK1_2024
    exam_code = Column(String(50), nullable=False, index=True)
    exam_name = Column(String(200), nullable=False)  # "Kiểm tra Học kỳ I 2024"

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(ExamStatus, native_enum=False), default=ExamStatus.DRAFT)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="exams")
    sessions = relationship("ExamSession", back_populates="exam", cascade="all, delete-orphan")
    answer_keys = relationship("AnswerKey", back_populates="exam", cascade="all, delete-orphan")
    student_results = relationship("StudentResult", back_populates="exam", cascade="all, delete-orphan")
    scan_batches = relationship("ScanBatch", back_populates="exam")
    shared_users = relationship("ExamShared", back_populates="exam", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('created_by', 'exam_code', name='_user_exam_code_uc'),
    )

# ============ EXAM SESSIONS ============
class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)

    # Tự sinh: VD: TOAN12A1
    session_code = Column(String(50), nullable=False, index=True)
    session_name = Column(String(200), nullable=False)  # "Toán 12A1" (Đã có môn + lớp)

    total_questions = Column(Integer, nullable=False)  # Lấy từ file đáp án
    max_score = Column(Float, default=10.0)  # Để mặc định 10

    status = Column(Enum(SessionStatus, native_enum=False), default=SessionStatus.PENDING)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="sessions")
    creator = relationship("User", back_populates="exam_sessions")
    students = relationship("Student", back_populates="session")
    answer_keys = relationship("AnswerKey", back_populates="session", cascade="all, delete-orphan")
    student_results = relationship("StudentResult", back_populates="session", cascade="all, delete-orphan")
    scan_batches = relationship("ScanBatch", back_populates="session")

    # Ràng buộc: Trong 1 kỳ thi, mã đợt thi phải unique
    __table_args__ = (
        UniqueConstraint('exam_id', 'session_code', name='_exam_session_code_uc'),
        Index('idx_exam_session', 'exam_id', 'session_code'),
    )


# ============ ANSWER KEYS ============
class AnswerKey(Base):
    __tablename__ = "answer_keys"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)

    test_code = Column(String(50), nullable=False, index=True)
    answers = Column(JSON, nullable=False)  # {"1": "A", "2": "B"}
    score_per_question = Column(JSON, nullable=True)  # {"1": 0.5, "2": 1.0}

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="answer_keys")
    session = relationship("ExamSession", back_populates="answer_keys")
    creator = relationship("User", back_populates="answer_keys")

    # Ràng buộc: Trong 1 đợt thi, mã đề phải unique
    __table_args__ = (
        UniqueConstraint('session_id', 'test_code', name='_session_test_code_uc'),
        Index('idx_session_test', 'session_id', 'test_code'),
    )


# ============ STUDENTS ============
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    student_code = Column(String(50), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)

    class_name = Column(String(50), nullable=True)
    room = Column(String(20), nullable=True)
    note = Column(String(255), nullable=True)
    dob = Column(DateTime, nullable=True)
    gender = Column(String(10), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ExamSession", back_populates="students")
    creator = relationship("User", back_populates="students")
    results = relationship("StudentResult", back_populates="student")

    # Ràng buộc: Trong 1 đợt thi, SBD phải unique
    __table_args__ = (
        UniqueConstraint('session_id', 'student_code', name='_session_student_uc'),
        Index('idx_session_student', 'session_id', 'student_code'),
    )


# ============ SCAN BATCH ============
class ScanBatch(Base):
    __tablename__ = "scan_batches"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)

    batch_name = Column(String(100), nullable=False)
    scanned_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    total_scanned = Column(Integer, default=0)
    successful_scans = Column(Integer, default=0)
    failed_scans = Column(Integer, default=0)

    scan_time = Column(DateTime, default=datetime.utcnow)
    processing_time = Column(Float, nullable=True)
    status = Column(String(20), default="processing")

    storage_path = Column(String(500), nullable=True)
    upload_method = Column(String(20), default="zip")
    scan_metadata = Column(JSON, nullable=True)

    # Relationships
    exam = relationship("Exam", back_populates="scan_batches")
    session = relationship("ExamSession", back_populates="scan_batches")
    scanner = relationship("User", back_populates="scan_batches")
    results = relationship("StudentResult", back_populates="scan_batch")

    __table_args__ = (
        Index('idx_batch_session', 'session_id'),
        Index('idx_batch_status', 'status'),
    )


# ============ STUDENT RESULTS ============
class StudentResult(Base):
    __tablename__ = "student_results"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    scan_batch_id = Column(Integer, ForeignKey("scan_batches.id"), nullable=True, index=True)

    # Thông tin từ OCR
    student_code = Column(String(20), nullable=True, index=True)
    detected_test_code = Column(String(50), nullable=True, index=True)
    raw_image_path = Column(String(500), nullable=True)
    processed_image_path = Column(String(500), nullable=True)  # ✅ Ảnh sau chấm (có vẽ kết quả)
    overlay_image_path = Column(String(500), nullable=True)  # ✅ Ảnh overlay (đáp án đúng/sai)

    # Kết quả chấm (AI)
    answers = Column(JSON, default={})
    correct_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    warnings = Column(JSON, default=[])

    # Chấm tay (Manual Override)
    is_manual_override = Column(Boolean, default=False)
    manual_answers = Column(JSON, nullable=True)
    manual_score = Column(Float, nullable=True)
    override_reason = Column(Text, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Trạng thái
    status = Column(String(20), default="pending")  # pending, processing, graded, error, manual

    # Metadata
    scanned_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="student_results")
    session = relationship("ExamSession", back_populates="student_results")
    scan_batch = relationship("ScanBatch", back_populates="results")
    student = relationship("Student", back_populates="results")
    verifier = relationship("User", foreign_keys=[verified_by])

    # Indexes
    __table_args__ = (
        Index('idx_exam_verified', 'exam_id', 'is_manual_override'),
        Index('idx_session_student_result', 'session_id', 'student_id'),
        Index('idx_exam_student', 'exam_id', 'student_id'),
        Index('idx_result_status', 'status'),
        Index('idx_student_code', 'student_code'),
    )


# ============ EXAM SHARED (Chia sẻ kỳ thi) ============
class ExamShared(Base):
    __tablename__ = "exam_shares"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    permission = Column(Enum(ExamPermission, native_enum=False), default=ExamPermission.VIEWER)
    shared_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="shared_users")
    user = relationship("User", foreign_keys=[user_id], back_populates="shared_exams")
    shared_by_user = relationship("User", foreign_keys=[shared_by], back_populates="shared_by_me")

    # Ràng buộc: 1 user chỉ được thêm vào 1 kỳ thi 1 lần
    __table_args__ = (
        UniqueConstraint('exam_id', 'user_id', name='_exam_user_uc'),
        Index('idx_exam_shared_user', 'exam_id', 'user_id'),
        Index('idx_exam_shared_permission', 'exam_id', 'permission'),
        Index('idx_exam_shared_expires', 'expires_at'),
    )


# ============ AUDIT LOG ============
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # create, update, delete, share, import, grade
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=True)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_table', 'table_name'),
    )