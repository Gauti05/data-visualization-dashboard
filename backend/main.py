import os
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
import pandas as pd
import io
from typing import Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from pydantic import EmailStr
from fastapi import Path, Query
from collections import defaultdict

load_dotenv()  

MONGO_DETAILS = os.getenv("MONGO_DETAILS")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

app = FastAPI()


origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.dashboard_db
users_collection = database.get_collection("users")
datasets_collection = database.get_collection("datasets")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def truncate_password(password: str) -> str:
    return password[:72]

class UserIn(BaseModel):
    email: str
    password: str

def dataset_helper(dataset) -> dict:
    return {
        "id": str(dataset["_id"]),
        "user_email": dataset["user_email"],
        "filename": dataset["filename"],
        "data": dataset["data"],
        "columns": list(dataset["data"][0].keys()) if dataset.get("data") else []
    }

@app.get("/")
async def root():
    return {"message": "Server is running"}

@app.post("/signup")
async def signup(user: UserIn):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(truncate_password(user.password))
    await users_collection.insert_one({
        "email": user.email,
        "hashed_password": hashed_password
    })
    return {"message": "User created successfully"}

@app.post("/login")
async def login(user: UserIn) -> Dict[str, str]:
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(truncate_password(user.password), db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = jwt.encode({"sub": user.email}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/login"))):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = await users_collection.find_one({"email": email})
        if user is None:
            raise credentials_exception
        return {"email": email}
    except JWTError:
        raise credentials_exception

@app.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and process CSV or Excel file with improved error handling"""
    
    
    allowed_extensions = [".csv", ".xlsx", ".xls"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
   
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    
    max_size = 10 * 1024 * 1024  
    if len(content) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is 10MB"
        )
    
  
    try:
        if file_ext == ".csv":
          
            df = None
            for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    df = pd.read_csv(io.StringIO(content.decode(encoding)))
                    break
                except (UnicodeDecodeError, Exception):
                    continue
            
            if df is None:
                raise HTTPException(status_code=400, detail="Could not decode CSV file. Please check file encoding.")
        
        else:  
            df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error parsing file: {str(e)}. Please ensure the file format is correct."
        )
    
   
    if df.empty:
        raise HTTPException(status_code=400, detail="File contains no data")
    
    if len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="File has no columns")
    
   
    df.columns = df.columns.str.strip()  
    df = df.where(pd.notnull(df), None)  
    
   
    try:
        data_json = df.to_dict(orient="records")
        columns = list(df.columns)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error converting data: {str(e)}")
    
 
    dataset_doc = {
        "user_email": current_user["email"],
        "filename": file.filename,
        "data": data_json,
        "columns": columns
    }
    
   
    try:
        insert_result = await datasets_collection.insert_one(dataset_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "id": str(insert_result.inserted_id),
        "filename": file.filename,
        "rows": len(data_json),
        "columns": columns,
        "uploaded_by": current_user["email"]
    }

@app.get("/datasets/")
async def get_datasets(current_user: dict = Depends(get_current_user)):
    datasets = []
    async for dataset in datasets_collection.find({"user_email": current_user["email"]}):
        datasets.append(dataset_helper(dataset))
    return datasets

@app.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = await datasets_collection.find_one({"_id": ObjectId(dataset_id), "user_email": current_user["email"]})
    if dataset:
        return dataset_helper(dataset)
    raise HTTPException(status_code=404, detail="Dataset not found")


@app.get("/datasets/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"),
    search: Optional[str] = None,
    filter_column: Optional[str] = None,
    filter_value: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        dataset = await datasets_collection.find_one({
            "_id": ObjectId(dataset_id),
            "user_email": current_user["email"]
        })
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        data = dataset.get("data", [])
        columns = list(data[0].keys()) if data else []
        
      
        if search:
            data = [
                row for row in data
                if any(
                    search.lower() in str(row.get(col, "")).lower()
                    for col in columns
                )
            ]
        
        
        if filter_column and filter_value:
            data = [
                row for row in data
                if filter_value.lower() in str(row.get(filter_column, "")).lower()
            ]
        
      
        if sort_by and sort_by in columns:
            reverse = (sort_order == "desc")
            try:
             
                data = sorted(
                    data,
                    key=lambda x: float(x.get(sort_by, 0) or 0),
                    reverse=reverse
                )
            except (ValueError, TypeError):
               
                data = sorted(
                    data,
                    key=lambda x: str(x.get(sort_by, "")).lower(),
                    reverse=reverse
                )
        
       
        total_count = len(data)
        
 
        paginated_data = data[skip:skip + limit]
        
        return {
            "id": str(dataset["_id"]),
            "filename": dataset["filename"],
            "columns": columns,
            "data": paginated_data,
            "total_count": total_count,
            "page": skip // limit + 1,
            "page_size": limit,
            "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/datasets/{dataset_id}/aggregate")
async def aggregate_dataset(
    dataset_id: str,
    group_by: str,
    aggregate_column: Optional[str] = None,
    operation: str = Query("count", regex="^(count|sum|avg|min|max)$"),
    search: Optional[str] = None,
    filter_column: Optional[str] = None,
    filter_value: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        dataset = await datasets_collection.find_one({
            "_id": ObjectId(dataset_id),
            "user_email": current_user["email"]
        })
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        data = dataset.get("data", [])
        columns = list(data[0].keys()) if data else []
     
        if search:
            data = [
                row for row in data
                if any(
                    search.lower() in str(row.get(col, "")).lower()
                    for col in columns
                )
            ]
        
        if filter_column and filter_value:
            data = [
                row for row in data
                if filter_value.lower() in str(row.get(filter_column, "")).lower()
            ]
        
     
        groups = defaultdict(list)
        
        for row in data:
            key = str(row.get(group_by, "Unknown"))
            groups[key].append(row)
        
        result = []
        for key, rows in groups.items():
            if operation == "count":
                value = len(rows)
            elif operation in ["sum", "avg", "min", "max"]:
                if not aggregate_column:
                    raise HTTPException(status_code=400, detail=f"aggregate_column required for {operation}")
                try:
                    values = [float(row.get(aggregate_column, 0) or 0) for row in rows]
                    if operation == "sum":
                        value = sum(values)
                    elif operation == "avg":
                        value = sum(values) / len(values) if values else 0
                    elif operation == "min":
                        value = min(values) if values else 0
                    elif operation == "max":
                        value = max(values) if values else 0
                except (ValueError, TypeError):
                    value = 0
            
            result.append({"label": key, "value": value})
       
        result = sorted(result, key=lambda x: x["label"])
        
        return {
            "group_by": group_by,
            "aggregate_column": aggregate_column,
            "operation": operation,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    user = await users_collection.find_one({"email": email}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@app.put("/me/password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not pwd_context.verify(truncate_password(data.old_password), user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    new_hashed = pwd_context.hash(truncate_password(data.new_password))
    result = await users_collection.update_one({"email": email}, {"$set": {"hashed_password": new_hashed}})
    if result.modified_count == 1:
        return {"message": "Password changed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update password")

@app.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    result = await datasets_collection.delete_one({"_id": ObjectId(dataset_id), "user_email": current_user["email"]})
    if result.deleted_count == 1:
        return {"message": "Dataset deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Dataset not found or not authorized")

class DatasetRename(BaseModel):
    new_filename: str

@app.put("/datasets/{dataset_id}/rename")
async def rename_dataset(dataset_id: str, rename: DatasetRename, current_user: dict = Depends(get_current_user)):
    result = await datasets_collection.update_one(
        {"_id": ObjectId(dataset_id), "user_email": current_user["email"]},
        {"$set": {"filename": rename.new_filename}}
    )
    if result.modified_count == 1:
        return {"message": "Dataset renamed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Dataset not found or not authorized")


class EmailUpdate(BaseModel):
    email: str

@app.put("/me")
async def update_email(data: EmailUpdate, current_user: dict = Depends(get_current_user)):
    """Update user email"""
    current_email = current_user["email"]
    new_email = data.email
    
 
    if new_email == current_email:
        raise HTTPException(status_code=400, detail="New email is same as current email")
    
   
    existing_user = await users_collection.find_one({"email": new_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use by another account")
    
 
    result = await users_collection.update_one(
        {"email": current_email}, 
        {"$set": {"email": new_email}}
    )
    
    if result.modified_count == 1:
        
        await datasets_collection.update_many(
            {"user_email": current_email},
            {"$set": {"user_email": new_email}}
        )
        
       
        new_token = jwt.encode({"sub": new_email}, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "message": "Email updated successfully",
            "new_token": new_token
        }
    else:
        raise HTTPException(status_code=400, detail="Failed to update email")
