const server = require('ws').Server;
//const fs = require('fs');
const ser = new server({port:5007});
//const dataPath = "./data.txt";
let saveData="";


let RECORD_MAX = 15;
var scores=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var playerNames = ["","","","","","","","","","","","","","",""];
var playedCount=0;

ser.on('connection',function(ws){
    //"open", "message", "error", "close"

    ws.on('message',function(message){
        let r = message+"";
        console.log("receive: "+r);
        let arr = r.split(',');
        let sc = parseInt(arr[0],10);
        if (sc>0) playedCount++;

        scores.push(sc);
        playerNames.push(arr[1])
        
        playerSort();

        scores.pop();
        playerNames.pop();
        
        ser.clients.forEach(function(client){
            let send="";
            send += scores.join(',')+','+playerNames.join(',')+','+playedCount;
            console.log("send: "+send);
            saveData = send;
            client.send(send);
            
        });
    });

    ws.on('close',function(){
        //console.log(`I lost a client`);
    });

});


//_ = setInterval(dataSave, 1000*10);
console.log("game-convey server is running up!");
//return;



function playerSort()
{
    let ol=[];
    for (let i=0; i<RECORD_MAX+1; i++)
    {
        ol.push([scores[i], playerNames[i]]);
    }
    ol.sort(function(a, b){return b[0]-a[0]});
    for (let i=0; i<RECORD_MAX+1; i++)
    {
        scores[i] = ol[i][0];
        playerNames[i] = ol[i][1];
    }
}

/*
function dataSave()
{
    fs.writeFileSync(dataPath, saveData);
}
*/




