from fastapi import APIRouter

router = APIRouter()

@router.post("/summarize")
async def summarize_document():
    """
    This is a summarize endpoint
    """
    
    
    
    