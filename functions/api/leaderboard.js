// /functions/api/leaderboard.js

// 1. GET-запрос: Отдает ТОП-15 игроков с двумя параметрами
export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB;
    
    try {
        const list = await db.list();
        const records = [];
        
        for (const key of list.keys) {
            const rawData = await db.get(key.name);
            if (rawData) {
                records.push(JSON.parse(rawData));
            }
        }
        
        // Сортируем игроков по убыванию общего золота (score)
        records.sort((a, b) => b.score - a.score);
        
        // Берем ТОП-15 лучших результатов
        const top15 = records.slice(0, 15);
        
        return new Response(JSON.stringify({ leaderboard: top15 }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}

// 2. POST-запрос: Записывает золото и число просмотров рекламы
export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { userId, firstName, username, score, adsCount } = body;
        
        if (!userId || score === undefined) {
            return new Response(JSON.stringify({ error: "Missing params" }), { 
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }
        
        const playerKey = `player_${userId}`;
        const existingDataRaw = await db.get(playerKey);
        let shouldUpdate = true;
        
        if (existingDataRaw) {
            const existingData = JSON.parse(existingDataRaw);
            // Обновляем запись, если золото выросло или число просмотров рекламы изменилось
            if (existingData.score >= score && existingData.adsCount >= (adsCount || 0)) {
                shouldUpdate = false;
            }
        }
        
        if (shouldUpdate) {
            const playerData = {
                userId,
                name: firstName || "Игрок",
                username: username || "@player",
                score: parseInt(score),
                adsCount: parseInt(adsCount || 0), // <--- Записываем число просмотров рекламы!
                updatedAt: Date.now()
            };
            await db.put(playerKey, JSON.stringify(playerData));
        }
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}

// 3. OPTIONS-запрос для CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
