
import { Sprite } from "./sprite.js";
import {
    Graphics,
    Graph,
    Sound,
    Input,
    Useful,
} from "./gameUtils.js";
import {
    Actor,
    ActorDrawingBySelf,
    Hit,
} from "./gameEngine.js";

export var context;
export var canvas;

var gameLoopTimer;

var images: Images;
var input: Input;

const GameState = 
{
    BREAK: -1,
    PLAYING: 0,
    OVER: 1,
} as const
type GameState = typeof GameState[keyof typeof GameState];

var playerName: string="";
var gameState: GameState = GameState.PLAYING;
var gameScore: number=0;

const KEY_USE = ['w', 'a', 's', 'd', 'Enter'];

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416;
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;


var socket = new WebSocket('ws://127.0.0.1:5006');
//var socket = new WebSocket('ws://49.212.155.232:5006');
var isSocketConnect: boolean = false;



window.onload = function() 
{
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) 
    {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        input = new Input(KEY_USE);

        Sprite.init();
        images = new Images();

        SceneChage.init();
        //SceneChage.toTitle();
        SceneChage.toMain();
        
    }
}




// 接続
socket.addEventListener('open',function(e){
    isSocketConnect=true;
    console.log('Socket connection succeeded');
    scoresWrite()
});


socket.addEventListener('message',function(e){
    let d=e.data+"";
    console.log("received: "+d);
    let dat=d.split(',');

    let s=`<div class="center">[ SCORE RANKING ]<br></div>`;
    const size=15;
    for (let i=0; i<size; i++)
    {
        let n=(i+1)+"";
        s+=`<span class="rankorder">${n.padStart(2, '0')}</span>`;
        s+=`<span class="rankname">${dat[size+i]==""?"ANONYMOUS":dat[size+i]}</span>`;
        s+=`<span class="score-number">${dat[i]}</span><br>`
    }
    let par1 = document.getElementById("scores");
    par1.innerHTML = s;

    let par2 = document.getElementById("plays");
    par2.innerHTML = `このゲームは計 ${dat[size*2]} 回プレイされました`

});


function checkForm($this)
{
    let str: string=$this.value;
    while(str.match(/[^A-Z^a-z\d\-\_]/))
    {
        str=str.replace(/[^A-Z^a-z\d\-\_]/,"");
    }
    $this.value=str.toUpperCase().substr(0, 16);
    playerName = $this.value;
}









class Images
{

    wallBlock: Graph = Graphics.loadGraph("./images/punicat_24x24.png");
    fieldTile: Graph = Graphics.loadGraph("./images/fieldtile_16x16.png");
    roadTile: Graph = Graphics.loadGraph("./images/roadtile_16x16.png");
    arrowTile: Graph = Graphics.loadGraph("./images/arrow_16x16.png");
    brick: Graph = Graphics.loadGraph("./images/brick_32x32.png");

    punicat: Graph = Graphics.loadGraph("./images/punicat_24x24.png");
    lockonCursor: Graph = Graphics.loadGraph("./images/lockon_24x24.png");
}


const ActorZ =
{
    CURSOR: -1000,
    PLAYER: 0,
    BACKGRAPHIC: 2000,
} as const;
type ActorZ = typeof ActorZ[keyof typeof ActorZ];



class SceneChage
{
    static init()
    {
        gameLoopTimer = setInterval( function(){},16);
    }
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.setup();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.setup();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}




//タイトル
class Title
{
    static setup()
    {
        new TitleUi();
        gameState = GameState.BREAK;
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();
        if ((input.getMouse.state==Input.Click.RIGHT && Useful.between(input.getMouse.x, 0,SCREEN_WIDTH) && Useful.between(input.getMouse.y, 0,SCREEN_HEIGHT)) ||
            input.getKeyDown['Enter']) 
        {
            Sprite.deleteAll(true);
            Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        // let sp=Sprite.make();
        // Sprite.belong(sp, this);
        // Sprite.drawing(sp, this.drawing);
        // Sprite.offset(sp, 0 , 0, -4096);
        // Useful.drawStringInit();
    }
    drawing(x,y)
    {
        Useful.drawStringEdged(108*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "PUSH 'Enter' TO START THE GAME");
    }
}


//ページ内にスコアランキングを表示する
function scoresWrite()
{
    let send: string="";
    send += gameScore.toString()+",";
    send += playerName;
    if (isSocketConnect)socket.send(send);
}




//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=0;
    static levelUpTime = 120;
    static showLevelUpTime = 0;

    static setup()
    {
        new Test();
        new BackgraphiManager();
        new ArrowController();
        
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GameState.PLAYING:
                {
                    //if (Main.count%12==0) gameScore++;
                    break;
                }
            case GameState.OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        scoresWrite();
                        Sprite.deleteAll(true);
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }


}




// テスト
class Test extends Actor
{
    x: number = 0;

    constructor()
    {
        super();
        this.spr.setImage(images.punicat, 0, 0, 24, 24);
    }

    protected override update(): void 
    {
        //console.log(`${this.time}`);

        this.x++;
        this.spr.setXY(this.x, this.x);
        super.update();
    }

}




// 矢印を動かす
class ArrowController extends Actor
{

    constructor()
    {
        super();
        this.spr.setImage(null, 0, 0, 24, 24);
        this.spr.setZ(ActorZ.CURSOR);
    }

    protected override update(): void
    {
        this.spr.setImage(null);
        for (let x=0; x<Conveyor.ARROW_X; x++)
        {
            for (let y=0; y<Conveyor.ARROW_Y; y++)
            {
                let [x1, y1] = Conveyor.getArrowPos(x, y)
                let [x2, y2] = input.getMouse.getXY;
                let w = 8;

                if (Hit.checkRectReck(
                    x1-w, y1-w, 16+w*2, 16+w*2, 
                    x2/3, y2/3, 1, 1
                ))
                {
                    this.spr.setXY(x1-4, y1-4);
                    this.spr.setImage(images.lockonCursor);
                    break;
                }
            }
        }
        
        super.update();
    }

}




// コンベア制御メソッド
class Conveyor
{
    public static isArrowTile(x: number, y: number): boolean
    {
        return (x+1) % 3==0 && (y+2) % 3==0;
    }

    public static ARROW_X = 8;
    public static ARROW_Y = 5;
    public static getArrowPos(x: number, y: number): [number, number]
    {
        let ret: [number, number] = [(x * 3 + 2) * 16, (y * 3 + 1) * 16];
        return ret;
    }
}







// 背景管理
class BackgraphiManager extends Actor
{
    static sole: BackgraphiManager = null;

    constructor()
    {
        super();
        new Floorlayer();
        new TileLayer();
    }

}


// 基底フィールドレイヤー
abstract class FieldLayerBase extends ActorDrawingBySelf
{
    protected gridUnit = 16;
    protected z: number;

    protected constructor(z: number);
    protected constructor(z: number, gridUnit: number);


    protected constructor(z: number, gridUnit?: number)
    {
        super();
        this.z = z;
        if (gridUnit!=undefined) this.gridUnit = gridUnit;
        this.setSprZ();
    }

    protected setSprZ()
    {
        this.spr.setZ(this.z);
    }

    protected override drawing(hX: number, hY: number): void 
    {
        for (let x=0; x<=(ROUGH_WIDTH/this.gridUnit|0); x++)
        {
            for (let y=0; y<=(ROUGH_HEIGHT/this.gridUnit|0); y++)
            {
                let displayX = (hX|0) + x * this.gridUnit;
                let displayY = (hY|0) + y * this.gridUnit;
                displayX *= ROUGH_SCALE;
                displayY *= ROUGH_SCALE;

                this.chipDrawing(x, y, displayX, displayY);
            }
        }
    }

    protected abstract chipDrawing(matX: number, matY:number, dpX: number, dpY: number): void;
}

// 奥床
class Floorlayer extends FieldLayerBase
{
    constructor()
    {
        super(ActorZ.BACKGRAPHIC);
    }

    protected override chipDrawing(matX: number, matY: number, dpX: number, dpY: number): void
    {
        images.fieldTile.drawGraph(dpX, dpY, 0, 0, 16, 16, ROUGH_SCALE);
    }
}


// タイルレイヤー
class TileLayer extends ActorDrawingBySelf
{
    constructor()
    {
        super();
        this.spr.setZ(ActorZ.BACKGRAPHIC-1);
    }

    protected override drawing(hX: number, hY: number): void 
    {
        for (let x=0; x<Conveyor.ARROW_X; x++)
        {
            for (let y=0; y<Conveyor.ARROW_Y; y++)
            {
                // 矢印
                images.arrowTile.drawGraph(...Useful.xyToRough(Conveyor.getArrowPos(x, y)), 0, 0, 16, 16, ROUGH_SCALE);
            }
        }

        for (let x=-1; x<Conveyor.ARROW_X; x++)
        {
            for (let y=-1; y<Conveyor.ARROW_Y; y++)
            {
                let dpX = (x * 3 + 2) * 16 * ROUGH_SCALE;
                let dpY = (y * 3 + 1) * 16 * ROUGH_SCALE;

                // 横縞
                images.roadTile.drawGraph(dpX + 16*ROUGH_SCALE, dpY, 16, 0, 16, 16, ROUGH_SCALE);
                images.roadTile.drawGraph(dpX + 32*ROUGH_SCALE, dpY, 16, 0, 16, 16, ROUGH_SCALE);

                // 縦縞
                images.roadTile.drawGraph(dpX, dpY + 16*ROUGH_SCALE, 0, 0, 16, 16, ROUGH_SCALE);
                images.roadTile.drawGraph(dpX, dpY + 32*ROUGH_SCALE, 0, 0, 16, 16, ROUGH_SCALE);

                // レンガ
                if (!Useful.between(x, 0, 8-2) || !Useful.between(y, 0, 5-2)) images.brick.drawGraph(dpX + 16*ROUGH_SCALE, dpY + 16*ROUGH_SCALE, 0, 0, 32, 32, ROUGH_SCALE);
            }
        }

        // for (let x=0; x<8-1; x++)
        // {
        //     for (let y=0; y<5-1; y++)
        //     {
        //         // ブロック
        //         let dpX = (x * 3 + 2) * 16 * ROUGH_SCALE;
        //         let dpY = (y * 3 + 1) * 16 * ROUGH_SCALE;

        //         if ((x+y+2) % 2 == 1) images.brick.drawGraph(dpX + 16*ROUGH_SCALE, dpY + 16*ROUGH_SCALE, 0, 0, 32, 32, ROUGH_SCALE);
        //     }
        // }



    }
}


























