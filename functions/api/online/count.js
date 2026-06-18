// /functions/api/online/count.js

export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB;
    
    try {
        // List all active online users with the prefix
        const list = await db.list({ prefix: "online_user_" });
        
        // At least the current player is online, so minimum count is 1
        const count = Math.max(1, list.keys.length);
        
        return new Response(JSON.stringify({ count }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
