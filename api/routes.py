from fastapi import APIRouter, HTTPException
from utils.mcp_client import (
    get_templates, add_template, update_template, delete_template,
    get_targets, add_target, get_log, get_stats,
    get_tags, add_tag, delete_tag
)
from pydantic import BaseModel
import subprocess

router = APIRouter()

class TemplateModel(BaseModel):
    intent: str
    title: str
    content: str

class TargetModel(BaseModel):
    username: str

class TagModel(BaseModel):
    tag: str

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

@router.get("/tags")
def tags():
    return get_tags()

@router.post("/tags")
def post_tag(tag: TagModel):
    return add_tag(tag.tag)

@router.delete("/tags/{tag}")
def delete_tag_route(tag: str):
    return delete_tag(tag)

@router.post("/poller/run-once")
def run_poller_once():
    try:
        result = subprocess.run([
            "python", "tasks/run_poller_once.py"
        ], capture_output=True, text=True, check=True)
        return {"success": True, "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"success": False, "error": e.stderr}