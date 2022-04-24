const http = require('http');
const fs = require('fs');
const https = require('https');
const request = require('request');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const router = express.Router({mergeParams: true});

router.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
router.use(bodyParser.json({limit: '50mb'}));

// GET http://localhost:8001/check
router.get('/check',
    // sanity check
    function(req, res, next){
        res.status(200);
		res.json();
		next();
    }
);

// GET http://localhost:8001/getDog
router.get('/getDog',
    async function(req, res, next){
        req.reply = {};
        req.reply.get_new_pic = process.env['GET_NEW_PIC'];
        next();
    },
    function(req, res, next){
        if (req.reply.get_new_pic === 'online'){
            https.get(process.env.DOG_URL, function(res){
                res.setEncoding("utf8");
                let body = "";
                res.on("data", function(data){
                    body += data;
                });
                res.on("end", function(){
                    // store the information in request
                    req.reply.image_url = JSON.parse(body).message
                    req.reply.status = JSON.parse(body).status
                    req.reply.code = res.statusCode
                    array = req.reply.image_url.split("/") // split the file path to get the file name and breed
                    req.reply.file_name = array.pop();
                    req.reply.breed = array.pop();
                    next();
                });
            });
        } else {
            next();
        }
    },
    async function(req, res, next){
        if (req.reply.get_new_pic === 'online') {
            // write latest breed to file as backup
            breed_info = JSON.stringify({"breed":req.reply.breed,"image_url":req.reply.image_url})
            fs.writeFile('./temp/dog.json',breed_info,function(err){
                if (err) {
                    console.error("Error saving file: ",err)
                    next(err)
                };
            })
            // update breed and image in env variable
            process.env.BREED = req.reply.breed
            process.env.IMAGE_URL = req.reply.image_url
            next();
        } else {
            try{
                // If we are not getting a new pic then read the stored info
                if(process.env.BREED && process.env.IMAGE_URL){
                    req.reply.breed = process.env.BREED
                    req.reply.image_url = process.env.IMAGE_URL
                } else {
                    // if env variables not set get breed from file
                    fs.readFile('./temp/dog.json',function(err,data){
                        if(err){console.error(err)};
                        try {
                            var parseFileData = JSON.parse(data);
                            req.reply.breed = parseFileData.breed;
                            req.reply.image_url = parseFileData.image_url;
                        } catch (error) {
                            console.error("Error getting breed from file: ",error)
                            next(error)
                        }
                    })
                }
            } catch (error) {
                console.error(error)
            }
            next();
        }
    },
    function(req, res, next){
        res.status(200);
        message = JSON.parse(JSON.stringify({"name":req.reply.breed,"image":req.reply.image_url}))
		res.json(message);
		next();
    }
);

// PUT http://localhost:8001/start
router.put('/start',
    // get record for frontend
    function(req, res, next) {
        try {
            process.env['GET_NEW_PIC']='online'
            req.reply = {"status":"success"};
            next();
        } catch (error) {
            console.error(error)
            req.reply = {"error":error};
            next();
        }
    },
    function(req, res, next){
        if (req.reply.status === "success") {
            res.status(200);
            res.json(req.reply);
            next();
        } else {
            res.status(500);
            res.json(req.reply);
            next();
        }
    }
);

// PUT http://localhost:8001/end
router.put('/stop',
    // get record for frontend
    function(req, res, next){
        try {
            process.env['GET_NEW_PIC']='offline'
            req.reply = {"status":"success"};
            next();
        } catch (error) {
            console.error(error)
            req.reply = {"error":error};
            next();
        }
    },
    function(req, res, next){
        if (req.reply.status === "success") {
            res.status(200);
            res.json(req.reply);
            next();
        } else {
            res.status(500);
            res.json(req.reply);
            next();
        }
    }
);

module.exports = router;
