// /functions/api/broadcast.js

export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { password, text, botToken } = body;
        
        // ------------------ ЗАЩИТА: ПАРОЛЬ АДМИНИСТРАТОРА ------------------
        // Придумайте и вставьте сюда любой сложный пароль между кавычек!
        const ADMIN_PASSWORD = "aniverse_secret_2026"; 
        // -------------------------------------------------------------------
        
        if (password !== ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: "Неверный пароль админа!" }), { 
                status: 403,
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }
        
        if (!text || !botToken) {
            return new Response(JSON.stringify({ error: "Missing text or botToken" }), { 
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }
        
        // Получаем всех реальных игроков из вашей базы данных KV
        const list = await db.list();
        const userIds = [];
        
        for (const key of list.keys) {
            const rawData = await db.get(key.name);
            if (rawData) {
                const player = JSON.parse(rawData);
                if (player.userId) {
                    userIds.push(player.userId);
                }
            }
        }
        
        if (userIds.length === 0) {
            return new Response(JSON.stringify({ success: true, sent: 0, blocked: 0 }), {
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }
        
        let successCount = 0;
        let blockedCount = 0;
        
        // Кнопка нативного быстрого запуска игры под сообщением
        const keyboard = {
            inline_keyboard: [[
                {
                    text: "🎮 Запустить Aniverse GAME",
                    web_app: { url: "https://luc1an37.github.io/AniverseGAME/" }
                }
            ]]
        };
        
        // Запускаем мгновенный серверный цикл отправки через API Telegram
        for (const userId of userIds) {
            const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            
            try {
                const response = await fetch(tgUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: userId,
                        text: text,
                        parse_mode: "Markdown",
                        reply_markup: keyboard
                    })
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    blockedCount++;
                }
            } catch (e) {
                blockedCount++;
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            sent: successCount,
            blocked: blockedCount
        }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
        
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}

// CORS заглушка
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
