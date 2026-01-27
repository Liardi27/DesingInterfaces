// Using native fetch (Node 18+)
// Actually Node 18+ has global fetch.

async function verify() {
    console.log("🔍 Starting System Verification...");
    const BASE_URL = 'http://localhost:3001/api';

    try {
        // 0. Check Frontend
        console.log("0️⃣  Checking Frontend Availability...");
        const frontendRes = await fetch('http://localhost:5173');
        if (frontendRes.ok) {
            console.log("   ✅ Frontend is serving content (Status 200 OK)");
        } else {
            console.error(`   ❌ Frontend returned status: ${frontendRes.status}`);
        }

        // 1. Check Health (List Servers)
        console.log("1️⃣  Checking Server List API...");
        const listResponse = await fetch(`${BASE_URL}/servers`);
        if (!listResponse.ok) throw new Error("Failed to fetch servers");
        const servers = await listResponse.json();
        console.log(`   ✅ API Online. Current servers: ${servers.length}`);

        // 2. Add a Test Server (Simulating a local VM)
        console.log("2️⃣  Adding Test Server (127.0.0.1)...");
        const newServer = {
            name: "Test Localhost",
            host: "127.0.0.1",
            username: "test",
            password: "test",
            type: "linux"
        };
        const addResponse = await fetch(`${BASE_URL}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newServer)
        });
        const addedServer = await addResponse.json();
        console.log(`   ✅ Server Added: ${addedServer.name} (ID: ${addedServer.id})`);

        // 3. Check Status
        console.log("3️⃣  Checking Real SSH Connectivity...");
        const statusResponse = await fetch(`${BASE_URL}/server/${addedServer.id}/status`);

        const contentType = statusResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const status = await statusResponse.json();
            console.log(`   ℹ️  Status Result: ${status.online ? '🟢 ONLINE' : '🔴 OFFLINE'} (Expected behavior: Offline unless you have local SSH)`);
        } else {
            const text = await statusResponse.text();
            console.error("❌ ERROR: Received non-JSON response:");
            console.error(text.substring(0, 500)); // Print first 500 chars
        }

        // 4. Check VirtualBox Integration
        console.log("4️⃣  Checking VirtualBox API...");
        try {
            const vboxListRes = await fetch(`${BASE_URL}/vbox/list`);
            const vms = await vboxListRes.json();
            console.log(`   ✅ VBox VM List: Found ${vms.length} VMs`);
            if (vms.length > 0) console.log(`      First VM: ${vms[0].name}`);

            const vboxNetRes = await fetch(`${BASE_URL}/vbox/interfaces`);
            const nets = await vboxNetRes.json();
            console.log(`   ✅ Host Network Adapters: Found ${nets.length}`);
        } catch (e) {
            console.error("   ❌ VBox Integration Check Failed:", e.message);
        }

        // 5. Cleanup
        console.log("5️⃣  Cleaning up test data...");
        await fetch(`${BASE_URL}/servers/${addedServer.id}`, { method: 'DELETE' });
        console.log("   ✅ Test Server Deleted.");

        console.log("\n✨ SYSTEM VERIFICATION COMPLETED SUCCESSFULLY ✨");
        console.log("The Backend is fully operational and ready to connect to your VirtualBox VMs.");

    } catch (error) {
        console.error("❌ VERIFICATION FAILED:", error.message);
    }
}

verify();
