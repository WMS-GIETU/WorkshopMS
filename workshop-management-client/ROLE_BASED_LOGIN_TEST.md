# Role-Based Login Test Guide

## 🎯 Testing the Role-Based Authentication System

### **Test Scenario 1: Admin Registration & Login**

1. **Register as Admin:**
   - Go to `/register`
   - Fill form with:
     - Username: `admin1`
     - Email: `admin1@test.com`
     - Password: `password123`
     - Role: `admin`
     - Club Code: `SARS123`
   - Click Register
   - Should see: "Registration successful! Please use Admin Login to access your account."

2. **Login as Admin (Correct Page):**
   - Go to Admin Login page
   - Use credentials: `admin1` / `password123` / `SARS123`
   - Should successfully login and redirect to `/intro`

3. **Login as Admin (Wrong Page):**
   - Go to Club Member Login page
   - Use same credentials: `admin1` / `password123` / `SARS123`
   - Should see: "This login is only for Club Members. Please use Admin Login for admin accounts."

### **Test Scenario 2: Club Member Registration & Login**

1. **Register as Club Member:**
   - Go to `/register`
   - Fill form with:
     - Username: `member1`
     - Email: `member1@test.com`
     - Password: `password123`
     - Role: `clubMember`
     - Club Code: `SARS123`
   - Click Register
   - Should see: "Registration successful! Please use Club Member Login to access your account."

2. **Login as Club Member (Correct Page):**
   - Go to Club Member Login page
   - Use credentials: `member1` / `password123` / `SARS123`
   - Should successfully login and redirect to `/intro`

3. **Login as Club Member (Wrong Page):**
   - Go to Admin Login page
   - Use same credentials: `member1` / `password123` / `SARS123`
   - Should see: "This login is only for Admins. Please use Club Member Login for club member accounts."

### **Test Scenario 3: Invalid Club Code**

1. **Test with Wrong Club Code:**
   - Use any registered user
   - Enter correct username/password but wrong club code
   - Should see: "Invalid club code"

### **Test Scenario 4: Invalid Credentials**

1. **Test with Wrong Password:**
   - Use any registered username
   - Enter wrong password
   - Should see: "Invalid credentials"

## ✅ Expected Results

- **Role Enforcement:** Users can only login on their designated login page
- **Clear Error Messages:** Specific messages guide users to the correct login page
- **Club Code Validation:** Club code must match for successful login
- **Session Management:** Successful login creates proper session and redirects to dashboard

## 🔧 Troubleshooting

If tests fail:
1. Check browser console for errors
2. Verify backend server is running on port 5000
3. Check MongoDB connection
4. Ensure all form fields are properly filled 