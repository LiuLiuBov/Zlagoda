const fs = require('fs')
const path = require('path')

class Category {
    constructor(catnumber,catname){
        this.catname = catname
        this.catnumber = catnumber
    }

    toJSON(){
        return {
            catname:this.catname,
            catnumber:this.catnumber
        }
    }

    async save(){
        const categories = await Category.getAll()
        categories.push(this.toJSON())
        console.log(categories)

        return new Promise((resolve, reject) => {
        fs.writeFile(
            path.join(__dirname,'../data/categories.json'),
            JSON.stringify(categories),
            (err)=> {
                if(err) reject(err)
                resolve()
            }
        )})
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            fs.readFile(
                path.join(__dirname, '../data/categories.json'),
                'utf-8',
                (err, data) => {
                    if (err) reject(err)
                    resolve(JSON.parse(data))
                }
            )
        })

    }
}

module.exports = Category