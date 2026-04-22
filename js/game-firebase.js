// ===== Firebase ランキング =====
// Firebase未設定時はlocalStorageにフォールバック
const GameRanking = (function () {
    let db = null;
    const COLLECTION = 'rankings';
    const LOCAL_KEY = 'game_rankings';

    function init() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.firestore();
        }
    }

    async function submitScore(name, score, difficulty) {
        const entry = {
            name: name || 'AAA',
            score: score,
            difficulty: difficulty || 'normal',
            date: new Date().toISOString()
        };

        // 常にlocalStorageにもミラー保存（Firebase読込失敗時のフォールバック整合性確保）
        try {
            const rankings = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            rankings.push(entry);
            rankings.sort((a, b) => b.score - a.score);
            if (rankings.length > 200) rankings.length = 200;
            localStorage.setItem(LOCAL_KEY, JSON.stringify(rankings));
        } catch (e) { /* localStorage不可でも続行 */ }

        if (db) {
            try {
                await db.collection(COLLECTION).add({
                    name: entry.name,
                    score: entry.score,
                    difficulty: entry.difficulty,
                    date: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            } catch (e) {
                console.error('[Ranking] Firebase write failed. Score kept in localStorage only.', e);
            }
        } else {
            console.warn('[Ranking] Firebase not initialized. Score kept in localStorage only.');
        }
        return true;
    }

    async function fetchRanking(difficulty, limit) {
        limit = limit || 10;
        difficulty = difficulty || 'normal';

        // localStorage側のデータ（常に取得可能、送信直後の自スコアを含む）
        let local = [];
        try {
            const rankings = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            local = rankings.filter(r => r.difficulty === difficulty);
        } catch (e) { /* ignore */ }

        let remote = null;
        if (db) {
            try {
                // 複合インデックス(difficulty+score)を要求しないよう where のみで取得し、
                // 並び替え・件数制限はクライアント側で行う
                const snap = await db.collection(COLLECTION)
                    .where('difficulty', '==', difficulty)
                    .get();
                remote = snap.docs
                    .map(function (doc) {
                        var d = doc.data();
                        return { name: d.name, score: d.score };
                    })
                    .sort(function (a, b) { return b.score - a.score; })
                    .slice(0, limit * 2);
                console.log('[Ranking] Firebase read OK:', difficulty, 'count=', remote.length);
            } catch (e) {
                console.error('[Ranking] Firebase read failed. Falling back to localStorage.', e);
            }
        } else {
            console.warn('[Ranking] Firebase not initialized. Using localStorage only.');
        }

        // Firebase成功時はremote + local(直近送信の保険) を name+score で重複除去してマージ
        const merged = [];
        const seen = Object.create(null);
        const push = (r) => {
            const key = (r.name || '') + '|' + r.score;
            if (seen[key]) return;
            seen[key] = true;
            merged.push({ name: r.name, score: r.score });
        };
        (remote || []).forEach(push);
        local.forEach(push);
        merged.sort((a, b) => b.score - a.score);
        return merged.slice(0, limit);
    }

    return { init: init, submitScore: submitScore, fetchRanking: fetchRanking };
})();
