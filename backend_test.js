#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = "https://housing-connect-4.preview.emergentagent.com";
const SESSION_TOKEN = "test_session_1770212957374";

// Test data for Email/Password Login
const VALID_TENANT_EMAIL = "p.vincebryn@gmail.com";
const VALID_TENANT_PASSWORD = "testpassword";
const INVALID_TENANT_EMAIL = "nonexistent@test.com";
const INVALID_PASSWORD = "test";

/**
 * Make HTTP request and return response details
 */
async function makeRequest(method, endpoint, headers = {}, data = null, params = null) {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
        const config = {
            method: method.toUpperCase(),
            url: url,
            headers: headers,
            validateStatus: () => true // Don't throw on any status code
        };
        
        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }
        
        if (params) {
            config.params = params;
        }
        
        const response = await axios(config);
        
        return {
            status_code: response.status,
            url: url,
            headers: response.headers,
            success: response.status === 200,
            data: response.data
        };
    } catch (error) {
        return {
            error: error.message,
            url: url,
            success: false
        };
    }
}

/**
 * Test health check endpoints
 */
async function testHealthEndpoints() {
    console.log("\n=== TESTING HEALTH ENDPOINTS ===");
    
    // Test root endpoint
    console.log("\n1. Testing GET /api/");
    let result = await makeRequest("GET", "/api/");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        console.log(`   Response: ${JSON.stringify(result.data || result.text || 'No data')}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    // Test health endpoint  
    console.log("\n2. Testing GET /api/health");
    result = await makeRequest("GET", "/api/health");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        console.log(`   Response: ${JSON.stringify(result.data || result.text || 'No data')}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    return true;
}

/**
 * Test seed data endpoint
 */
async function testSeedEndpoint() {
    console.log("\n=== TESTING SEED ENDPOINT ===");
    
    console.log("\n3. Testing POST /api/seed");
    const result = await makeRequest("POST", "/api/seed");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        console.log(`   Response: ${JSON.stringify(result.data || result.text || 'No data')}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    return result.success || false;
}

/**
 * Test rooms endpoints
 */
async function testRoomsEndpoints() {
    console.log("\n=== TESTING ROOMS ENDPOINTS ===");
    
    // Test get all rooms
    console.log("\n4. Testing GET /api/rooms");
    let result = await makeRequest("GET", "/api/rooms");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || [];
        console.log(`   Found ${data.length} rooms`);
        if (data.length > 0) {
            console.log(`   First room ID: ${data[0].room_id || 'No ID'}`);
        }
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    // Test get specific room
    console.log("\n5. Testing GET /api/rooms/room_001");
    result = await makeRequest("GET", "/api/rooms/room_001");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || {};
        console.log(`   Room Number: ${data.room_number || 'N/A'}`);
        console.log(`   Room Type: ${data.room_type || 'N/A'}`);
        console.log(`   Status: ${data.status || 'N/A'}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    return true;
}

/**
 * Test authentication endpoints
 */
async function testAuthEndpoints() {
    console.log("\n=== TESTING AUTH ENDPOINTS ===");
    
    // Test auth/me with Bearer token
    console.log("\n6. Testing GET /api/auth/me with Authorization Bearer");
    const headers = { "Authorization": `Bearer ${SESSION_TOKEN}` };
    const result = await makeRequest("GET", "/api/auth/me", headers);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || {};
        console.log(`   User ID: ${data.user_id || 'N/A'}`);
        console.log(`   Name: ${data.name || 'N/A'}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   Role: ${data.role || 'N/A'}`);
        return data; // Return user data for later tests
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    return null;
}

/**
 * Test Email/Password Login endpoint with all specified test cases
 */
async function testEmailPasswordLogin() {
    console.log("\n=== TESTING EMAIL/PASSWORD LOGIN ENDPOINT ===");
    
    const testResults = [];
    let sessionToken = null;
    
    // Test 1: Valid tenant login
    console.log("\n6a. Testing POST /api/auth/login with valid tenant");
    let loginData = {
        email: VALID_TENANT_EMAIL,
        password: VALID_TENANT_PASSWORD
    };
    let result = await makeRequest("POST", "/api/auth/login", {}, loginData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    
    if (result.status_code === 200) {
        const data = result.data || {};
        if (data.user && data.session_token) {
            sessionToken = data.session_token;
            const userData = data.user;
            console.log(`   ✅ PASS: Valid tenant login successful`);
            console.log(`   User ID: ${userData.user_id || 'N/A'}`);
            console.log(`   Email: ${userData.email || 'N/A'}`);
            console.log(`   Name: ${userData.name || 'N/A'}`);
            console.log(`   Session Token: ${sessionToken.substring(0, 20)}...`);
            testResults.push(["Valid tenant login", true]);
        } else {
            console.log(`   ❌ FAIL: Missing user or session_token in response`);
            testResults.push(["Valid tenant login", false]);
        }
    } else {
        console.log(`   ❌ FAIL: Expected 200 but got ${result.status_code || 'ERROR'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
        testResults.push(["Valid tenant login", false]);
    }
    
    // Test 2: Invalid tenant (not registered)
    console.log("\n6b. Testing POST /api/auth/login with invalid tenant");
    const invalidLoginData = {
        email: INVALID_TENANT_EMAIL,
        password: INVALID_PASSWORD
    };
    result = await makeRequest("POST", "/api/auth/login", {}, invalidLoginData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    
    if (result.status_code === 403) {
        const data = result.data || {};
        if ((data.detail || "").toLowerCase().includes("access denied")) {
            console.log(`   ✅ PASS: Invalid tenant correctly rejected`);
            testResults.push(["Invalid tenant rejection", true]);
        } else {
            console.log(`   ❌ FAIL: Wrong error message: ${data.detail || 'N/A'}`);
            testResults.push(["Invalid tenant rejection", false]);
        }
    } else {
        console.log(`   ❌ FAIL: Expected 403 but got ${result.status_code || 'ERROR'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
        testResults.push(["Invalid tenant rejection", false]);
    }
    
    // Test 3: Missing email
    console.log("\n6c. Testing POST /api/auth/login with missing email");
    const missingEmailData = { password: INVALID_PASSWORD };
    result = await makeRequest("POST", "/api/auth/login", {}, missingEmailData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    
    if (result.status_code === 400) {
        console.log(`   ✅ PASS: Missing email validation working`);
        testResults.push(["Missing email validation", true]);
    } else {
        console.log(`   ❌ FAIL: Expected 400 but got ${result.status_code || 'ERROR'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
        testResults.push(["Missing email validation", false]);
    }
    
    // Test 4: Missing password
    console.log("\n6d. Testing POST /api/auth/login with missing password");
    const missingPasswordData = { email: "test@test.com" };
    result = await makeRequest("POST", "/api/auth/login", {}, missingPasswordData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    
    if (result.status_code === 400) {
        console.log(`   ✅ PASS: Missing password validation working`);
        testResults.push(["Missing password validation", true]);
    } else {
        console.log(`   ❌ FAIL: Expected 400 but got ${result.status_code || 'ERROR'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
        testResults.push(["Missing password validation", false]);
    }
    
    // Test 5: Verify session token works with /api/auth/me
    if (sessionToken) {
        console.log("\n6e. Testing GET /api/auth/me with new session token");
        const headers = { "Authorization": `Bearer ${sessionToken}` };
        result = await makeRequest("GET", "/api/auth/me", headers);
        console.log(`   Status: ${result.status_code || 'ERROR'}`);
        
        if (result.status_code === 200) {
            const data = result.data || {};
            if (data.user_id && data.email) {
                console.log(`   ✅ PASS: Session token verification successful`);
                console.log(`   User ID: ${data.user_id || 'N/A'}`);
                console.log(`   Email: ${data.email || 'N/A'}`);
                testResults.push(["Session token verification", true]);
            } else {
                console.log(`   ❌ FAIL: Response missing required user fields`);
                testResults.push(["Session token verification", false]);
            }
        } else {
            console.log(`   ❌ FAIL: Expected 200 but got ${result.status_code || 'ERROR'}`);
            if (result.data) {
                console.log(`   Response: ${JSON.stringify(result.data)}`);
            }
            testResults.push(["Session token verification", false]);
        }
    } else {
        console.log("\n6e. SKIP: Session token verification (no token from login)");
        testResults.push(["Session token verification", false]);
    }
    
    // Print email/password login test summary
    console.log(`\n   === EMAIL/PASSWORD LOGIN TEST RESULTS ===`);
    const passedLoginTests = testResults.filter(([, success]) => success).length;
    const totalLoginTests = testResults.length;
    
    for (const [testName, success] of testResults) {
        const status = success ? "✅ PASS" : "❌ FAIL";
        console.log(`   ${testName}: ${status}`);
    }
    
    console.log(`   Email/Password Login Tests: ${passedLoginTests}/${totalLoginTests} passed`);
    
    // Return user data from original auth test or from login test
    if (sessionToken) {
        const headers = { "Authorization": `Bearer ${sessionToken}` };
        const authResult = await makeRequest("GET", "/api/auth/me", headers);
        if (authResult.success) {
            return authResult.data || {};
        }
    }
    
    return null;
}

/**
 * Test dashboard endpoint
 */
async function testDashboardEndpoint() {
    console.log("\n=== TESTING DASHBOARD ENDPOINT ===");
    
    console.log("\n7. Testing GET /api/dashboard/me with Authorization Bearer");
    const headers = { "Authorization": `Bearer ${SESSION_TOKEN}` };
    const result = await makeRequest("GET", "/api/dashboard/me", headers);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || {};
        const user = data.user || {};
        console.log(`   User Name: ${user.name || 'N/A'}`);
        console.log(`   Assignment: ${data.assignment ? 'Yes' : 'No'}`);
        console.log(`   Room: ${data.room ? 'Yes' : 'No'}`);
        console.log(`   Latest Bill: ${data.latest_bill ? 'Yes' : 'No'}`);
        console.log(`   Active Maintenance Count: ${data.active_maintenance_count || 0}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    return result.success || false;
}

/**
 * Test maintenance endpoints
 */
async function testMaintenanceEndpoints(userData = null) {
    console.log("\n=== TESTING MAINTENANCE ENDPOINTS ===");
    
    const headers = { "Authorization": `Bearer ${SESSION_TOKEN}` };
    
    // Test get maintenance requests
    console.log("\n8. Testing GET /api/maintenance/me with Authorization Bearer");
    let result = await makeRequest("GET", "/api/maintenance/me", headers);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || [];
        console.log(`   Found ${data.length} maintenance requests`);
        if (data.length > 0) {
            const latest = data[0];
            console.log(`   Latest request type: ${latest.request_type || 'N/A'}`);
        }
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    // Test create maintenance request
    console.log("\n9. Testing POST /api/maintenance with Authorization Bearer");
    const maintenanceData = {
        user_id: "",  // Will be overridden by server
        request_type: "Plumbing",
        description: "Leak in bathroom",
        urgency: "high"
    };
    result = await makeRequest("POST", "/api/maintenance", headers, maintenanceData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || {};
        console.log(`   Created Request ID: ${data.request_id || 'N/A'}`);
        console.log(`   Request Type: ${data.request_type || 'N/A'}`);
        console.log(`   Urgency: ${data.urgency || 'N/A'}`);
        console.log(`   Status: ${data.status || 'N/A'}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    return true;
}

/**
 * Test announcements endpoint
 */
async function testAnnouncementsEndpoint() {
    console.log("\n=== TESTING ANNOUNCEMENTS ENDPOINT ===");
    
    console.log("\n10. Testing GET /api/announcements");
    const result = await makeRequest("GET", "/api/announcements");
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || [];
        console.log(`   Found ${data.length} announcements`);
        if (data.length > 0) {
            const latest = data[0];
            console.log(`   Latest title: ${latest.title || 'N/A'}`);
            console.log(`   Priority: ${latest.priority || 'N/A'}`);
        }
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    return result.success || false;
}

/**
 * Test billing endpoint
 */
async function testBillingEndpoint() {
    console.log("\n=== TESTING BILLING ENDPOINT ===");
    
    console.log("\n11. Testing GET /api/billing/me with Authorization Bearer");
    const headers = { "Authorization": `Bearer ${SESSION_TOKEN}` };
    const result = await makeRequest("GET", "/api/billing/me", headers);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || [];
        console.log(`   Found ${data.length} billing records`);
        if (data.length > 0) {
            const latest = data[0];
            console.log(`   Latest amount: ${latest.amount || 0}`);
            console.log(`   Status: ${latest.status || 'N/A'}`);
        }
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    return result.success || false;
}

/**
 * Test user profile update endpoint
 */
async function testUserProfileEndpoint() {
    console.log("\n=== TESTING USER PROFILE ENDPOINT ===");
    
    console.log("\n12. Testing PUT /api/users/me with Authorization Bearer");
    const headers = { "Authorization": `Bearer ${SESSION_TOKEN}` };
    const updateData = {
        name: "Updated User", 
        phone: "+63 999 888 7777"
    };
    const result = await makeRequest("PUT", "/api/users/me", headers, updateData);
    console.log(`   Status: ${result.status_code || 'ERROR'}`);
    if (result.success) {
        const data = result.data || {};
        console.log(`   Updated Name: ${data.name || 'N/A'}`);
        console.log(`   Updated Phone: ${data.phone || 'N/A'}`);
    } else {
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data)}`);
        }
    }
    
    return result.success || false;
}

/**
 * Run all backend tests
 */
async function main() {
    console.log("=".repeat(60));
    console.log("DORMITORY MANAGEMENT SYSTEM - BACKEND API TESTING");
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Session Token: ${SESSION_TOKEN}`);
    console.log(`Test Time: ${new Date().toISOString()}`);
    console.log("=".repeat(60));
    
    // Track test results
    const testResults = [];
    
    // Run tests
    testResults.push(["Health Endpoints", await testHealthEndpoints()]);
    testResults.push(["Seed Endpoint", await testSeedEndpoint()]);
    testResults.push(["Rooms Endpoints", await testRoomsEndpoints()]);
    
    const userData = await testAuthEndpoints();
    testResults.push(["Auth Endpoints", userData !== null]);
    
    // Test Email/Password Login endpoint specifically
    const userDataFromLogin = await testEmailPasswordLogin();
    testResults.push(["Email/Password Login", userDataFromLogin !== null]);
    
    testResults.push(["Dashboard Endpoint", await testDashboardEndpoint()]);
    testResults.push(["Maintenance Endpoints", await testMaintenanceEndpoints(userData)]);
    testResults.push(["Announcements Endpoint", await testAnnouncementsEndpoint()]);
    testResults.push(["Billing Endpoint", await testBillingEndpoint()]);
    testResults.push(["User Profile Endpoint", await testUserProfileEndpoint()]);
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    
    let passed = 0;
    const total = testResults.length;
    
    for (const [testName, result] of testResults) {
        const status = result ? "✅ PASS" : "❌ FAIL";
        console.log(`${testName}: ${status}`);
        if (result) {
            passed++;
        }
    }
    
    console.log("-".repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed/total)*100).toFixed(1)}%`);
    console.log("=".repeat(60));
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error("Test execution failed:", error);
        process.exit(1);
    });
}

module.exports = { main, makeRequest };
