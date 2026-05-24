from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from models.db import Asset, AssetCreate, AssetUpdate
from database import get_session

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/")
def list_assets(session: Session = Depends(get_session)):
    return session.exec(select(Asset).order_by(Asset.id)).all()


@router.post("/")
def create_asset(body: AssetCreate, session: Session = Depends(get_session)):
    row = Asset(name=body.name.strip(), value=body.value, debt=body.debt)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/{asset_id}")
def update_asset(asset_id: int, body: AssetUpdate, session: Session = Depends(get_session)):
    row = session.get(Asset, asset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    row.updated_at = datetime.utcnow()
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/{asset_id}")
def delete_asset(asset_id: int, session: Session = Depends(get_session)):
    row = session.get(Asset, asset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    session.delete(row)
    session.commit()
    return {"ok": True}
