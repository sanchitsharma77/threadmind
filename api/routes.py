from fastapi import APIRouter, HTTPException
from utils.mcp_client import (
    get_templates, add_template, update_template, delete_template,
    get_targets, add_target, get_log, get_stats
)
from pydantic import BaseModel

router = APIRouter()

class TemplateModel(BaseModel):
    intent: str
    title: str
    content: str

class TargetModel(BaseModel):
    username: str

@router.get("/ping")
def ping():
    return {"status": "ok"}

@router.get("/stats")
def stats():
    return get_stats()

@router.get("/templates")
def templates():
    return get_templates()

@router.post("/templates")
def post_template(template: TemplateModel):
    return add_template(template.dict())

@router.put("/templates/{template_id}")
def put_template(template_id: int, template: TemplateModel):
    return update_template(template_id, template.dict())

@router.delete("/templates/{template_id}")
def delete_template_route(template_id: int):
    return delete_template(template_id)

@router.get("/targets")
def targets():
    return get_targets()

@router.post("/targets")
def post_target(target: TargetModel):
    return add_target(target.dict())

@router.get("/log")
def log():
    return get_log()