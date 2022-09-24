const express = require("express")
const {tmpdir} = require("os")
const path = require("path");
const app = express()
const {spawn} = require('child_process');
const archiver = require('archiver');
const fs = require("fs");
let {
    DB_URI,
    DB_NAME,
    GCS_KEY,
    GCS_BUCKET,
    GCS_PREFIX
} = process.env
const {Storage} = require('@google-cloud/storage');
const GCS = new Storage({
    keyFilename: path.join(__dirname,"credentials",GCS_KEY)
});

app.get("/", (req, res) => {
    if((req.header("X-TOKEN") || (req.query && req.query.token)) === (process.env.SecretKey || "---secret---")){
        if(req.query && req.query.db_name){
            DB_NAME = req.query.db_name
        }
        const target = path.join(tmpdir(),"gcr-mongodump")
        const file = path.join(target,`dump.zip`)

        if(!fs.existsSync(target)){
            fs.mkdirSync(target)
        }else if(fs.existsSync(file)){
            fs.rmSync(file)
        }

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        const outputStream = fs.createWriteStream(file);
        archive.pipe(outputStream);
        archive.on('error', function(err) {
            throw err;
        });
        let opt = [
            "--uri",DB_URI
        ]
        let compressed = false
        if(DB_NAME){
            opt.push("--db")
            opt.push(DB_NAME)
            opt.push("--out")
            opt.push(target)
        }else{
            opt.push("--archive")
            opt.push(file)
            opt.push("--gzip")
            compressed = true
        }
        console.log(target, compressed, opt)
        const child = spawn("mongodump", opt)
        let errMessage = ""
        child.stderr.on("data", (chunk) => {
            errMessage += chunk
        })
        child.stderr.on("end", () => {
            console.log("err",errMessage)
        })
        child.on("close", (code) => {
            if(!compressed){
                const output = path.join(target, DB_NAME)

                if(fs.existsSync(output)){
                    archive.directory(output, DB_NAME)

                    archive.finalize().then(async () => {
                        const date = new Date()
                        const bucket = GCS.bucket(GCS_BUCKET)
                        const format = () => {
                            let x = date.getFullYear().toString()
                            x += date.getMonth().toString().padStart(2,"0")
                            x += date.getDate().toString().padStart(2,"0")
                            return x
                        }
                        await bucket.upload(file, {
                            destination: path.join(GCS_PREFIX, format()+"-"+DB_NAME)
                        })
                        res.send("it works")
                    });

                }else{
                    res.status(500).send("it did not working : "+code)
                }
            }else{
                const date = new Date()
                const bucket = GCS.bucket(GCS_BUCKET)
                const format = () => {
                    let x = date.getFullYear().toString()
                    x += date.getMonth().toString().padStart(2,"0")
                    x += date.getDate().toString().padStart(2,"0")
                    return x
                }
                bucket.upload(file, {
                    destination: path.join(GCS_PREFIX, format()+".zip")
                }).then(() => {
                    res.send("it works (2)")
                })

            }

        })
    }
    else{
        res.send("it works")
    }
})

const PORT = process.env.PORT || 8080
app.listen(PORT,"0.0.0.0", () => {
    console.log(`listen to 0.0.0.0:${PORT}`)
})