// /functions/api/anime.js

export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB;
    
    try {
        const raw = await db.get("aniverse_anime_db");
        let animeList;
        
        if (raw) {
            animeList = JSON.parse(raw);
        } else {
            // Default 12 anime cards if not initialized in KV yet
            animeList = [
                { id: '1', title: 'Магическая битва 2 (Трейлер)', year: 2023, genre: 'Экшен, Сёнен, Фэнтези', rating: '9.6', poster: 'https://image.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/thumbnail.webp', description: 'Второй сезон Магической битвы, рассказывающий о трагических событиях в Сибуе и прошлом Сатору Годзё. Нажмите, чтобы запустить флагманский анимированный трейлер в нашем премиум-плеере!', kinoboxId: '51009', videoUrl: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4' },
                { id: '2', title: 'Ван-Пис', year: 1999, genre: 'Приключения, Комедия, Сёнен', rating: '9.6', poster: 'https://shikimori.one/system/animes/original/21.jpg', description: 'Манки Д. Луффи отправляется в плавание, чтобы собрать команду и найти легендарное сокровище Ван-Пис.', kinoboxId: '21' },
                { id: '3', title: 'Блич', year: 2004, genre: 'Экшен, Сёнен, Мистика', rating: '9.5', poster: 'https://shikimori.one/system/animes/original/269.jpg', description: 'Ичего Куросаки случайно получает силу Синигами и вступает в борьбу со злыми духами — Пустыми.', kinoboxId: '269' },
                { id: '4', title: 'Монолог фармацевта', year: 2023, genre: 'Драма, Детектив, Исторический', rating: '9.8', poster: 'https://shikimori.one/system/animes/original/54492.jpg', description: 'Маомао, похищенная и проданная в императорский дворец, использует свои знания фармацевтики, чтобы расследовать интриги.', kinoboxId: '54492' },
                { id: '5', title: 'Чёрный клевер', year: 2017, genre: 'Сёнен, Экшен, Фэнтези', rating: '9.6', poster: 'https://shikimori.one/system/animes/original/34572.jpg', description: 'Аста и Юно, два сироты в мире магии, соревнуются за звание Короля Магов.', kinoboxId: '34572' },
                { id: '6', title: 'Магическая битва 1', year: 2020, genre: 'Экшен, Сёнен, Мистика', rating: '9.5', poster: 'https://shikimori.one/system/animes/original/40748.jpg', description: 'Итадори Юдзи поглощает палец могущественного проклятия Сукуны и вступает в мир шаманов.', kinoboxId: '40748' },
                { id: '7', title: 'Истребитель демонов', year: 2019, genre: 'Экшен, Сёнен, Исторический', rating: '9.5', poster: 'https://shikimori.one/system/animes/original/38000.jpg', description: 'Тандзиро Камадо становится истребителем демонов, чтобы спасти свою сестру Нэдзуко, обращённую в демона.', kinoboxId: '38000' },
                { id: '8', title: 'Атака титанов 4', year: 2020, genre: 'Экшен, Драма, Фэнтези, Сёнен', rating: '9.9', poster: 'https://shikimori.one/system/animes/original/40028.jpg', description: 'Финальный сезон противостояния человечества и титанов, раскрывающий зловещие тайны мира за стенами.', kinoboxId: '40028' },
                { id: '9', title: 'Наруто: Ураганные хроники', year: 2007, genre: 'Экшен, Комедия, Сёнен', rating: '9.7', poster: 'https://shikimori.one/system/animes/original/1735.jpg', description: 'Повзрослевший Наруто Удзумаки возвращается в Деревню Скрытого Листа после долгих тренировок с Джирайей.', kinoboxId: '1735' },
                { id: '10', title: 'Человек-бензопила', year: 2022, genre: 'Экшен, Сёнен, Драма', rating: '9.6', poster: 'https://shikimori.one/system/animes/original/44511.jpg', description: 'Дэндзи, бедный парень, сливается со своим питомцем-демоном Почитой и становится Человеком-бензопилой.', kinoboxId: '44511' },
                { id: '11', title: 'Поднятие уровня в одиночку', year: 2024, genre: 'Экшен, Приключения, Фэнтези', rating: '9.7', poster: 'https://shikimori.one/system/animes/original/52299.jpg', description: 'Слабейший охотник человечества Сон Джин-у получает уникальную возможность прокачивать свои силы.', kinoboxId: '52299' },
                { id: '12', title: 'Кагуя: В любви как на войне', year: 2019, genre: 'Комедия, Романтика, Школа', rating: '9.5', poster: 'https://shikimori.one/system/animes/original/37999.jpg', description: 'Два гения студенческого совета ведут изощрённую психологическую войну, чтобы заставить друг друга признаться в любви первым.', kinoboxId: '37999' }
            ];
        }
        
        return new Response(JSON.stringify({ anime: animeList }), {
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

export async function onRequestPost(context) {
    const db = context.env.LEADERBOARD_DB;
    const request = context.request;
    
    try {
        const body = await request.json();
        const { password, anime } = body;
        
        // Admin password validation (matches broadcasting)
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
        
        if (!anime || !Array.isArray(anime)) {
            return new Response(JSON.stringify({ error: "Missing anime array" }), { 
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                }
            });
        }
        
        // Save the updated anime database permanently inside Cloudflare KV!
        await db.put("aniverse_anime_db", JSON.stringify(anime));
        
        return new Response(JSON.stringify({ success: true }), {
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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
