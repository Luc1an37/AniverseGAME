// /functions/api/online/ping.js

export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { userId } = body;
        
        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId" }), { 
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }
        
        const key = `online_user_${userId}`;
        // Записываем пинг игрока с автоматическим удалением через 60 секунд!
        await db.put(key, Date.now().toString(), { expirationTtl: 60 });
        
        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
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
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
