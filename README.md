# Data Visualization Dashboard Platform

A full-stack web application for uploading, managing, and visualizing data with interactive charts and tables. Built with React (frontend) and FastAPI (backend).

## 🚀 Features

### Core Features
- ✅ **User Authentication**: Secure signup/login with JWT tokens
- ✅ **File Upload**: Support for CSV and Excel files (.csv, .xlsx)
- ✅ **Data Management**: Upload, rename, delete datasets
- ✅ **Interactive Tables**: Paginated, sortable, and searchable data tables
- ✅ **Data Visualization**: Dynamic charts (Bar, Line, Pie)
- ✅ **Advanced Filtering**: Search and column-specific filters
- ✅ **Synchronized Views**: Filters apply to both tables and charts simultaneously
- ✅ **Profile Management**: View and edit user profile, change password
- ✅ **Backend Processing**: All data filtering, sorting, and aggregation on server-side

### Bonus Features
- ✅ **Light/Dark Theme Toggle**: Persistent theme preference
- ✅ **Responsive Design**: Mobile-friendly UI with Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP requests
- **Chart.js** & **react-chartjs-2** - Data visualizations
- **Tailwind CSS** - Styling
- **Context API** - State management (Auth & Theme)

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pandas** - Data processing
- **JWT** - Authentication
- **Bcrypt** - Password hashing

---

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or cloud - MongoDB Atlas)
- **npm** or **yarn**

---

## 🔧 Installation & Setup

### 1. Clone the Repository

git clone <your-repo-url>
cd data-visualization-dashboard


### 2. Backend Setup

#### Navigate to backend directory

cd backend


#### Create virtual environment

python -m venv venv


#### Activate virtual environment
- **Windows:**


venv\Scripts\activate
- **Mac/Linux:**


source venv/bin/activate
#### Install dependencies


pip install fastapi uvicorn python-jose passlib bcrypt motor pandas python-multipart openpyxl python-dotenv
#### Create `.env` file in backend directory


MONGO_DETAILS=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
SECRET_KEY=your-secret-key-here-generate-a-random-string
**To generate a secure SECRET_KEY:**


import secrets
print(secrets.token_urlsafe(32))


#### Run backend server
uvicorn main:app --reload


Backend will run on: `http://localhost:8000`

---

### 3. Frontend Setup

#### Open new terminal and navigate to frontend directory

cd frontend

#### Install dependencies

npm install

#### Required packages (should be in package.json):

npm install react-router-dom axios chart.js react-chartjs-2


#### Run frontend development server

npm start

Frontend will run on: `http://localhost:3000`

---

## 📂 Project Structure

INTERNTASK/
│
├── backend/
│ ├── main.py # FastAPI application
│ ├── .env # Environment variables (create this)
│ └── venv/ # Virtual environment
│
├── frontend/
|──data-dashboard
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ │ ├── Dashboard.js
│ │ │ ├── DatasetDetail.js
│ │ │ ├── Navbar.js
│ │ │ ├── ThemeToggle.js
│ │ │ ├── ProfileView.js
│ │ │ ├── ProfileEdit.js
│ │ │ └── PasswordChange.js
│ │ ├── contexts/
│ │ │ ├── AuthContext.js
│ │ │ └── ThemeContext.js
│ │ ├── pages/
│ │ │ ├── Login.js
│ │ │ ├── Signup.js
│ │ │ ├── ProfilePage.js
│ │ │ └── DatasetDetailPage.js
│ │ ├── App.js
│ │ └── index.js
│ ├── package.json
│ └── tailwind.config.js
│
└── README.md




---

## 🎯 Usage Guide

### 1. **Sign Up / Login**
- Navigate to signup page to create an account
- Login with your credentials

### 2. **Upload Dataset**
- Go to Dashboard
- Select a CSV or Excel file
- Click "Upload" button

### 3. **View Data**
- Click on any dataset to view details
- Data displayed in paginated table format
- Use search bar to filter across all columns
- Click column headers to sort

### 4. **Visualize Data**
- On dataset detail page, configure chart settings:
  - Select column to group by
  - Choose operation (Count, Sum, Average, Min, Max)
  - Select chart type (Bar, Line, Pie)
- Filters apply to both table and chart

### 5. **Manage Profile**
- Click "Profile" in navbar
- Update email or change password

### 6. **Toggle Theme**
- Click sun/moon icon in navbar
- Theme preference saved automatically

---

## 🔑 API Endpoints

### Authentication
- `POST /signup` - Create new user account
- `POST /login` - User login, returns JWT token

### Datasets
- `GET /datasets/` - Get all user datasets
- `GET /datasets/{id}` - Get specific dataset
- `GET /datasets/{id}/data` - Get paginated/filtered/sorted data
- `GET /datasets/{id}/aggregate` - Get aggregated data for charts
- `POST /uploadfile/` - Upload new dataset
- `PUT /datasets/{id}/rename` - Rename dataset
- `DELETE /datasets/{id}` - Delete dataset

### Profile
- `GET /me` - Get user profile
- `PUT /me` - Update user email
- `PUT /me/password` - Change password

---

## 🎨 Key Features Implementation

### Pagination
- Backend returns paginated results with metadata
- Frontend displays page controls and page size selector
- Configurable page sizes: 10, 25, 50, 100 records

### Filtering & Sorting
- **Global search**: Searches across all columns
- **Column-specific filter**: Filter by specific column value
- **Sorting**: Click column headers to sort ascending/descending
- All processing happens server-side for efficiency

### Data Visualization
- Three chart types: Bar, Line, Pie
- Aggregation operations: Count, Sum, Average, Min, Max
- Charts dynamically update based on filters
- Synchronized with table data

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Secure token storage

---

## 🧪 Testing

### Test User Flow
1. Sign up with test email
2. Upload sample CSV/Excel file
3. View data in table format
4. Apply filters and sorting
5. Create visualizations
6. Test pagination
7. Toggle theme
8. Update profile
9. Logout and login again

### Sample Dataset
Use any CSV or Excel file with columns and rows. Example:
Name,Age,City,Salary
John,30,New York,70000
Jane,25,Los Angeles,65000
Bob,35,Chicago,80000


---

## 🐛 Troubleshooting

### Backend Issues
**MongoDB Connection Error:**
- Verify MongoDB connection string in `.env`
- Check network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**Module Not Found:**

pip install <missing-module>


### Frontend Issues
**CORS Error:**
- Ensure backend is running on port 8000
- Check CORS middleware in `main.py`

**Chart Not Displaying:**
- Verify Chart.js is installed
- Check browser console for errors

**Theme Not Changing:**
- Clear browser cache
- Check `tailwind.config.js` has `darkMode: 'class'`
- Restart development server

---

## 📦 Dependencies

### Backend (Python)

fastapi
uvicorn
motor
pandas
python-jose[cryptography]
passlib[bcrypt]
python-multipart
openpyxl
python-dotenv


### Frontend (Node.js)
react
react-dom
react-router-dom
axios
chart.js
react-chartjs-2
tailwindcss



---

## 🚀 Deployment

### Backend (FastAPI)
- Deploy on **Render**, **Railway**, or **AWS EC2**
- Set environment variables in hosting platform
- Use production ASGI server (Gunicorn + Uvicorn)

### Frontend (React)
- Build production version: `npm run build`
- Deploy on **Vercel**, **Netlify**, or **AWS S3**
- Update API base URL to production backend URL

---

## 📄 License

This project is created as an assignment submission.

---

## 👤 Author

**Your Name**
- GitHub: [Gautam-Rawat](https://github.com/Gauti05)
- Email: gautamrawat52002@gmail.com

---

## 🙏 Acknowledgments

- FastAPI documentation
- React documentation
- Chart.js community
- MongoDB documentation
- Tailwind CSS

---

## 📝 Assignment Notes

This project demonstrates:
- ✅ Full-stack development skills
- ✅ RESTful API design
- ✅ Modern React patterns (Hooks, Context)
- ✅ Database schema design
- ✅ Data visualization best practices
- ✅ Responsive UI/UX design
- ✅ Security implementation
- ✅ Backend data processing






