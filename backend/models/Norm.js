const db = require('../config/database');

const Norm = {
    findAll: async () => {
        const [rows] = await db.execute('SELECT * FROM norms');
        return rows;
    },
    
    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM norms WHERE id = ?', [id]);
        return rows[0];
    },
    
    create: async (data) => {
        const [result] = await db.execute('INSERT INTO norms SET ?', [data]);
        return result.insertId;
    },
    
    update: async (id, data) => {
        await db.execute('UPDATE norms SET ? WHERE id = ?', [data, id]);
    },
    
    delete: async (id) => {
        await db.execute('DELETE FROM norms WHERE id = ?', [id]);
    }
};

module.exports = Norm;