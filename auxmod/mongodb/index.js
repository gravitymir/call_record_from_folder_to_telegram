const MongoClient = require('mongodb').MongoClient;
const Long = require('mongodb').Long;

module.exports = {
    url: 'mongodb://localhost:27017',
    db_name: "main",
    connect: async function connect(url){
        return await MongoClient.connect(url || this.url, {useNewUrlParser: true, useUnifiedTopology: true})
        .catch(err => console.log(err));
    },

    list_collections: async function list_collections({url, db_name}){
        const client = await this.connect(url);
        try {
            return await client.db(db_name || this.db_name).listCollections().toArray();
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    },

    find_one: async function find_one({url, db_name, collection, find, opt}){
        const client = await this.connect(url);
        try {
            return await client.db(db_name || this.db_name).collection(collection).findOne(find, opt);
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    },

    find: async function find({url, db_name, collection, find, opt}){
        const client = await this.connect(url);
        try {
            return await client.db(db_name || this.db_name).collection(collection).find(find, opt).toArray();
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    },

    update_one: async function update_one({url, db_name, collection, _id, update, opt}){
        const client = await this.connect(url);
        try {
            return await client.db(db_name || this.db_name).collection(collection).updateOne({_id: _id}, update, opt);
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    },

    delete_one: async function delete_one({url, db_name, collection, _id, opt}){
        const client = await this.connect(url);
        try {
            return await client.db(db_name || this.db_name).collection(collection).deleteOne({_id: _id}, opt);
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    }
}