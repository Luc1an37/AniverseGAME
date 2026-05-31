// /functions/api/leaderboard.js

// 1. GET-запрос: Отдает ТОП-50 игроков для game.html
export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB; // Наша KV база данных
    
    try {
        const list = await db.list();
        const records = [];
        
        for (const key of list.keys) {
            const rawData = await db.get(key.name);
            if (rawData) {
                records.push(JSON.parse(rawData));
            }
        }
        
        // Сортируем игроков по убыванию зачищенного этажа Башни
        records.sort((a, b) => b.score - a.score);
        
        // Берем только топ-50 лучших результатов
        const top50 = records.slice(0, 50);
        
        return new Response(JSON.stringify({ leaderboard: top50 }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Разрешаем CORS-запросы от игры
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

// 2. POST-запрос: Записывает новый рекорд игрока при прохождении Башни
export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { userId, firstName, username, score } = body;
        
        if (!userId || score === undefined) {
            return new Response(JSON.stringify({ error: "Missing params" }), { 
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }
        
        const playerKey = `player_${userId}`;
        
        // Проверяем, есть ли уже этот игрок в базе
        const existingDataRaw = await db.get(playerKey);
        let shouldUpdate = true;
        
        if (existingDataRaw) {
            const existingData = JSON.parse(existingDataRaw);
            // Сохраняем результат только если новый рекорд БОЛЬШЕ старого
            if (existingData.score >= score) {
                shouldUpdate = false;
            }
        }
        
        if (shouldUpdate) {
            const playerData = {
                userId,
                name: firstName || "Игрок",
                username: username || "@player",
                score: parseInt(score),
                updatedAt: Date.now()
            };
            
            // Записываем в базу данных Cloudflare KV
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

// 3. OPTIONS-запрос: Необходим для предварительной проверки CORS браузерами
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
