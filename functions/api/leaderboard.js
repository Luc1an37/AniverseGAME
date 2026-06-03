// /functions/api/leaderboard.js

// 1. GET-запрос: Отдает ТОП-15 игроков с двумя параметрами
export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB;
    
    try {
        const list = await db.list();
        const records = [];
        
        for (const key of list.keys) {
            try {
                const rawData = await db.get(key.name);
                if (rawData) {
                    records.push(JSON.parse(rawData));
                }
            } catch (parseError) {
                // ЗАЩИТА: Если запись одного игрока повреждена, пропускаем её, а не ломаем весь топ!
                continue;
            }
        }
        
        // Сортируем игроков по убыванию просмотров рекламы (первичный ключ), а затем по золоту (вторичный ключ)
        records.sort((a, b) => {
            const adsA = parseInt(a.adsCount) || 0;
            const adsB = parseInt(b.adsCount) || 0;
            if (adsB !== adsA) {
                return adsB - adsA;
            }
            const goldA = parseInt(a.score) || 0;
            const goldB = parseInt(b.score) || 0;
            return goldB - goldA;
        });
        
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
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
        });
    }
}

// 2. POST-запрос: Записывает золото (score) и число просмотров рекламы (adsCount)
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
            try {
                const existingData = JSON.parse(existingDataRaw);
                // Обновляем запись, если золото выросло или число просмотров рекламы увеличилось
                if (existingData.score >= parseInt(score) && existingData.adsCount >= parseInt(adsCount || 0)) {
                    shouldUpdate = false;
                }
            } catch (e) {
                shouldUpdate = true;
            }
        }
        
        if (shouldUpdate) {
            const playerData = {
                userId,
                name: firstName || "Игрок",
                username: username || "@player",
                score: parseInt(score),
                adsCount: parseInt(adsCount || 0),
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
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
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
