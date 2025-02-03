const express = require("express");
const app = express();

const port = 4001;
const sqlite3  = require("sqlite3").verbose();

const db = new sqlite3.Database('D:/test/com.google.android.keep/databases/keep.db', (err) => {
    if(err){
        console.error(err)
    }else {
        console.log("Connected to database...")
    }
});

// Route to fetch structured data
app.get("/data", (req, res) => {

    const query = `
        SELECT 
            a.name, 
            t._id AS tree_entity_id, 
            t.title, 
            c.c0text, 
            an.data1 
        FROM account a
        LEFT JOIN tree_entity t ON a._id = t.account_id
        LEFT JOIN text_search_note_content_content c ON t._id = c.docid
        LEFT JOIN annotation an ON c.docid = an.tree_entity_id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching data:", err);
            res.status(500).json({ error: "Database error" });
            return;
        }

        let structuredData = {};

        rows.forEach(row => {
            if (!structuredData[row.name]) {
                structuredData[row.name] = [];
            }

            let treeEntity = structuredData[row.name].find(te => te.id === row.tree_entity_id);
            if (!treeEntity) {
                treeEntity = {
                    id: row.tree_entity_id,
                    title: row.title,
                    content: []
                };
                structuredData[row.name].push(treeEntity);
            }

            let content = treeEntity.content.find(cc => cc.text === row.text);
            if (!content) {
                content = {
                    text: row.text,
                    annotation: []
                };
                treeEntity.content.push(content);
            }

            if (row.data1) {
                content.annotation.push({ data1: row.data1 });
            }
        });

        res.json(structuredData);
    });
});


app.listen(port,() => {
    console.log(`http://localhost:${port}`)
})