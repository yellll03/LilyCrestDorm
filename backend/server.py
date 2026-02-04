from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import firebase_admin
from firebase_admin import credentials, auth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Firebase initialization
cred = credentials.Certificate(ROOT_DIR / 'firebase-credentials.json')
firebase_admin.initialize_app(cred)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Models ==============

# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = "resident"  # resident, admin, staff
    firebase_tenant_id: Optional[str] = None  # ID from Firebase tenant collection
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None

# Room Models
class Room(BaseModel):
    room_id: str = Field(default_factory=lambda: f"room_{uuid.uuid4().hex[:12]}")
    room_number: str
    room_type: str  # Standard, Deluxe, Suite
    bed_type: str  # Single, Double, Bunk
    capacity: int = 1
    floor: int = 1
    status: str = "available"  # available, occupied, maintenance
    price: float = 8000.0
    amenities: List[str] = []
    images: List[str] = []  # base64 images
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoomCreate(BaseModel):
    room_number: str
    room_type: str
    bed_type: str
    capacity: int = 1
    floor: int = 1
    price: float = 8000.0
    amenities: List[str] = []
    images: List[str] = []
    description: Optional[str] = None

# Room Assignment Models
class RoomAssignment(BaseModel):
    assignment_id: str = Field(default_factory=lambda: f"assign_{uuid.uuid4().hex[:12]}")
    user_id: str
    room_id: str
    move_in_date: datetime
    move_out_date: datetime
    status: str = "active"  # active, expired, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoomAssignmentCreate(BaseModel):
    user_id: str
    room_id: str
    move_in_date: datetime
    move_out_date: datetime

# Billing Models
class Billing(BaseModel):
    billing_id: str = Field(default_factory=lambda: f"bill_{uuid.uuid4().hex[:12]}")
    user_id: str
    assignment_id: Optional[str] = None
    amount: float
    due_date: datetime
    status: str = "pending"  # pending, paid, overdue
    payment_date: Optional[datetime] = None
    description: str = "Monthly Rent"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BillingCreate(BaseModel):
    user_id: str
    assignment_id: Optional[str] = None
    amount: float
    due_date: datetime
    description: str = "Monthly Rent"

class BillingUpdate(BaseModel):
    status: Optional[str] = None
    payment_date: Optional[datetime] = None

# Maintenance Request Models
class MaintenanceRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: f"maint_{uuid.uuid4().hex[:12]}")
    user_id: str
    request_type: str  # Electrical, Plumbing, AC, Door Lock, Other
    description: str
    urgency: str = "normal"  # low, normal, high, emergency
    status: str = "pending"  # pending, in_progress, completed, cancelled
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class MaintenanceRequestCreate(BaseModel):
    user_id: str
    request_type: str
    description: str
    urgency: str = "normal"

class MaintenanceRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

# Announcement Models
class Announcement(BaseModel):
    announcement_id: str = Field(default_factory=lambda: f"ann_{uuid.uuid4().hex[:12]}")
    title: str
    content: str
    author_id: str
    priority: str = "normal"  # low, normal, high
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    author_id: str
    priority: str = "normal"

# Session Models for Auth
class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Support Ticket Models
class SupportTicket(BaseModel):
    ticket_id: str = Field(default_factory=lambda: f"ticket_{uuid.uuid4().hex[:12]}")
    user_id: str
    subject: str
    message: str
    category: str = "general"  # general, billing, maintenance, complaint, other
    status: str = "open"  # open, in_progress, resolved, closed
    priority: str = "normal"  # low, normal, high
    responses: List[dict] = []  # List of {responder_id, message, created_at}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupportTicketCreate(BaseModel):
    subject: str
    message: str
    category: str = "general"
    priority: str = "normal"

class SupportTicketResponse(BaseModel):
    message: str

# FAQ Models
class FAQ(BaseModel):
    faq_id: str = Field(default_factory=lambda: f"faq_{uuid.uuid4().hex[:12]}")
    question: str
    answer: str
    category: str = "general"  # general, billing, maintenance, rules, amenities
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== Helper Functions ==============

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

def verify_tenant_in_firebase(email: str) -> dict:
    """Check if email exists in Firebase Authentication (registered users)"""
    try:
        logger.info(f"Verifying email in Firebase Auth: {email}")
        
        # Try to get user by email from Firebase Authentication
        user = auth.get_user_by_email(email)
        
        if user:
            logger.info(f"User found in Firebase Auth: {user.uid}")
            return {
                "firebase_id": user.uid,
                "email": user.email,
                "name": user.display_name or email.split('@')[0],
                "phone": user.phone_number,
                "picture": user.photo_url,
                "email_verified": user.email_verified
            }
        
        logger.info(f"User not found in Firebase Auth: {email}")
        return None
    except auth.UserNotFoundError:
        logger.info(f"UserNotFoundError - User not registered in Firebase Auth: {email}")
        return None
    except Exception as e:
        logger.error(f"Firebase Auth verification error for {email}: {type(e).__name__}: {e}")
        return None

# ============== Auth Routes ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token - Only for verified tenants"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = auth_response.json()
    
    user_email = user_data.get("email")
    
    # Verify tenant exists in Firebase
    tenant_data = verify_tenant_in_firebase(user_email)
    
    if not tenant_data:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. Your account is not registered as an active tenant. Please contact the dormitory administrator."
        )
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = user_data.get("session_token", f"session_{uuid.uuid4().hex}")
    
    # Check if user exists in MongoDB
    existing_user = await db.users.find_one(
        {"email": user_email},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data.get("name", existing_user.get("name")),
                "picture": user_data.get("picture", existing_user.get("picture")),
                "firebase_tenant_id": tenant_data.get("firebase_id")
            }}
        )
    else:
        # Create new user - only if verified tenant
        new_user = User(
            user_id=user_id,
            email=user_email,
            name=tenant_data.get("name") or user_data.get("name", "Tenant"),
            picture=user_data.get("picture"),
            phone=tenant_data.get("phone"),
            address=tenant_data.get("address"),
            firebase_tenant_id=tenant_data.get("firebase_id")
        )
        await db.users.insert_one(new_user.dict())
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get full user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_current_user_route(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.dict()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== User Routes ==============

@api_router.get("/users/me", response_model=dict)
async def get_my_profile(request: Request):
    """Get current user's profile"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.dict()

@api_router.put("/users/me")
async def update_my_profile(request: Request, update: UserUpdate):
    """Update current user's profile"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

# ============== Room Routes ==============

@api_router.get("/rooms", response_model=List[dict])
async def get_rooms(status: Optional[str] = None, room_type: Optional[str] = None):
    """Get all rooms with optional filters"""
    query = {}
    if status:
        query["status"] = status
    if room_type:
        query["room_type"] = room_type
    
    rooms = await db.rooms.find(query, {"_id": 0}).to_list(100)
    return rooms

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    """Get a specific room"""
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@api_router.post("/rooms", response_model=dict)
async def create_room(room_data: RoomCreate, request: Request):
    """Create a new room (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    room = Room(**room_data.dict())
    await db.rooms.insert_one(room.dict())
    return room.dict()

@api_router.put("/rooms/{room_id}")
async def update_room(room_id: str, room_data: dict, request: Request):
    """Update a room (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.rooms.update_one(
        {"room_id": room_id},
        {"$set": room_data}
    )
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    return room

# ============== Room Assignment Routes ==============

@api_router.get("/assignments/me")
async def get_my_assignment(request: Request):
    """Get current user's room assignment"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    assignment = await db.room_assignments.find_one(
        {"user_id": user.user_id, "status": "active"},
        {"_id": 0}
    )
    
    if assignment:
        # Get room details
        room = await db.rooms.find_one({"room_id": assignment["room_id"]}, {"_id": 0})
        assignment["room"] = room
    
    return assignment

@api_router.post("/assignments")
async def create_assignment(assignment_data: RoomAssignmentCreate, request: Request):
    """Create room assignment (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if room is available
    room = await db.rooms.find_one({"room_id": assignment_data.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room["status"] != "available":
        raise HTTPException(status_code=400, detail="Room is not available")
    
    assignment = RoomAssignment(**assignment_data.dict())
    await db.room_assignments.insert_one(assignment.dict())
    
    # Update room status
    await db.rooms.update_one(
        {"room_id": assignment_data.room_id},
        {"$set": {"status": "occupied"}}
    )
    
    return assignment.dict()

# ============== Billing Routes ==============

@api_router.get("/billing/me")
async def get_my_billing(request: Request):
    """Get current user's billing"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bills = await db.billing.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("due_date", -1).to_list(100)
    
    return bills

@api_router.get("/billing/me/latest")
async def get_my_latest_billing(request: Request):
    """Get current user's latest billing"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bill = await db.billing.find_one(
        {"user_id": user.user_id, "status": "pending"},
        {"_id": 0},
        sort=[("due_date", 1)]
    )
    
    return bill

@api_router.post("/billing")
async def create_billing(billing_data: BillingCreate, request: Request):
    """Create billing (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    billing = Billing(**billing_data.dict())
    await db.billing.insert_one(billing.dict())
    return billing.dict()

@api_router.put("/billing/{billing_id}")
async def update_billing(billing_id: str, update: BillingUpdate, request: Request):
    """Update billing status"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.billing.update_one(
            {"billing_id": billing_id},
            {"$set": update_data}
        )
    
    bill = await db.billing.find_one({"billing_id": billing_id}, {"_id": 0})
    return bill

# ============== Maintenance Request Routes ==============

@api_router.get("/maintenance/me")
async def get_my_maintenance_requests(request: Request, status: Optional[str] = None):
    """Get current user's maintenance requests"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {"user_id": user.user_id}
    if status:
        query["status"] = status
    
    requests = await db.maintenance_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.post("/maintenance")
async def create_maintenance_request(maint_data: MaintenanceRequestCreate, request: Request):
    """Create a maintenance request"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    maint_request = MaintenanceRequest(**maint_data.dict())
    maint_request.user_id = user.user_id  # Override with authenticated user
    await db.maintenance_requests.insert_one(maint_request.dict())
    return maint_request.dict()

@api_router.put("/maintenance/{request_id}")
async def update_maintenance_request(request_id: str, update: MaintenanceRequestUpdate, request: Request):
    """Update a maintenance request"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    # If marking as completed, set completed_at
    if update_data.get("status") == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc)
    
    if update_data:
        await db.maintenance_requests.update_one(
            {"request_id": request_id},
            {"$set": update_data}
        )
    
    maint = await db.maintenance_requests.find_one({"request_id": request_id}, {"_id": 0})
    return maint

# ============== Announcement Routes ==============

@api_router.get("/announcements")
async def get_announcements(active_only: bool = True):
    """Get all announcements"""
    query = {"is_active": True} if active_only else {}
    announcements = await db.announcements.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return announcements

@api_router.post("/announcements")
async def create_announcement(announcement_data: AnnouncementCreate, request: Request):
    """Create an announcement (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    announcement = Announcement(**announcement_data.dict())
    await db.announcements.insert_one(announcement.dict())
    return announcement.dict()

# ============== FAQ Routes (Chatbot) ==============

@api_router.get("/faqs")
async def get_faqs(category: Optional[str] = None):
    """Get all FAQs"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    faqs = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return faqs

@api_router.get("/faqs/categories")
async def get_faq_categories():
    """Get all FAQ categories"""
    categories = await db.faqs.distinct("category", {"is_active": True})
    return categories

@api_router.post("/faqs")
async def create_faq(faq_data: dict, request: Request):
    """Create a new FAQ (admin only)"""
    user = await get_current_user(request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    faq = FAQ(**faq_data)
    await db.faqs.insert_one(faq.dict())
    return faq.dict()

# ============== Support Ticket Routes ==============

@api_router.get("/tickets/me")
async def get_my_tickets(request: Request, status: Optional[str] = None):
    """Get current user's support tickets"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {"user_id": user.user_id}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return tickets

@api_router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, request: Request):
    """Get a specific support ticket"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    ticket = await db.support_tickets.find_one(
        {"ticket_id": ticket_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket

@api_router.post("/tickets")
async def create_ticket(ticket_data: SupportTicketCreate, request: Request):
    """Create a new support ticket"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    ticket = SupportTicket(
        user_id=user.user_id,
        subject=ticket_data.subject,
        message=ticket_data.message,
        category=ticket_data.category,
        priority=ticket_data.priority
    )
    
    await db.support_tickets.insert_one(ticket.dict())
    return ticket.dict()

@api_router.post("/tickets/{ticket_id}/respond")
async def respond_to_ticket(ticket_id: str, response_data: SupportTicketResponse, request: Request):
    """Add a response to a support ticket"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if user owns the ticket or is admin
    if ticket["user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    response = {
        "responder_id": user.user_id,
        "responder_name": user.name,
        "message": response_data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"responses": response},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    updated_ticket = await db.support_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return updated_ticket

@api_router.put("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status_data: dict, request: Request):
    """Update ticket status (admin only for closing)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    new_status = status_data.get("status")
    if new_status not in ["open", "in_progress", "resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return ticket

# ============== Dashboard Stats Routes ==============

@api_router.get("/dashboard/me")
async def get_my_dashboard(request: Request):
    """Get dashboard data for current user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get room assignment
    assignment = await db.room_assignments.find_one(
        {"user_id": user.user_id, "status": "active"},
        {"_id": 0}
    )
    
    room = None
    if assignment:
        room = await db.rooms.find_one({"room_id": assignment["room_id"]}, {"_id": 0})
    
    # Get latest billing
    latest_bill = await db.billing.find_one(
        {"user_id": user.user_id, "status": "pending"},
        {"_id": 0},
        sort=[("due_date", 1)]
    )
    
    # Get active maintenance requests count
    active_maintenance = await db.maintenance_requests.count_documents(
        {"user_id": user.user_id, "status": {"$in": ["pending", "in_progress"]}}
    )
    
    # Get open support tickets count
    open_tickets = await db.support_tickets.count_documents(
        {"user_id": user.user_id, "status": {"$in": ["open", "in_progress"]}}
    )
    
    return {
        "user": user.dict(),
        "assignment": assignment,
        "room": room,
        "latest_bill": latest_bill,
        "active_maintenance_count": active_maintenance,
        "open_tickets_count": open_tickets
    }

# ============== Seed Data Route (for development) ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for development"""
    # Create sample rooms
    sample_rooms = [
        {
            "room_id": "room_001",
            "room_number": "101",
            "room_type": "Standard",
            "bed_type": "Single",
            "capacity": 1,
            "floor": 1,
            "status": "available",
            "price": 8000.0,
            "amenities": ["WiFi", "Air Conditioning", "Private Bathroom"],
            "description": "Cozy standard room with all basic amenities.",
            "images": [],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "room_id": "room_002",
            "room_number": "102",
            "room_type": "Standard",
            "bed_type": "Single",
            "capacity": 1,
            "floor": 1,
            "status": "available",
            "price": 8000.0,
            "amenities": ["WiFi", "Air Conditioning", "Shared Bathroom"],
            "description": "Standard room with shared bathroom facilities.",
            "images": [],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "room_id": "room_003",
            "room_number": "201",
            "room_type": "Standard",
            "bed_type": "Single",
            "capacity": 1,
            "floor": 2,
            "status": "occupied",
            "price": 8000.0,
            "amenities": ["WiFi", "Air Conditioning", "Private Bathroom"],
            "description": "Standard room on the second floor.",
            "images": [],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "room_id": "room_004",
            "room_number": "202",
            "room_type": "Deluxe",
            "bed_type": "Double",
            "capacity": 2,
            "floor": 2,
            "status": "available",
            "price": 12000.0,
            "amenities": ["WiFi", "Air Conditioning", "Private Bathroom", "Mini Fridge", "TV"],
            "description": "Spacious deluxe room with premium amenities.",
            "images": [],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "room_id": "room_005",
            "room_number": "301",
            "room_type": "Suite",
            "bed_type": "Double",
            "capacity": 2,
            "floor": 3,
            "status": "available",
            "price": 18000.0,
            "amenities": ["WiFi", "Air Conditioning", "Private Bathroom", "Mini Fridge", "TV", "Balcony", "Kitchen"],
            "description": "Premium suite with full amenities and balcony view.",
            "images": [],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Insert rooms if not exists
    for room in sample_rooms:
        existing = await db.rooms.find_one({"room_id": room["room_id"]})
        if not existing:
            await db.rooms.insert_one(room)
    
    # Create sample announcements
    sample_announcements = [
        {
            "announcement_id": "ann_001",
            "title": "Welcome to Lilycrest Dormitory!",
            "content": "We're excited to have you as part of our community. Please familiarize yourself with the house rules and don't hesitate to contact staff if you need assistance.",
            "author_id": "admin",
            "priority": "high",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "announcement_id": "ann_002",
            "title": "Monthly Rent Payment Reminder",
            "content": "Please remember that monthly rent is due on the 1st of each month. You can pay via the app or at the front desk.",
            "author_id": "admin",
            "priority": "normal",
            "is_active": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "announcement_id": "ann_003",
            "title": "Scheduled Maintenance Notice",
            "content": "Water service will be temporarily interrupted on Saturday from 9 AM to 12 PM for scheduled maintenance. We apologize for any inconvenience.",
            "author_id": "admin",
            "priority": "high",
            "is_active": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=1)
        }
    ]
    
    for announcement in sample_announcements:
        existing = await db.announcements.find_one({"announcement_id": announcement["announcement_id"]})
        if not existing:
            await db.announcements.insert_one(announcement)
    
    # Create sample FAQs based on Lilycrest policies
    sample_faqs = [
        # Payment & Billing FAQs
        {
            "faq_id": "faq_001",
            "question": "When is my rent due?",
            "answer": "Your rent due date is based on your move-in date. For example, if you moved in on January 5, your rent is due every 5th of the month.",
            "category": "billing",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_002",
            "question": "What is the grace period for payment?",
            "answer": "You have a 2-day grace period after your due date. After the grace period, a late payment penalty of ₱50 per day will be applied.",
            "category": "billing",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_003",
            "question": "What payment methods are accepted?",
            "answer": "We accept online payments and bank deposits only (BDO or BPI). Cash payments are not accepted. Please always use your name as reference when making deposits.",
            "category": "billing",
            "order": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_004",
            "question": "How is electricity billed?",
            "answer": "Each unit has an individual meter. Meter readings are taken every 15th of the month by the building engineer. You will be billed based on your actual consumption.",
            "category": "billing",
            "order": 4,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_005",
            "question": "Is water included in my rent?",
            "answer": "For quadruple and shared rooms: Yes, water is included in your rental rate. For private rooms: Water is billed based on actual consumption. For double rooms: Water charges are divided equally between occupants.",
            "category": "billing",
            "order": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Visitor Policy FAQs
        {
            "faq_id": "faq_006",
            "question": "Can I have visitors?",
            "answer": "Quadruple/Shared rooms: Visitors are only allowed at the ground floor seating area, not in rooms or floors. Private rooms: Visitors are allowed in rooms but NO overnight stays permitted. All visitors must be entertained in designated areas only.",
            "category": "rules",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_007",
            "question": "Where can I entertain visitors?",
            "answer": "A visitor seating area is provided at the ground floor. All visitors must stay in this designated area. Males are not allowed on female floors and vice versa.",
            "category": "rules",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # RFID & Access FAQs
        {
            "faq_id": "faq_008",
            "question": "What if I lose my RFID card?",
            "answer": "Report the loss immediately to the admin office. A replacement fee of ₱1,000 will be charged. Do not share or lend your RFID card to others - it may be deactivated for security reasons.",
            "category": "general",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_009",
            "question": "Can my RFID card be deactivated?",
            "answer": "Yes, your RFID card may be deactivated if you have delinquent payments. Please ensure your payments are up to date to maintain access to the building.",
            "category": "general",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Room Rules FAQs
        {
            "faq_id": "faq_010",
            "question": "Can I cook in my room?",
            "answer": "No cooking is allowed in the rooms. Only reheating food in the microwave is permitted. Please use the designated kitchen and dining areas for food preparation.",
            "category": "rules",
            "order": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_011",
            "question": "Can I transfer to another room?",
            "answer": "Room transfers require management approval. Please submit a request through the Support section if you wish to transfer to a different room.",
            "category": "rules",
            "order": 4,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_012",
            "question": "Are pets allowed?",
            "answer": "No, pets are not allowed in any Lilycrest dormitory branch.",
            "category": "rules",
            "order": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Maintenance FAQs
        {
            "faq_id": "faq_013",
            "question": "How do I report a maintenance issue?",
            "answer": "Go to the Services tab and tap 'Submit Maintenance Request'. Select the issue type, describe the problem, and submit. Our maintenance team will respond within 24-48 hours.",
            "category": "maintenance",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_014",
            "question": "Who handles maintenance issues?",
            "answer": "Our dedicated maintenance team handles all building and repair concerns. For urgent issues, you can also contact the admin office directly.",
            "category": "maintenance",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Amenities FAQs
        {
            "faq_id": "faq_015",
            "question": "What amenities are included?",
            "answer": "All rooms include WiFi, air conditioning, bed with linens, and wardrobe. Common areas include kitchen (reheating only), dining area, laundry facilities, and visitor seating area at ground floor.",
            "category": "amenities",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_016",
            "question": "How do I use the kitchen?",
            "answer": "The kitchen is for reheating food only - no cooking. Clean the table after eating, wash dishes immediately, and label your food items in the refrigerator with your name. Refrigerator defrost is every other Saturday.",
            "category": "amenities",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Branch Information
        {
            "faq_id": "faq_017",
            "question": "Where are Lilycrest branches located?",
            "answer": "Lilycrest has two branches: Gil Puyat (started 2024) and Guadalupe (operating since 2016). Both branches offer the same quality accommodation and services.",
            "category": "general",
            "order": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_018",
            "question": "What are the penalties for rule violations?",
            "answer": "Three warnings may result in contract termination and forfeiture of your security deposit. Please follow all house rules to maintain a harmonious living environment.",
            "category": "rules",
            "order": 6,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Move-out FAQs
        {
            "faq_id": "faq_019",
            "question": "What is the move-out process?",
            "answer": "1) Notify management 30 days before your intended move-out date. 2) Complete the clearance form. 3) Schedule a room inspection. 4) Settle all outstanding bills. 5) Return your RFID card on the last day.",
            "category": "general",
            "order": 4,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "faq_id": "faq_020",
            "question": "How do I contact management?",
            "answer": "You can submit a support ticket through the app, email the admin office, or visit the front desk during office hours. For Gil Puyat branch, the admin team is available on-site. For Guadalupe branch, contact the main office.",
            "category": "general",
            "order": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
    ]
    
    for faq in sample_faqs:
        existing = await db.faqs.find_one({"faq_id": faq["faq_id"]})
        if not existing:
            await db.faqs.insert_one(faq)
    
    return {"message": "Seed data created successfully"}

# ============== Root Route ==============

@api_router.get("/")
async def root():
    return {"message": "Lilycrest Dormitory Management API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
