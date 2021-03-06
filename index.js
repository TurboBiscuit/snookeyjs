console.log("Starting Snookey JS v1.0")
var request = require("request")
var express = require("express")
var open = require('open');
var fs = require("fs")
var term = require("terminal-kit").terminal
var app = express()
var client_id = "ohXpoqrZYub1kg"
var response_type = "token"
var scope = "*"
var callback = "http://localhost:65010/callback"
var state = "SNOOKEY"
var request_url = `https://www.reddit.com/api/v1/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${callback}&scope=${scope}&state=${state}`
console.log("Starting Temporary Web Server on Port 65010")
app.listen(65010, () => {
    console.log("Temp Web Server Started")
    open(request_url)
    console.log("Opening Webpage")
})
app.get("/callback", (req, res) => {
    res.send(fs.readFileSync("callback.html", "utf8"))
})
app.get("/submittoken", (req, res) => {
    res.send("<script>setTimeout(function(){close()},5000)</script> You can close this page now")
    term("Got Access Token\n")
    var full_token = "Bearer " + req.query.access_token
    request("https://strapi.reddit.com/recommended_viewer_subreddits", (err1, response1, body1) => {
        var history = JSON.parse(body1).data

        term.white("Subreddit you want to broadcast to: ").inputField({
                history: history,
                autoComplete: history,
                autoCompleteHint: true
            },
            function (error, input) {
                var subreddit = input
                term.white("\nStream title: ").inputField(
                    function (error, input) {
                        var streamtitle = input
                        console.log("\nSending Data To Reddit")
                        request({
                            url: `https://strapi.reddit.com/r/${subreddit}/broadcasts?title=${streamtitle}`,
                            headers: {
                                'User-Agent': 'Project SnooKey/0.1',
                                'Authorization': full_token
                            },
                            method: "POST"
                        }, (error, response, body) => {
                            console.log("Response From Reddit")
                            if (response.statusCode == 200) {
                                var data = JSON.parse(body)
                                console.log("STREAM URL: rtmp://ingest.redd.it/inbound/")
                                console.log("\nSTREAM KEY: " + data.data.streamer_key)
                                console.log("\nYOU ARE LIVE: " + data.data.post.outboundLink.url)
                                process.exit(0)
                            } else {
                                console.log("\nError Code: " + response.statusCode)
                                try {
                                    var data = JSON.parse(body)
                                    if (data.status) console.log("Error Status: " + data.status)
                                } catch (e) {}
                                process.exit(0)
                            }

                        })
                    }
                )
            }
        );
    })
})