/**
 * Created by sitesdigital on 13-11-4.
 */
var jsdom = require("jsdom");
var iconv = require('iconv');
var http = require('http');
var async = require('async');
var fs = require("fs");
var jquery = fs.readFileSync("./libs/jquery.js", "utf-8");

var ids = [];
for (var i = 1; i <= 500; i++) {
    ids.push(i);
}

var count=0;

var getbook = function (id, callback) {
    console.info("get book:", id);
    var options = {
        host: 'book.2345.com',
        port: 80,
        path: "/shuku/" + id + ".html"
    };

    http.get(options,function (res) {
        var startTime = new Date().getTime();
        if (res.statusCode == 200) {
            var buffers = [], size = 0;
            res.on('data', function (buffer) {
                buffers.push(buffer);
                size += buffer.length;
            });
            res.on('end', function () {
                var endTime = new Date().getTime();
                var buffer = new Buffer(size), pos = 0;
                for (var i = 0, l = buffers.length; i < l; i++) {
                    buffers[i].copy(buffer, pos);
                    pos += buffers[i].length;
                }
                var gbk_to_utf8_iconv = new iconv.Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');
                var utf8_buffer = gbk_to_utf8_iconv.convert(buffer);
                var body = utf8_buffer.toString();
                //console.log(body);
                jsdom.env({
                    html: body,
                    src: [jquery],
                    done: function (error, window) {
                        try{
                            var $ = window.$;
                            var title = $(".tit_bg .tit").text();
                            count++;
                            callback(null, {"id": id, "title": title, "time": endTime - startTime});
                        }catch (e){
                            callback(null, {"id": id, "title": title,"error": e.message});
                        }finally{
                            if(!!window)
                                window.close();
                        };

                    }
                });
            });

        } else {
            var endTime = new Date().getTime();
            // console.error("id：",id,",error code:"+res.statusCode);
            callback(null, {"id": id, "error": res.statusCode, "time": endTime - startTime});
        }
    }).on('error', function (e) {
            //console.error("id：",id,"Got error: " + e.message);
            callback(null, {"id": id, "error": e.message});
        });
}

var beginTime=new Date().getTime();
async.mapLimit(ids, 50, getbook, function (err, results) {
    console.log(results);
    //console.error(err);
    console.log("time",new Date().getTime()-beginTime);
    console.log("count:",count);
});


