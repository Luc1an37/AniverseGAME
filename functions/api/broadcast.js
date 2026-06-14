// /functions/api/broadcast.js

export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { password, botToken, text } = body;
        
        // 1. Проверка пароля администратора (читается из переменных окружения Cloudflare или ставится дефолт)
        const expectedPassword = context.env.ADMIN_PASSWORD || "admin123"; 
        if (password !== expectedPassword) {
            return new Response(JSON.stringify({ error: "Invalid admin password" }), { 
                status: 403,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                }
            });
        }
        
        if (!botToken || !text) {
            return new Response(JSON.stringify({ error: "Missing params" }), { 
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                }
            });
        }
        
        // 2. Получаем список всех активных игроков (с новым префиксом player_v2_)
        const list = await db.list({ prefix: "player_v2_" });
        const userIds = list.keys.map(key => key.name.split('_')[2]).filter(id => id && !isNaN(id));
        
        let sent = 0;
        let blocked = 0;
        
        // 3. Отправляем сообщения с прикрепленной официальной WebApp кнопкой запуска игры!
        for (const userId of userIds) {
            try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: userId,
                        text: text,
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [[
                                { 
                                    text: "🎮 Играть в Aniverse", 
                                    web_app: { url: "https://aniverse-game.ru/game" } 
                                }
                            ]]
                        }
                    })
                });
                const data = await res.json();
                if (data && data.ok) {
                    sent++;
                } else {
                    blocked++;
                }
            } catch (err) {
                blocked++;
            }
        }
        
        return new Response(JSON.stringify({ success: true, sent, blocked }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
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
