// ========================================
// Browser Console Script
// Copy and paste this into your browser console
// while viewing the Dashboard
// ========================================

console.log("=".repeat(50));
console.log("BROWSER USER VERIFICATION");
console.log("=".repeat(50));

// Check localStorage
console.log("\n1. LocalStorage User Data:");
console.log("   user:", localStorage.getItem('user'));
console.log("   userId:", localStorage.getItem('userId'));

// Check if there's a session
console.log("\n2. Session Info:");
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
    if (key.includes('user') || key.includes('auth') || key.includes('supabase')) {
        console.log(`   ${key}:`, localStorage.getItem(key));
    }
});

// Make test API call
console.log("\n3. Testing API Call:");
const testUserId = localStorage.getItem('userId') || 'test-user';
console.log(`   Using userId: ${testUserId}`);

fetch(`/api/calendar/events?userId=${testUserId}&startDate=2026-02-01&endDate=2026-02-28`)
    .then(res => res.json())
    .then(data => {
        console.log(`   Calendar Events Found: ${data.length || 0}`);
        if (data.length > 0) {
            console.log("   Events:");
            data.forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.title || event.summary} - ${event.start_time}`);
            });
        }
    })
    .catch(err => console.error("   Error:", err));

fetch(`/api/analytics/${testUserId}?period=current_month`)
    .then(res => res.json())
    .then(data => {
        console.log("\n4. Analytics Response:");
        console.log(`   totalEvents: ${data.totalEvents}`);
        console.log(`   timeScheduled: ${data.timeScheduled}h`);
        console.log(`   completedEvents: ${data.completedEvents}`);
        console.log(`   productivity: ${data.productivity}%`);
    })
    .catch(err => console.error("   Error:", err));

console.log("\n" + "=".repeat(50));
console.log("Copy the userId shown above and use it in:");
console.log("- verify_database_queries.sql (replace YOUR_USER_ID)");
console.log("- Supabase dashboard to filter data");
console.log("=".repeat(50));
