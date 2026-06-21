// /functions/api/sync.js

export async function onRequestGet(context) {
    const db = context.env.LEADERBOARD_DB;
    const { searchParams } = new URL(context.request.url);
    const password = searchParams.get('password');
    
    // 1. Пароль администратора для безопасности
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

    try {
        // 2. Получаем текущую базу аниме из KV
        const rawCurrent = await db.get("aniverse_anime_db");
        let currentAnimeList = [];
        if (rawCurrent) {
            try {
                currentAnimeList = JSON.parse(rawCurrent);
            } catch (e) {
                currentAnimeList = [];
            }
        }

        // 3. Запрашиваем 12 самых популярных онгоингов (текущих релизов) с API Shikimori
        const response = await fetch("https://shikimori.one/api/animes?order=popularity&status=ongoing&limit=12", {
            headers: { "User-Agent": "AniVerse Multimedia Portal / 2.0" }
        });
        
        if (!response.ok) {
            throw new Error(`Shikimori API responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data)) {
            throw new Error("Invalid response data format from Shikimori");
        }

        let addedCount = 0;
        let mergedList = [...currentAnimeList];

        // 4. Парсим новые тайтлы и склеиваем их с существующей базой, избегая дубликатов
        for (const item of data) {
            const animeId = String(item.id);
            
            // Проверяем, есть ли уже аниме с таким ID в базе
            const exists = currentAnimeList.some(a => String(a.id) === animeId || String(a.kinoboxId) === animeId);
            if (exists) continue; // Пропускаем дубликаты

            // Парсим год выпуска
            let year = 2024;
            if (item.aired_on) {
                year = parseInt(item.aired_on.split('-')[0]) || 2024;
            }

            // Рендерим постер
            let posterUrl = 'https://via.placeholder.com/900x506/1a1a25/8A2BE2?text=ANIVERSE+Player';
            if (item.image && item.image.original) {
                posterUrl = item.image.original.startsWith('http') 
                    ? item.image.original 
                    : 'https://shikimori.one' + item.image.original;
            }

            const animeData = {
                id: animeId,
                title: item.russian || item.name || 'Популярное аниме',
                year: year,
                genre: 'Аниме, Онгоинг', // Будет дополнено при открытии через API или останется тегом
                rating: item.score || '9.5',
                poster: posterUrl,
                description: 'Популярный релиз сезона. Смотрите онлайн в Full HD качестве с помощью нашего премиального плеера!',
                kinoboxId: animeId,
                videoUrl: '' // Оставляем пустым для воспроизведения демо- MP4 или добавления ссылки вручную
            };

            mergedList.push(animeData);
            addedCount++;
        }

        // 5. Записываем обновленный список обратно в Cloudflare KV
        if (addedCount > 0) {
            await db.put("aniverse_anime_db", JSON.stringify(mergedList));
        }

        return new Response(JSON.stringify({ 
            success: true, 
            addedCount: addedCount, 
            totalCount: mergedList.length,
            message: `Синхронизация завершена успешно! Добавлено новых аниме: ${addedCount}.`
        }), {
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

export async function onRequestPost(context) {
    return onRequestGet(context);
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
