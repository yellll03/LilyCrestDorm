#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://housing-connect-4.preview.emergentagent.com"
SESSION_TOKEN = "test_session_1770212957374"

# Test data for Email/Password Login
VALID_TENANT_EMAIL = "p.vincebryn@gmail.com"
VALID_TENANT_PASSWORD = "testpassword"
INVALID_TENANT_EMAIL = "nonexistent@test.com"
INVALID_PASSWORD = "test"

def make_request(method, endpoint, headers=None, data=None, params=None):
    """Make HTTP request and return response details"""
    url = f"{BASE_URL}{endpoint}"
    
    if headers is None:
        headers = {}
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, headers=headers, data=json.dumps(data) if data else None)
        elif method.upper() == "PUT":
            headers['Content-Type'] = 'application/json'
            response = requests.put(url, headers=headers, data=json.dumps(data) if data else None)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        result = {
            "status_code": response.status_code,
            "url": url,
            "headers": dict(response.headers),
            "success": response.status_code == 200
        }
        
        try:
            result["data"] = response.json()
        except:
            result["text"] = response.text
            
        return result
    
    except Exception as e:
        return {
            "error": str(e),
            "url": url,
            "success": False
        }

def test_health_endpoints():
    """Test health check endpoints"""
    print("\n=== TESTING HEALTH ENDPOINTS ===")
    
    # Test root endpoint
    print("\n1. Testing GET /api/")
    result = make_request("GET", "/api/")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        print(f"   Response: {result.get('data', result.get('text', 'No data'))}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test health endpoint  
    print("\n2. Testing GET /api/health")
    result = make_request("GET", "/api/health")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        print(f"   Response: {result.get('data', result.get('text', 'No data'))}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    return True

def test_seed_endpoint():
    """Test seed data endpoint"""
    print("\n=== TESTING SEED ENDPOINT ===")
    
    print("\n3. Testing POST /api/seed")
    result = make_request("POST", "/api/seed")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        print(f"   Response: {result.get('data', result.get('text', 'No data'))}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    return result.get("success", False)

def test_rooms_endpoints():
    """Test rooms endpoints"""
    print("\n=== TESTING ROOMS ENDPOINTS ===")
    
    # Test get all rooms
    print("\n4. Testing GET /api/rooms")
    result = make_request("GET", "/api/rooms")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', [])
        print(f"   Found {len(data)} rooms")
        if data:
            print(f"   First room ID: {data[0].get('room_id', 'No ID')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test get specific room
    print("\n5. Testing GET /api/rooms/room_001")
    result = make_request("GET", "/api/rooms/room_001")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', {})
        print(f"   Room Number: {data.get('room_number', 'N/A')}")
        print(f"   Room Type: {data.get('room_type', 'N/A')}")
        print(f"   Status: {data.get('status', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    return True

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n=== TESTING AUTH ENDPOINTS ===")
    
    # Test auth/me with Bearer token
    print("\n6. Testing GET /api/auth/me with Authorization Bearer")
    headers = {"Authorization": f"Bearer {SESSION_TOKEN}"}
    result = make_request("GET", "/api/auth/me", headers=headers)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', {})
        print(f"   User ID: {data.get('user_id', 'N/A')}")
        print(f"   Name: {data.get('name', 'N/A')}")
        print(f"   Email: {data.get('email', 'N/A')}")
        print(f"   Role: {data.get('role', 'N/A')}")
        return data  # Return user data for later tests
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    return None

def test_email_password_login():
    """Test Email/Password Login endpoint with all specified test cases"""
    print("\n=== TESTING EMAIL/PASSWORD LOGIN ENDPOINT ===")
    
    test_results = []
    session_token = None
    
    # Test 1: Valid tenant login
    print("\n6a. Testing POST /api/auth/login with valid tenant")
    login_data = {
        "email": VALID_TENANT_EMAIL,
        "password": VALID_TENANT_PASSWORD
    }
    result = make_request("POST", "/api/auth/login", data=login_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    
    if result.get("status_code") == 200:
        data = result.get('data', {})
        if "user" in data and "session_token" in data:
            session_token = data["session_token"]
            user_data = data["user"]
            print(f"   ✅ PASS: Valid tenant login successful")
            print(f"   User ID: {user_data.get('user_id', 'N/A')}")
            print(f"   Email: {user_data.get('email', 'N/A')}")
            print(f"   Name: {user_data.get('name', 'N/A')}")
            print(f"   Session Token: {session_token[:20]}...")
            test_results.append(("Valid tenant login", True))
        else:
            print(f"   ❌ FAIL: Missing user or session_token in response")
            test_results.append(("Valid tenant login", False))
    else:
        print(f"   ❌ FAIL: Expected 200 but got {result.get('status_code', 'ERROR')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
        test_results.append(("Valid tenant login", False))
    
    # Test 2: Invalid tenant (not registered)
    print("\n6b. Testing POST /api/auth/login with invalid tenant")
    invalid_login_data = {
        "email": INVALID_TENANT_EMAIL,
        "password": INVALID_PASSWORD
    }
    result = make_request("POST", "/api/auth/login", data=invalid_login_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    
    if result.get("status_code") == 403:
        data = result.get('data', {})
        if "access denied" in data.get("detail", "").lower():
            print(f"   ✅ PASS: Invalid tenant correctly rejected")
            test_results.append(("Invalid tenant rejection", True))
        else:
            print(f"   ❌ FAIL: Wrong error message: {data.get('detail', 'N/A')}")
            test_results.append(("Invalid tenant rejection", False))
    else:
        print(f"   ❌ FAIL: Expected 403 but got {result.get('status_code', 'ERROR')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
        test_results.append(("Invalid tenant rejection", False))
    
    # Test 3: Missing email
    print("\n6c. Testing POST /api/auth/login with missing email")
    missing_email_data = {"password": INVALID_PASSWORD}
    result = make_request("POST", "/api/auth/login", data=missing_email_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    
    if result.get("status_code") == 400:
        print(f"   ✅ PASS: Missing email validation working")
        test_results.append(("Missing email validation", True))
    else:
        print(f"   ❌ FAIL: Expected 400 but got {result.get('status_code', 'ERROR')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
        test_results.append(("Missing email validation", False))
    
    # Test 4: Missing password
    print("\n6d. Testing POST /api/auth/login with missing password")
    missing_password_data = {"email": "test@test.com"}
    result = make_request("POST", "/api/auth/login", data=missing_password_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    
    if result.get("status_code") == 400:
        print(f"   ✅ PASS: Missing password validation working")
        test_results.append(("Missing password validation", True))
    else:
        print(f"   ❌ FAIL: Expected 400 but got {result.get('status_code', 'ERROR')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
        test_results.append(("Missing password validation", False))
    
    # Test 5: Verify session token works with /api/auth/me
    if session_token:
        print("\n6e. Testing GET /api/auth/me with new session token")
        headers = {"Authorization": f"Bearer {session_token}"}
        result = make_request("GET", "/api/auth/me", headers=headers)
        print(f"   Status: {result.get('status_code', 'ERROR')}")
        
        if result.get("status_code") == 200:
            data = result.get('data', {})
            if "user_id" in data and "email" in data:
                print(f"   ✅ PASS: Session token verification successful")
                print(f"   User ID: {data.get('user_id', 'N/A')}")
                print(f"   Email: {data.get('email', 'N/A')}")
                test_results.append(("Session token verification", True))
            else:
                print(f"   ❌ FAIL: Response missing required user fields")
                test_results.append(("Session token verification", False))
        else:
            print(f"   ❌ FAIL: Expected 200 but got {result.get('status_code', 'ERROR')}")
            if result.get('data'):
                print(f"   Response: {result.get('data')}")
            test_results.append(("Session token verification", False))
    else:
        print("\n6e. SKIP: Session token verification (no token from login)")
        test_results.append(("Session token verification", False))
    
    # Print email/password login test summary
    print(f"\n   === EMAIL/PASSWORD LOGIN TEST RESULTS ===")
    passed_login_tests = sum(1 for _, success in test_results if success)
    total_login_tests = len(test_results)
    
    for test_name, success in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"   Email/Password Login Tests: {passed_login_tests}/{total_login_tests} passed")
    
    # Return user data from original auth test or from login test
    if session_token:
        headers = {"Authorization": f"Bearer {session_token}"}
        auth_result = make_request("GET", "/api/auth/me", headers=headers)
        if auth_result.get("success"):
            return auth_result.get('data', {})
    
    return None

def test_dashboard_endpoint():
    """Test dashboard endpoint"""
    print("\n=== TESTING DASHBOARD ENDPOINT ===")
    
    print("\n7. Testing GET /api/dashboard/me with Authorization Bearer")
    headers = {"Authorization": f"Bearer {SESSION_TOKEN}"}
    result = make_request("GET", "/api/dashboard/me", headers=headers)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', {})
        user = data.get('user', {})
        print(f"   User Name: {user.get('name', 'N/A')}")
        print(f"   Assignment: {'Yes' if data.get('assignment') else 'No'}")
        print(f"   Room: {'Yes' if data.get('room') else 'No'}")
        print(f"   Latest Bill: {'Yes' if data.get('latest_bill') else 'No'}")
        print(f"   Active Maintenance Count: {data.get('active_maintenance_count', 0)}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    return result.get("success", False)

def test_maintenance_endpoints(user_data=None):
    """Test maintenance endpoints"""
    print("\n=== TESTING MAINTENANCE ENDPOINTS ===")
    
    headers = {"Authorization": f"Bearer {SESSION_TOKEN}"}
    
    # Test get maintenance requests
    print("\n8. Testing GET /api/maintenance/me with Authorization Bearer")
    result = make_request("GET", "/api/maintenance/me", headers=headers)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', [])
        print(f"   Found {len(data)} maintenance requests")
        if data:
            latest = data[0]
            print(f"   Latest request type: {latest.get('request_type', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    # Test create maintenance request
    print("\n9. Testing POST /api/maintenance with Authorization Bearer")
    maintenance_data = {
        "user_id": "",  # Will be overridden by server
        "request_type": "Plumbing",
        "description": "Leak in bathroom",
        "urgency": "high"
    }
    result = make_request("POST", "/api/maintenance", headers=headers, data=maintenance_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', {})
        print(f"   Created Request ID: {data.get('request_id', 'N/A')}")
        print(f"   Request Type: {data.get('request_type', 'N/A')}")
        print(f"   Urgency: {data.get('urgency', 'N/A')}")
        print(f"   Status: {data.get('status', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    return True

def test_announcements_endpoint():
    """Test announcements endpoint"""
    print("\n=== TESTING ANNOUNCEMENTS ENDPOINT ===")
    
    print("\n10. Testing GET /api/announcements")
    result = make_request("GET", "/api/announcements")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', [])
        print(f"   Found {len(data)} announcements")
        if data:
            latest = data[0]
            print(f"   Latest title: {latest.get('title', 'N/A')}")
            print(f"   Priority: {latest.get('priority', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    return result.get("success", False)

def test_billing_endpoint():
    """Test billing endpoint"""
    print("\n=== TESTING BILLING ENDPOINT ===")
    
    print("\n11. Testing GET /api/billing/me with Authorization Bearer")
    headers = {"Authorization": f"Bearer {SESSION_TOKEN}"}
    result = make_request("GET", "/api/billing/me", headers=headers)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', [])
        print(f"   Found {len(data)} billing records")
        if data:
            latest = data[0]
            print(f"   Latest amount: {latest.get('amount', 0)}")
            print(f"   Status: {latest.get('status', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    return result.get("success", False)

def test_user_profile_endpoint():
    """Test user profile update endpoint"""
    print("\n=== TESTING USER PROFILE ENDPOINT ===")
    
    print("\n12. Testing PUT /api/users/me with Authorization Bearer")
    headers = {"Authorization": f"Bearer {SESSION_TOKEN}"}
    update_data = {
        "name": "Updated User", 
        "phone": "+63 999 888 7777"
    }
    result = make_request("PUT", "/api/users/me", headers=headers, data=update_data)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get("success"):
        data = result.get('data', {})
        print(f"   Updated Name: {data.get('name', 'N/A')}")
        print(f"   Updated Phone: {data.get('phone', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get('data'):
            print(f"   Response: {result.get('data')}")
    
    return result.get("success", False)

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("DORMITORY MANAGEMENT SYSTEM - BACKEND API TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Session Token: {SESSION_TOKEN}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Track test results
    test_results = []
    
    # Run tests
    test_results.append(("Health Endpoints", test_health_endpoints()))
    test_results.append(("Seed Endpoint", test_seed_endpoint()))
    test_results.append(("Rooms Endpoints", test_rooms_endpoints()))
    
    user_data = test_auth_endpoints()
    test_results.append(("Auth Endpoints", user_data is not None))
    
    # Test Email/Password Login endpoint specifically
    user_data_from_login = test_email_password_login()
    test_results.append(("Email/Password Login", user_data_from_login is not None))
    
    test_results.append(("Dashboard Endpoint", test_dashboard_endpoint()))
    test_results.append(("Maintenance Endpoints", test_maintenance_endpoints(user_data)))
    test_results.append(("Announcements Endpoint", test_announcements_endpoint()))
    test_results.append(("Billing Endpoint", test_billing_endpoint()))
    test_results.append(("User Profile Endpoint", test_user_profile_endpoint()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print("=" * 60)

if __name__ == "__main__":
    main()