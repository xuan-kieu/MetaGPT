const db = require('../config/database');

const Game = {
    findAll: async () => {
        const [rows] = await db.execute('SELECT * FROM games');
        return rows;
    },
    
    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM games WHERE id = ?', [id]);
        return rows[0];
    },
    
    create: async (data) => {
        const [result] = await db.execute('INSERT INTO games SET ?', [data]);
        return result.insertId;
    },
    
    update: async (id, data) => {
        await db.execute('UPDATE games SET ? WHERE id = ?', [data, id]);
    },
    
    delete: async (id) => {
        await db.execute('DELETE FROM games WHERE id = ?', [id]);
    }
};

module.exports = Game;