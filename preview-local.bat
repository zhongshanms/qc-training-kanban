@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  正在启动质检培训看板本地预览...
echo  浏览器请访问:  http://localhost:8765
echo  按 Ctrl+C 停止
echo.
start "" http://localhost:8765
node -e "const http=require('http'),fs=require('fs'),path=require('path');const t={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};http.createServer((q,s)=>{let u='.'+(q.url.split('?')[0]);if(u==='./')u='./index.html';fs.readFile(path.join(__dirname,u),(e,d)=>{if(e){s.writeHead(404);s.end('404');return;}s.writeHead(200,{'Content-Type':t[path.extname(u)]||'application/octet-stream'});s.end(d);});}).listen(8765);"
