import base64
import os
import uuid
import zipfile
from io import BytesIO
from typing import List

import cv2
import numpy as np
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from streamlit.runtime.caching import storage

from database.connection import get_db
from database.models import AnswerKey, ExamSession, ScanBatch, Student, StudentResult, User
from routers.auth import get_current_user
from services.grading_service import process_single_image, process_files_background

router = APIRouter(prefix="/api/v1/grading", tags=["AI Grading Engine"])

UPLOAD_DIR = "storage/uploads"
PROCESSED_DIR = "storage/processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

@router.post("/sessions/{session_id}/scan", summary="Tải ảnh bài thi lên (hỗ trợ 1 ảnh, nhiều ảnh và ZIP)")
async def scan_exam_sheets(
    session_id: int,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    files: List[UploadFile] = File(..., description="Chọn 1 hoặc nhiều file ảnh (jpg, png) hoặc file ZIP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đợt thi")

    if not files:
        raise HTTPException(status_code=400, detail="Chưa chọn file nào")

    image_extensions = {'.jpg', '.jpeg', '.png'}
    zip_extensions = {'.zip'}

    if len(files) == 1:
        file = files[0]
        ext = os.path.splitext(file.filename)[-1].lower()
        if ext in zip_extensions:
            return await handle_zip_file(file, session_obj, background_tasks, db, current_user)

        if ext not in image_extensions:
            raise HTTPException(400, f"File {file.filename} không phải ảnh hợp lệ")

        scan_batch = ScanBatch(
            exam_id = session_obj.exam_id,
            session_id = session_obj.id,
            batch_name = f"Single_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            scanned_by = current_user.id,
            upload_method = "single",
            total_scanned = 1,
            status = "processing",
        )
        db.add(scan_batch)
        db.commit()

        try:
            img_bytes = await file.read()
            result = process_single_image(img_bytes, session_obj, scan_batch.id, db)

            scan_batch.successful_scans = 1
            scan_batch.status = "complete"
            db.commit()

            return {
                "status": "success",
                "batch_id": scan_batch.id,
                "data": result
            }
        except Exception as e:
            scan_batch.failed_scans = 1
            scan_batch.status = "failed"
            db.commit()
            raise HTTPException(422, detail = str(e))

    zip_files = [f for f in files if os.path.splitext(f.filename)[-1].lower() in zip_extensions]
    if zip_files:
        return await handle_zip_file(zip_files[0], session_obj, background_tasks, db, current_user)

    files_data = []
    for f in files:
        ext = os.path.splitext(f.filename)[-1].lower()
        if ext not in image_extensions:
            continue
        try:
            data = await f.read()
            if data:
                files_data.append(data)
        except Exception:
            continue
    if not files_data:
        raise HTTPException(400, "Không có file ảnh hợp lệ")

    scan_batch = ScanBatch(
        exam_id = session_obj.exam_id,
        session_id = session_obj.id,
        batch_name = f"Batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        scanned_by = current_user.id,
        upload_method = "multiple",
        total_scanned = len(files_data),
        successful_scans = 0,
        failed_scans = 0,
        status = "processing"
    )
    db.add(scan_batch)
    db.commit()

    background_tasks.add_task(
        process_files_background,
        files_data = files_data,
        session_id = session_obj.id,
        batch_id = scan_batch.id,
    )

    return {
        "status": "processing",
        "batch_id": scan_batch.id,
        "message": f"Đang xử lý {len(files_data)} ảnh",
        "total_images": len(files_data)
    }

async def handle_zip_file(
    zip_file: UploadFile,
    session_obj: ExamSession,
    background_tasks: BackgroundTasks,
    db:Session,
    current_user: User
):
    try:
        zip_bytes = await zip_file.read()
        zip_buffer = BytesIO(zip_bytes)
        files_data = []
        image_extensions = {'.jpg', '.jpeg', '.png'}

        with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
            for filename in zip_ref.namelist():
                ext = os.path.splitext(filename)[-1].lower()
                if ext in image_extensions:
                    try:
                        data= zip_ref.read(filename)
                        if data:
                            files_data.append(data)
                    except Exception:
                        continue

        if not files_data:
            raise HTTPException(400, "Không tìm thấy ảnh trong ZIP")

        scan_batch = ScanBatch(
            exam_id = session_obj.exam_id,
            session_id = session_obj.id,
            batch_name = f"ZIP_{zip_file.filename}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            scanned_by = current_user.id,
            upload_method = "zip",
            total_scanned = len(files_data),
            successful_scans = 0,
            failed_scans = 0,
            status = "processing"
        )
        db.add(scan_batch)
        db.commit()

        background_tasks.add_task(
            process_files_background,
            files_data = files_data,
            session_id = session_obj.id,
            batch_id = scan_batch.id
        )

        return {
            "status": "processing",
            "batch_id": scan_batch.id,
            "message": f"Đã giải nén và xử lý {len(files_data)} ảnh từ ZIP",
            "total_images": len(files_data)
        }
    except zipfile.BadZipFile:
        raise HTTPException(400, "File ZIP không hợp lệ")
    except Exception as e:
        raise HTTPException(400, detail = f"Lỗi xử lý ZIP: {str(e)}")

@router.get("/scan-batches/{batch_id}/status", summary="Kiểm tra tiến độ xử lý")
def get_batch_status(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Không tìm thấy batch")

    results = db.query(StudentResult).filter(
        StudentResult.scan_batch_id == batch_id
    ).all()

    total = batch.total_scanned or 0
    processed = len(results)
    progress = round((processed / total) * 100, 2) if total > 0 else 0

    return {
        "batch_id": batch.id,
        "status": batch.status,  # processing, completed, partial, failed
        "total": total,
        "processed": processed,
        "successful": batch.successful_scans,
        "failed": batch.failed_scans,
        "progress": progress,
        "processing_time": batch.processing_time,
        "created_at": batch.scan_time,
        "results": [
            {
                "result_id": r.id,
                "image_url": r.raw_image_path,
                "student_code": r.student_code,
                "student_name": r.student.full_name if r.student else None,
                "test_code": r.detected_test_code,
                "total_score": r.score,
                "status": r.status,  # NEED_REVIEW, FAILED, graded
                "is_manual_override": r.is_manual_override,
                "warnings": r.warnings or [],  # 👈 Trả về danh sách các lỗi AI bóc được để hiển thị cảnh báo
                "processed_image_url": r.processed_image_path
            }
            for r in results
        ]
    }
